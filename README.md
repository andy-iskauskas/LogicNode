Logic Node Package
==================

A <a href="https://www.Numbas.org.uk">Numbas</a> extension for dealing with mathematical logic. It is in two parts: a pure JavaScript implementation (LogicNode.js) and the converted form for use in NUMBAS (Logic.js). The JavaScript implementation and corresponding HTML file is mainly a testing ground for the NUMBAS scripts, and as such should not be considered useful except for adding functions in a low-risk setting. **If you want to use this with NUMBAS, follow the instructions given <a href="http://numbas-editor.readthedocs.io/en/latest/extensions.html">here</a> with the file Logic.js**.

# Logic Nodes

Many of the problems that arise in logic seem difficult to randomise with *vanilla* NUMBAS functions: for example, suppose you want to randomly generate a statement like "not Q and (((Q implies (P or R)) implies P) and not P)" and its conversion to <a href="https://en.wikipedia.org/wiki/Polish_notation">Polish notation</a> or <a href="https://en.wikipedia.org/wiki/Reverse_Polish_notation">Reverse Polish notation</a>. Suppose you wish to be able to generate the truth table for such a statement. This will happily do that, and more besides.

This defines a new object: a **logic node**. Any logic node has a parent, and some children: an OR statement requires two arguments, and so takes two children. In this way, the connections between the nodes produce the parse tree of the system.

#### The tree construction works with a set of node values given in 'level order'. See below for details.

Once the parse tree is built, the statements can be constructed in any of the notational forms, and the truth of the statement given any set of truth values for its parameters can be determined.

## How to use
Working examples for any of the methods in this package can be seen in action in this <a href="https://numbas.mathcentre.ac.uk/exam/share/view/0cecc355-8c07-4992-973e-a7dc748170bc">NUMBAS exam</a>.
#### Note that many of these functions assume variables P,Q,R and so on. If you wish to pass anything manually to the functions, it is advisable to start with variables in this form and replace them in the final result.
### General Usage
The starting point is something from which we can generate a parse tree: either supply a set of statements in an array, *ordered in a particular order*, or use `make_components`. See the below documentation for a description of `make_components`.
The specific ordering of the elements of the array is as follows. For any binary operator, its arguments are the next two unused arguments in the array. For a unary operator, its argument is the next unused element. *This is not the same as Polish notation!* The expression "(NOT (Q OR R)) AND P" is "AND NOT OR Q R P" in Polish notation, whereas it would be passed into functions of this package as ["AND","NOT","P","OR","Q","R"].
Having built the array, the function `string_from_tree` converts it into a string, to be displayed. An argument to `string_from_tree` indicates whether Polish, standard, or reverse Polish notation should be used. For the example above:
```JavaScript
 string_from_tree(["AND","NOT","P","OR","Q","R"],'post'),
 ```
string_from_tree will produce the string "Q R OR NOT P AND". Usage of `make_components` is automatically randomised: it generates a valid statement given a set of conditions.
### Models
The logic node class can also be used to generate models. A model is a collection of statements; for example {P AND Q, R IMPLIES Q, R OR P}. The function `make_model` will randomly make such a model, requiring the number of statements in the model, and the number of distinct variables used. The above example could be generated by `make_model(3,3)`.
### Disjunctive and Conjunctive Normal Form
If one has generated a truth table for a statement, then we can also rewrite the statement in <a href="https://en.wikipedia.org/wiki/Disjunctive_normal_form">Disjunctive</a> or <a href="https://en.wikipedia.org/wiki/Conjunctive_normal_form">Conjunctive</a> Normal Form (DNF or CNF resp.). This is done by `normalForm` for both cases: a Boolean value `isDNF` is used to indicate whether DNF or CNF is required. It gives the most exhaustive (and by no means the most succinct) expression in each case. The statement "(P OR NOT Q) IMPLIES (NOT Q AND NOT P)" has a truth table equivalent to "NOT P" (which is already in DNF and CNF). The output of `normalForm`, on the other hand, would be
```Javascript
normalForm([0,0,1,1],2,true);
// Disjunctive normal form is (NOT P AND Q) OR (NOT P AND NOT Q)
normalForm([0,0,1,1],2,false)
// Conjunctive normal form is (NOT P OR NOT Q) AND (NOT P OR Q)
```
Note that this does not allow for checking equivalent (and shorter) statements in NUMBAS questions: in the example questions this function is used primarily to give a Reveal Answer output.

### Syllogism Generator
A syllogism is a triplet of statements, consisting of a major premise, minor premise, and conclusion; the variables therein are predicate, middle and subject. Depending on the nature of the three statements, the syllogism can be valid, invalid, or valid under a further existential assumption (for details see, e.g. the <a href="https://en.wikipedia.org/wiki/Syllogism">Wiki</a> article). For a set of three categories, and a requirement of validity, one can generate a syllogism. There are two main methods in this: `makeSyllogism` and `parsify` (with an additional function for pluralising words correctly).

Start with a set of three items. Uses `pluralise` to create plurals: it is not a complete representation of the English language, so tread lightly! Choose a random number between 1 and 4 *(future project: have the figure choice as an optional parameter)* corresponding to the figure; i.e. the structure and placement of the predicate, middle, and subject. Choose if you want the generated syllogism to be valid - if it is to be valid, also choose whether it is only valid under an additional assumption. `makeSyllogism` then generates a HTML representation corresponding to this system.

For example, taking ['gadget','grommet','widget'], figure 1, and the syllogism to be true under an additional assumption would be entered as
```JavaScript
makeSyllogism(['gadget','grommet','gadget'],1,true,true);
// Output could be:
/* All gadgets are widgets;
All grommets are gadgets;
Therefore some grommets are widgets. */
```

