var estraverse = require('estraverse'),
    esprima = require('esprima'),
    EsNode = require('./esnode'),
    syntax = estraverse.Syntax;

function traverseContext (context, events, pairs) {
    context.args.forEach(function (arg) {
        var espathToPair = {};
        onEachEsNode(arg, context.source.content, function (esNode) {
            var pair;
            if (!esNode.isCaptured()) {
                if (isTargetBinaryExpression(esNode.getParentEsNode()) && esNode.currentNode.type === syntax.Literal) {
                    espathToPair[esNode.parentEspath][esNode.currentProp] = {code: esNode.code(), value: esNode.value()};
                }
                return;
            }
            events.push({value: esNode.value(), espath: esNode.espath, loc: esNode.location()});
            if (isTargetBinaryExpression(esNode.getParentEsNode())) {
                espathToPair[esNode.parentEspath][esNode.currentProp] = {code: esNode.code(), value: esNode.value()};
            }
            if (isTargetBinaryExpression(esNode)) {
                pair = {
                    operator: esNode.currentNode.operator,
                    value: esNode.value()
                };
                espathToPair[esNode.espath] = pair;
            }
        });
        Object.keys(espathToPair).forEach(function (espath) {
            var pair = espathToPair[espath];
            if (pair.left && pair.right) {
                pairs.push(pair);
            }
        });
    });
}

function isTargetBinaryExpression (esNode) {
    return esNode &&
        esNode.currentNode.type === syntax.BinaryExpression &&
        (esNode.currentNode.operator === '===' || esNode.currentNode.operator === '==') &&
        esNode.isCaptured() &&
        !(esNode.value());
}

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
                esNode.setParentEsNode(nodeStack[nodeStack.length - 1]);
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


module.exports = traverseContext;
