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
    var jsAST = esprima.parse(jsCode, {sourceType: 'module', tolerant: true, loc: true, tokens: true, raw: true});
    var tokens = jsAST.tokens;
    var espathToValue = reduce(arg.events, function (accum, ev) {
        accum[ev.espath] = ev.value;
        return accum;
    }, {});
    var nodeStack = [];
    estraverse.traverse(extractExpressionFrom(jsAST), {
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

function extractExpressionFrom (tree) {
    var expressionStatement = tree.body[0];
    var expression = expressionStatement.expression;
    return expression;
}

module.exports = ContextTraversal;
