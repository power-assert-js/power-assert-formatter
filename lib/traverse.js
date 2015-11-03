'use strict';

var estraverse = require('estraverse');
var esprima = require('esprima');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var EsNode = require('./esnode');
var forEach = require('array-foreach');
var reduce = require('array-reduce');

function ContextTraversal (context) {
    this.context = context;
    EventEmitter.call(this);
}
inherits(ContextTraversal, EventEmitter);

ContextTraversal.prototype.traverse = function () {
    var _this = this;
    forEach(this.context.args, function (arg) {
        onEachEsNode(arg, _this.context.source.content, function (esNode) {
            _this.emit('esnode', esNode);
        });
    });
};

function onEachEsNode(arg, jsCode, callback) {
    var parseResult = parse(jsCode);
    var tokens = parseResult.tokens;
    var espathToValue = reduce(arg.events, function (accum, ev) {
        accum[ev.espath] = ev.value;
        return accum;
    }, {});
    var nodeStack = [];
    estraverse.traverse(parseResult.expression, {
        enter: function (currentNode, parentNode) {
            var esNode = new EsNode(this.path(), currentNode, parentNode, espathToValue, jsCode, tokens);
            if (1 < nodeStack.length) {
                esNode.setParent(nodeStack[nodeStack.length - 1]);
            }
            nodeStack.push(esNode);
            callback(esNode);
        },
        leave: function (currentNode, parentNode) {
            nodeStack.pop();
        }
    });
}

function parserOptions() {
    return {sourceType: 'module', tolerant: true, loc: true, tokens: true, raw: true};
}

function wrappedInGenerator(jsCode) {
    return 'function *wrapper() {\n' + jsCode + '\n}';
}

function parse(jsCode) {
    var ast;
    var top;
    try {
        // Try parsing the raw line of code, without wrapping.
        top = ast = esprima.parse(jsCode, parserOptions());
    } catch (e) {
        // Esprima will throw an error if YieldExpressions are not inside a generator function.
        // Since we only have a single line of code to work with; wrap it with a dummy generator function;
        // then unwrap the original code from the resulting AST.
        ast = esprima.parse(wrappedInGenerator(jsCode), parserOptions());
        top = ast.body[0].body;
    }
    return {
        tokens: ast.tokens,
        expression: extractExpressionFrom(top)
    };
}

function extractExpressionFrom (tree) {
    var expressionStatement = tree.body[0];
    var expression = expressionStatement.expression;
    return expression;
}

module.exports = ContextTraversal;
