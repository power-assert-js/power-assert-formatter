'use strict';

var estraverse = require('estraverse');
var acorn = require('acorn');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var EsNode = require('./esnode');

function ContextTraversal (context) {
    this.context = context;
    EventEmitter.call(this);
}
inherits(ContextTraversal, EventEmitter);

ContextTraversal.prototype.traverse = function () {
    var _this = this;
    this.context.args.forEach(function (arg) {
        onEachEsNode(arg, _this.context.source.content, function (esNode) {
            _this.emit('esnode', esNode);
        });
    });
};

function onEachEsNode(arg, jsCode, callback) {
    var tokens = [];
    var jsAST = acorn.parse(jsCode, {ecmaVersion: 6, locations: true, onToken: tokens});
    var espathToValue = arg.events.reduce(function (accum, ev) {
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