## Object functions
These descriptions are sparse in detail for some functions: if in doubt, see the comments in Logic.js.
### `expected`
Indicates how many arguments an operator takes (2 for a binary operator AND, OR, IMPLIES; 1 for a unary operator NOT, 0 if none of these options).
### `add_child`
Adds a child node to a given node, if the node does not already have its required number of children. Correspondingly, assigns to the child node a parent value.
### `remove_child`
The opposite of add_child. It does *not* reset the child node's parent to `null`, as for any of the usages it is unecessary.
### `collapse`
Takes a node in a tree and 'collapses' it in a fashion dependent on the required notational output. It takes each value from the node's *collapsed* children and combines them into a string following Polish, standard, or reverse Polish conventions, replacing the node's value with this collapsed value. In this way, the function recursively generates the full parse tree stemming from the node. Presently, this is used exclusively on the first node, but there is scope to use this to partially collapse a parse tree.
### `build_tree`
Given an array of operators and variables, given in *level order* (see above), furnishes the nodes with children and parents and returns an array of those nodes. Often used in conjunction with `string_from_tree`.
### `string_from_tree`
Takes either an array of logic node values, or an array of operators and variables. If the former, it collapses the tree using `collapse()`; if the latter, it builds the tree first and then collapses in the same way. The method used follows the same structure as that for `collapse`.
### `valuation`
Values a statement for a particular valuation of the constituent variables. Broadly speaking, it converts a collection of operators and variables to a infix string, substitutes the values of P,Q,R... and uses the inbuilt logic to evaluate it.
The only complication is in dealing with implication: due to P IMPLIES Q being equivalent to (NOT P) OR Q, `valuation` acts on the level of the nodes to make this subsitution.
### `truth_table`
As with valuation: produces an array corresponding to all possible valuations of a statement.
### `make_model`
Generates a series of simple statements (of the form variable-operator-variable) to collect together as a model {A,B,C,...}. The model itself, for valuation purposes, is parsed as A AND B AND C AND...

## Javascript functions
### `int_to_binary_array`
For a given positive integer n, this generates its binary representation of a given length.

### `isValid`
Checks whether a (randomly generated, usually) array of node values forms a valid statement. A statement must begin with a binary operator OR/AND/IMPLIES, it must always have at least as many operators as variables until the very end, and it must end with two variables. In principle, this limits the placement of any unary operator NOT, but is not a problem in practice.

### `make_components`
Takes three integer values: the number of operands in the expression, the number of distinct variables, and the number of occurences of negation in the statement. It generates an array of node values which can then be passed to `build_tree`, `string_from_tree` or `valuation`. Due to the way in which it assigns the variable names, no more than 11 different variables can be used in a given statement. After randomly generating an array, it then reorders until it corresponds to a valid statement.
```JavaScript
make_components(2,2,1)
\\ Output could be ['AND','NOT','P','Q']
```

### `evaluate`
A series of string replacements in order to value a statement containing P,Q,R... and any of AND, OR, NOT. Note that if you wish to value a statement using IMPLIES, it must first be passed through the `LogicNode` function `valuation`.

### `truth_table`
As above, but acting solely on strings. Mainly for use in custom marking for NUMBAS questions.

### `genPatt`
Makes a pattern from ["A","E","I","O"] to build into a syllogism. See `parsify` and `makeSyllogism` for details of what A, E, I, O correspond to.

### `pluralise`
An attempt to take the most common English rules for pluralisation and codify them. Not exhaustive, but workable. Used in `parsify`.

### `parsify`
Takes an array corresponding to the structure of line of the syllogism, and an array of the middle, subject, predicate (in that order), and converts it into a grammatical English statement. In the first array, the ordering is [O,R,O], where O is one of M, S or P; R is converted as follows.
- A: "All...are..."
- E: "No...are..."
- I: "Some...are..."
- O: "Some...are not..."

For example
```Javascript
parsify([M,I,P],['gadget','grommet','widget'])
// Output is 'Some gadgets are widgets'
parsify([P,A,S],['man','woman','person'])
// Output is 'All women are people'
```

### `makeSyllogism`
Takes an array of middle, subject, predicate; a figure type; a determiner for the validity of the syllogism, and an existential determiner. The figure identifier corresponds to a structure; if 'M-P' corresponds to middle-relationship-predicate, then the syllogisms are structured as
1. M-P; S-M; S-P
2. P-M; S-M; S-P
3. M-P; M-S; S-P
4. P-M; M-S; S-P

From the figure and the 'truthiness' required, it generates the relationships: there are 64 possibilities, only 6 of which are valid for a given figure. Following the convention described in `parsify`, the valid syllogisms are
1. AAA, EAE, AII, EIO, *AAI*, *EAO*
2. EAE, AEE, EIO, AOO, *EAO*, *AEO*,
3. AII, IAI, EIO, OAO, *EAO*, *AAI*
4. AEE, IAI, EIO, *AEO*, *EAO*, *AAI*

where the *italicised* patterns are valid under additional existence assumptions. If a false syllogism is required, it will randomly generate a string of three letters from {A,E,I,O} using `genPatt` and check that it isn't valid, regenerating as necessary.
Once this has been generated, `parsify` is use to convert the symbolic statement into English.

### `statement_from_truth`
Generates a disjunctive or conjunctive constituent statement from a particular parameter valuation. See details of `normalForm`.

## JME functions
Where the names of these functions diverge from those listed above, the related function is *highlighted* alongside.
- `int_to_binary_array`
- `make_components`
- `string_from_tree`
- `truth_value` *valuation*
- `truth_table_results` *truth_table*
- `texify`
- `syllogism` *makeSyllogism*
- `normal_form` *normalForm*
- `make_model`
