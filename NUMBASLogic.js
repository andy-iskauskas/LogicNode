function int_to_binary_array(n, len)
{
  var outArr = [];
  while (n>0)
  {
    outArr.push(n%2);
    n = Math.floor(n/2);
  }
  while (outArr.length < len)
    outArr.push(0);
  return outArr.reverse();
}

function isValid(arr)
{
  if (arr[0]!="AND"&&arr[0]!="OR"&&arr[0]!="IMPLIES")
    return false;
  if (arr[arr.length-1].length!=1||arr[arr.length-2].length!=1)
    return false;
  var i, varct = 0, opct = 0;
  for (i=0; i<arr.length-1; i++)
  {
    if (arr[i].length==1)
      varct++;
    if (arr[i]=="OR"||arr[i]=="AND"||arr[i]=="IMPLIES")
      opct++;
    if (varct>opct)
      return false;
  }
  return true;
}

function make_components(operands,variables,nots)
{
  var varArr = [], opArr = ["AND","OR","IMPLIES"], outArr = [], k;
  for (k=0; k<variables; k++)
    varArr.push(String.fromCharCode(80+k));
  for (k=0; k<operands; k++)
  {
    if (k<variables)
      outArr.push(varArr[k]);
    else
      outArr.push(Numbas.math.shuffle(varArr)[0]);
  }
  for (k=0; k<nots; k++)
    outArr.push("NOT");
  for (k=0; k<operands-1; k++)
    outArr.push(Numbas.math.shuffle(opArr)[0]);
  while(!isValid(outArr))
    outArr = Numbas.math.shuffle(outArr);
  return outArr;
}

Numbas.addExtension('Logic',['jme','jme-display','math'],function(logic)
{
  var logicScope = logic.scope;

  var LogicNode = logic.LogicNode = function(value)
  {
    this.parent = null;
    this.value = value;
    this.children = [];
  }

  LogicNode.prototype = {
    toString: function() { return this.value; },
    toLaTeX: function() {return this.value; },
    expected: function()
    {
      if (this.value == "AND" || this.value == "OR" || this.value == "IMPLIES")
        return 2;
      else if (this.value == "NOT")
        return 1;
      else
        return 0;
    },
    add_child: function(child)
    {
      if (this.children.length < this.expected())
      {
        this.children.push(child);
        child.parent = this;
      }
      return this;
    },
    remove_child: function()
    {
      this.children.shift();
    },
    collapse: function(method)
    {
      var i, kids =  this.children.length;
      switch (kids)
      {
        case 2:
  				if (method == "in")
  					this.value = "(" + this.children[0].collapse(method) + " " + this.value + " " + this.children[1].collapse(method) + ")";
  				else if (method == "pre")
  					this.value = this.value + " " + this.children[0].collapse(method) + " " + this.children[1].collapse(method);
  				else if (method == "post")
  					this.value = this.children[0].collapse(method) + " " + this.children[1].collapse(method) + " " + this.value;
  				break;
  			case 1:
  				if (method == "in")
  					this.value = "(" +  this.value + " " + this.children[0].collapse(method) + ")";
  				else if (method == "pre")
  					this.value = this.value + " " + this.children[0].collapse(method);
  				else if (method == "post")
  					this.value = this.children[0].collapse(method) + " " + this.value;
  				break;
  			case 0:
  			default:
      }
      return this.value;
    }
  }

  function build_tree(valArr)
  {
    var mainArr = [], i;
    for (i=0; i<valArr.length; i++)
      mainArr.push(new LogicNode(valArr[i]));
    var ind = 0;
    for (i=0; i<mainArr.length; i++)
    {
      var node = mainArr[i];
      if (node.expected() > 1)
      {
        ind++;
        node.add_child(mainArr[ind]);
      }
      if (node.expected() > 0)
      {
        ind++;
        node.add_child(mainArr[ind]);
      }
    }
    return mainArr;
  }

  function string_from_tree(valArr,method)
  {
    var nodeArr = build_tree(valArr);
    nodeArr[0].collapse(method);
    return nodeArr[0].value;
  }

  function valuation(valArr,vals)
  {
  	var i, nodeArr = build_tree(valArr);
  	for (i=0; i<nodeArr.length; i++)
  	{
  		var nd = nodeArr[i];
  		if (nd.value == "IMPLIES")
  		{
  			nd.value = "OR";
  			var tempnd = nd.children[0];
  			var notNode = new LogicNode("NOT");
  			nd.remove_child();
  			nd.add_child(notNode);
  			nd.children.reverse();
  			notNode.add_child(tempnd);
  			nodeArr.push(notNode);
  		}
  	}
  	var infix = string_from_tree(nodeArr,"in");
  	infix = infix.replace(/NOT/g,"!").replace(/AND/g,"\&\&").replace(/OR/g,"||");
  	for (i=0; i<vals.length; i++)
  	{
  		var reg = new RegExp(String.fromCharCode(80+i),"g");
  		infix = infix.replace(reg,vals[i]);
  	}
  	return Boolean(eval(infix));
  }

  function truth_table(valArr, noofvals)
  {
  	var outArr = [], i;
  	for (i=Math.pow(2,noofvals)-1; i>=0; i--)
  		outArr.push(valuation(valArr,int_to_binary_array(i,noofvals)));
  	return outArr;
  }

  var funcObj = Numbas.jme.funcObj;
  var TString = Numbas.jme.types.TString;
  var TNum = Numbas.jme.types.TNum;
  var TList = Numbas.jme.types.TList;
  var TBool = Numbas.jme.types.TBool

  logicScope.addFunction(new funcObj('make_components',[TNum,TNum,TNum],TList, function(ops,args,nots){return make_components(ops,args,nots);}, {unwrapValues: true}));
  logicScope.addFunction(new funcObj('string_from_tree',[TList,TString],TString, function(arr,how){return string_from_tree(arr,how);}, {unwrapValues: true}));
  logicScope.addFunction(new funcObj('truth_value',[TList,TList],TBool, function(arr,vals){return valuation(arr,vals);}, {unwrapValues: true}));
  logicScope.addFunction(new funcObj('truth_table_results',[TList,TNum],TList,function(str,noofvals){ return truth_table(str,noofvals);}, {unwrapValues: true}));

})
