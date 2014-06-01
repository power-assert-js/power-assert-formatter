/**
 * power-assert-formatter.js - Power Assert output formatter
 *
 * https://github.com/twada/power-assert-formatter
 *
 * Copyright (c) 2013-2014 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/twada/power-assert-formatter/blob/master/MIT-LICENSE.txt
 *
 * A part of extend function is:
 *   Copyright 2012 jQuery Foundation and other contributors
 *   Released under the MIT license.
 *   http://jquery.org/license
 */
'use strict';

var estraverse = require('estraverse'),
    esprima = require('esprima'),
    DiffMatchPatch = require('googlediff'),
    defaultStringifier = require('./lib/stringify'),
    defaultComparator = require('./lib/comparator'),
    multibyteStringWidthOf = require('./lib/string-width'),
    EsNode = require('./lib/esnode'),
    syntax = estraverse.Syntax;


function defaultOptions () {
    return {
        lineDiffThreshold: 5,
        stringifyDepth: 2,
        lineSeparator: '\n'
    };
}


function PowerAssertContextRenderer (config) {
    this.config = config;
    this.stringify = config.stringify;
    this.compare = config.compare;
    this.widthOf = config.widthOf;
    this.initialVertivalBarLength = 1;
}

PowerAssertContextRenderer.prototype.init = function (context) {
    this.context = context;
    this.assertionLine = context.source.content;
    this.filepath = context.source.filepath;
    this.lineNumber = context.source.line;
    this.initializeRows();
};

PowerAssertContextRenderer.prototype.initializeRows = function () {
    this.rows = [];
    for (var i = 0; i <= this.initialVertivalBarLength; i += 1) {
        this.addOneMoreRow();
    }
};

PowerAssertContextRenderer.prototype.newRowFor = function (assertionLine) {
    return createRow(this.widthOf(assertionLine), ' ');
};

PowerAssertContextRenderer.prototype.addOneMoreRow = function () {
    this.rows.push(this.newRowFor(this.assertionLine));
};

PowerAssertContextRenderer.prototype.lastRow = function () {
    return this.rows[this.rows.length - 1];
};

PowerAssertContextRenderer.prototype.renderVerticalBarAt = function (columnIndex) {
    var i, lastRowIndex = this.rows.length - 1;
    for (i = 0; i < lastRowIndex; i += 1) {
        this.rows[i].splice(columnIndex, 1, '|');
    }
};

PowerAssertContextRenderer.prototype.renderValueAt = function (columnIndex, dumpedValue) {
    var i, width = this.widthOf(dumpedValue);
    for (i = 0; i < width; i += 1) {
        this.lastRow().splice(columnIndex + i, 1, dumpedValue.charAt(i));
    }
};

PowerAssertContextRenderer.prototype.isOverlapped = function (prevCapturing, nextCaputuring, dumpedValue) {
    return (typeof prevCapturing !== 'undefined') && this.startColumnFor(prevCapturing) <= (this.startColumnFor(nextCaputuring) + this.widthOf(dumpedValue));
};

PowerAssertContextRenderer.prototype.constructRows = function (capturedEvents) {
    var that = this,
        prevCaptured;
    capturedEvents.forEach(function (captured) {
        var dumpedValue = that.stringify(captured.value);
        if (that.isOverlapped(prevCaptured, captured, dumpedValue)) {
            that.addOneMoreRow();
        }
        that.renderVerticalBarAt(that.startColumnFor(captured));
        that.renderValueAt(that.startColumnFor(captured), dumpedValue);
        prevCaptured = captured;
    });
};

PowerAssertContextRenderer.prototype.startColumnFor = function (captured) {
    return this.widthOf(this.assertionLine.slice(0, captured.loc.start.column));
};

PowerAssertContextRenderer.prototype.renderLines = function () {
    var that = this,
        lines = [],
        events = [],
        pairs = [];

    if (this.filepath) {
        lines.push('# ' + [this.filepath, this.lineNumber].join(':'));
    } else {
        lines.push('# at line: ' + this.lineNumber);
    }
    lines.push('');
    lines.push(this.assertionLine);

    traverseContext(this.context, events, pairs);

    events.sort(rightToLeft);
    this.constructRows(events);
    this.rows.forEach(function (columns) {
        lines.push(columns.join(''));
    });

    pairs.forEach(function (pair) {
        that.compare(pair, lines);
    });

    lines.push('');
    return lines;
};


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



function createRow (numCols, initial) {
    var row = [], i;
    for(i = 0; i < numCols; i += 1) {
        row[i] = initial;
    }
    return row;
}


function rightToLeft (a, b) {
    return b.loc.start.column - a.loc.start.column;
}




// borrowed from qunit.js
function extend (a, b) {
    var prop;
    for (prop in b) {
        if (b.hasOwnProperty(prop)) {
            if (typeof b[prop] === 'undefined') {
                delete a[prop];
            } else {
                a[prop] = b[prop];
            }
        }
    }
    return a;
}


function create (options) {
    var config = extend(defaultOptions(), (options || {}));
    if (typeof config.widthOf !== 'function') {
        config.widthOf = multibyteStringWidthOf;
    }
    if (typeof config.stringify !== 'function') {
        config.stringify = defaultStringifier(config);
    }
    if (typeof config.compare !== 'function') {
        config.compare = defaultComparator(config);
    }
    return function (context) {
        var renderer = new PowerAssertContextRenderer(config);
        renderer.init(context);
        return renderer.renderLines().join(config.lineSeparator);
    };
}

create.PowerAssertContextRenderer = PowerAssertContextRenderer;
create.constructorNameOf = require('./lib/constructor-name');
create.typeNameOf = require('./lib/type-name');
create.isComparedByValue = require('./lib/is-compared-by-value');
module.exports = create;
