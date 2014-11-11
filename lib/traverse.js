'use strict';

var estraverse = require('estraverse'),
    esprima = require('esprima'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    EsNode = require('./esnode');

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
    var jsAST = esprima.parse(jsCode, {tolerant: true, loc: true, tokens: true, raw: true}),
        espathToValue = arg.events.reduce(function (accum, ev) {
            accum[ev.espath] = ev.value;
            return accum;
        }, {}),
        nodeStack = [];
    estraverse.traverse(extractExpressionFrom(jsAST), {
        enter: function (currentNode, parentNode) {
            var esNode = new EsNode(this.path(), currentNode, parentNode, espathToValue, jsCode, jsAST);
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
    var expressionStatement = tree.body[0],
        expression = expressionStatement.expression;
    return expression;
}

module.exports = ContextTraversal;
