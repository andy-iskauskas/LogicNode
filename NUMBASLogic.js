Numbas.addExtension('Logic',['jme','jme-display','math'],function(logic)
{
  var logicScope = logic.scope;

  class LogicNode
  {
  	constructor(value)
  	{
  		this.parent = null;
  		this.value = value;
  		this.children = [];
  		this.unique = null;
  		this.level = null;
  		this.coords = [0,0];
  	}

  	get parent(){return this._parent}
  	set parent(val){this._parent = val}

  	get unique(){return this._unique}
  	set unique(val){this._unique = counter; counter++}

  	get value(){return this._value}
  	set value(val){this._value = val}

  	get children(){return this._children}
  	set children(child)
  	{
  		if (this._children instanceof Array)
  		{
  			if (this._children.length < this.expected())
  				this._children.push(child);
  			else {}
  		}
  		else
  			this._children = [];
  	}

  	get level(){return this._level}
  	set level(val)
  	{
  		var lvl = 0;
  		var focusnode = this;
  		while (focusnode.parent != null)
  		{
  			lvl++;
  			focusnode = focusnode.parent;
  		}
  		this._level = lvl;
  	}

  	get coords(){return this._coords}
  	set coords(val)
  	{
  		if (val instanceof Array && val.length == 2)
  			this._coords = val;
  	}

  	addChild(child)
  	{
  		this.children = child;
  		child.parent = this;
  		child.level = null;
  		child.coords = [0,0];
  	}

  	removeChild()
  	{
  		this.children.shift();
  	}

  	expected()
  	{
  		if (this.value == "AND" || this.value == "OR" || this.value == "IMPLIES")
  			return 2;
  		else if (this.value == "NOT")
  			return 1;
  		else
  			return 0;
  	}

  	collapse(method)
  	{
  		var i, kids = this.children.length;
  		if (kids != this.expected())
  		{
  			console.log("Can't collapse node " + this.unique + ": number of children should be " + this.expected() + " and is actually " + this.children.length + ".");
  			return null;
  		}
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

  function findNode(arr,unique)
  {
  	var i;
  	for (i=0; i<arr.length; i++)
  	{
  		if (arr[i].unique == unique)
  			return i;
  	}
  	return -1;
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
  			node.addChild(mainArr[ind]);
  		}
  		if (node.expected() > 0)
  		{
  			ind++;
  			node.addChild(mainArr[ind]);
  		}
  	}
  	return mainArr;
  }

  function string_from_tree(elem,method)
  {
  	var i, nodeArr;
  	if (elem instanceof Array)
  	{
  		if (elem[0] instanceof LogicNode)
  			nodeArr = elem;
  		else
  			nodeArr = build_tree(elem);
  	}
  	for (i=0; i<nodeArr.length; i++)
  	{
  		if (nodeArr[i].parent == null)
  		{
  			nodeArr[i].collapse(method);
  			break;
  		}
  	}
  	var result = nodeArr[0].value;
  	if (method == "in")
  		result = result.slice(1,result.length-1);
  	return result;
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
  			nd.removeChild();
  			nd.addChild(notNode);
  			nd.children.reverse();
  			notNode.addChild(tempnd);
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

  logicScope.addFunction(new funcObj('make_components',[TNum,TNum,TNum],TList, function(ops,args,nots){return make_components(ops,args,nots);}, {unwrapValues = true;}));
  logicScope.addFunction(new funcObj('string_from_tree',[TList,TString],TString, function(arr,how){return string_from_tree(arr,how);}, {unwrapValues = true;}));
  logicScope.addFunction(new funcObj('truth_table_results',[TString,TNum],TList,function(str,noofvals){ return truth_table(str,noofvals);}, {unwrapValues = true;}));

}