/*Comments!
Parse tree visualisation!
*/

"use strict";
var counter = 1;
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

function shuffle(arr)
{
	var j, x, i;
	for (i=arr.length-1; i>0; i--)
	{
		j = Math.floor(Math.random()*(i+1));
		arr = swap(arr,i,j);
	}
	return arr;
}

function swap(arr, i, j)
{
	var x = arr[i];
	arr[i] = arr[j];
	arr[j] = x;
	return arr;
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
			outArr.push(shuffle(varArr)[0]);
	}
	for (k=0; k<nots; k++)
		outArr.push("NOT");
	for (k=0; k<operands-1; k++)
		outArr.push(shuffle(opArr)[0]);
	while(!isValid(outArr))
		shuffle(outArr);
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

function set_coords(nodeArr)
{
	var maxlvl = 0, i, off = 25;
	for (i=0; i<nodeArr.length; i++)
	{
		if (nodeArr[i].level > maxlvl)
			maxlvl = nodeArr[i].level;
	}
	for (i=0; i<nodeArr.length; i++)
	{
		var ycoord = off*nodeArr[i].level, xcoord = 0, focalnode = nodeArr[i];
		while (focalnode.parent != null)
		{
			var par = focalnode.parent;
			if (par.children[0].unique == focalnode.unique)
				xcoord -= (maxlvl-focalnode.level+1)*off;
			else
				xcoord += (maxlvl-focalnode.level+1)*off;
			focalnode = focalnode.parent;
		}
		nodeArr[i].coords = [xcoord,ycoord];
	}
	return nodeArr;
}

function tree_to_canvas(valArr,cvs)
{
	var c = document.getElementById(cvs);
	var ctx = c.getContext("2d");
	var nodes = set_coords(build_tree(valArr)), i;
	var maxleft = 0, maxright = 0, maxdepth = 0;
	for (i=0; i<nodes.length; i++)
	{
		if (nodes[i].coords[0] < maxleft)
			maxleft = nodes[i].coords[0];
		if (nodes[i].coords[0] > maxright)
			maxright = nodes[i].coords[0];
		if (nodes[i].coords[1] > maxdepth)
			maxdepth = nodes[i].coords[1];
	}
	c.width = maxright - maxleft + 100, c.height = maxdepth + 100;
	for (i=0; i<nodes.length; i++)
		nodes[i].coords = [nodes[i].coords[0]+50-maxleft,nodes[i].coords[1]+50];
	for (j=0; j<nodes.length; j++)
	{
		var node = nodes[j];
		if (node.expected()!=0)
		{
			for (i=0; i<node.children.length; i++)
			{
				ctx.moveTo(node.coords[0],node.coords[1]);
				ctx.lineTo(node.children[i].coords[0],node.children[i].coords[1]);
				ctx.stroke();
			}
		}
		var textoffset = 0;
		if (node.value.length == 1)
			textoffset = 10;
		else
			textoffset = -5;
		ctx.textAlign = "center";
		ctx.fillText(node.value,node.coords[0],node.coords[1]+textoffset);
	}
}

function copyArr(arr)
{
	var outarr = [], i;
	for (i=0; i<arr.length; i++)
	{
		outarr.push(arr[i]);
	}
	return outarr;
}

function makeSyllogism(arr)
{
	if (arr.length>3)
		return null;
	var arr1 = copyArr(arr), arr2 = shuffle(copyArr(arr));
	while (arr2[0]==arr1[2])
		shuffle(arr2);
	var args = arr1.concat(arr2);
	console.log(args);
	var connectives = shuffle([["All ","s"," are ","s"],["Some ",""," is a ",""],["No ","s"," are ","s"],["Some ",""," is not a ",""]]);
	var i, tempstr = "";
	for (i=0; i<3; i++)
	{
		var temparr = connectives[i];
		if (i==2)
			tempstr += "Therefore " + temparr[0].toLowerCase() + args[2*i] + temparr[1] + temparr[2] + args[2*i+1] + temparr[3] + ".";
		else
			tempstr += temparr[0] + args[2*i] + temparr[1] + temparr[2] + args[2*i+1] + temparr[3] + ";<br>";
	}
	return tempstr;
}
