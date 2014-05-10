/**
 * power-assert-formatter.js - Power Assert output formatter
 *
 * https://github.com/twada/power-assert-formatter
 *
 * Copyright (c) 2013-2014 Takuto Wada
 * Licensed under the MIT license.
 *   https://raw.github.com/twada/power-assert-formatter/master/MIT-LICENSE.txt
 *
 * A part of extend function is:
 *   Copyright 2012 jQuery Foundation and other contributors
 *   Released under the MIT license.
 *   http://jquery.org/license
 */
(function (root, factory) {
    'use strict';
    /*jshint camelcase: false */

    // using returnExports UMD pattern
    if (typeof define === 'function' && define.amd) {
        define(['estraverse', 'esprima', 'diff_match_patch'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('estraverse'), require('esprima'), require('googlediff'));
    } else {
        root.powerAssertFormatter = factory(root.estraverse, root.esprima, root.diff_match_patch);
    }
}(this, function (estraverse, esprima, DiffMatchPatch) {
    'use strict';

    var syntax = estraverse.Syntax;

    function defaultOptions () {
        return {
            lineDiffThreshold: 5,
            stringifyDepth: 2,
            lineSeparator: '\n',
            widthOf: multibyteStringWidthOf
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


    function defaultComparator(config) {
        var dmp = new DiffMatchPatch();

        function udiffLines(text1, text2) {
            /*jshint camelcase: false */
            var a = dmp.diff_linesToChars_(text1, text2),
                diffs = dmp.diff_main(a.chars1, a.chars2, false);
            dmp.diff_charsToLines_(diffs, a.lineArray);
            dmp.diff_cleanupSemantic(diffs);
            return dmp.patch_toText(dmp.patch_make(text1, diffs));
        }

        function udiffChars (text1, text2) {
            /*jshint camelcase: false */
            var diffs = dmp.diff_main(text1, text2, false);
            dmp.diff_cleanupSemantic(diffs);
            return dmp.patch_toText(dmp.patch_make(text1, diffs));
        }

        function shouldUseLineLevelDiff (text) {
            return config.lineDiffThreshold < text.split(/\r\n|\r|\n/).length;
        }

        function isStringDiffTarget(pair) {
            return typeof pair.left.value === 'string' && typeof pair.right.value === 'string';
        }

        function isComparable(pair) {
            return isSimpleComparable(pair.left.value) && isSimpleComparable(pair.right.value);
        }

        function isSimpleComparable(obj) {
            switch(typeof obj) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'undefined':
                return true;
            default:
                return false;
            }
        }

        function showExpectedAndActual (pair, lines) {
            lines.push('');
            lines.push('$$$ [' + typeof pair.right.value + '] ' + pair.right.code);
            lines.push('### [' + typeof pair.left.value  + '] ' + pair.left.code);
            lines.push('$ ' + config.stringify(pair.right.value));
            lines.push('# ' + config.stringify(pair.left.value));
        }

        function showStringDiff (pair, lines) {
            var patch;
            if (shouldUseLineLevelDiff(pair.right.value)) {
                patch = udiffLines(pair.right.value, pair.left.value);
            } else {
                patch = udiffChars(pair.right.value, pair.left.value);
            }
            lines.push('');
            lines.push('--- [' + typeof pair.right.value + '] ' + pair.right.code);
            lines.push('+++ [' + typeof pair.left.value +  '] ' + pair.left.code);
            lines.push(decodeURIComponent(patch));
        }

        return function (pair, lines) {
            if (isStringDiffTarget(pair)) {
                showStringDiff(pair, lines);
            } else if (isComparable(pair)) {
                showExpectedAndActual(pair, lines);
            }
        };
    }


    function EsNode (path, currentNode, parentNode, espathToValue, jsCode, jsAST) {
        if (path) {
            this.espath = path.join('/');
            this.parentEspath = path.slice(0, path.length - 1).join('/');
            this.currentProp = path[path.length - 1];
        } else {
            this.espath = '';
            this.parentEspath = '';
            this.currentProp = null;
        }
        this.currentNode = currentNode;
        this.parentNode = parentNode;
        this.parentEsNode = null;
        this.espathToValue = espathToValue;
        this.jsCode = jsCode;
        this.jsAST = jsAST;
    }
    EsNode.prototype.setParentEsNode = function (parentEsNode) {
        this.parentEsNode = parentEsNode;
    };
    EsNode.prototype.getParentEsNode = function () {
        return this.parentEsNode;
    };
    EsNode.prototype.code = function () {
        return this.jsCode.slice(this.currentNode.loc.start.column, this.currentNode.loc.end.column);
    };
    EsNode.prototype.value = function () {
        if (this.currentNode.type === syntax.Literal) {
            return this.currentNode.value;
        }
        return this.espathToValue[this.espath];
    };
    EsNode.prototype.isCaptured = function () {
        return this.espathToValue.hasOwnProperty(this.espath);
    };
    EsNode.prototype.location = function () {
        return locationOf(this.currentNode, this.jsAST.tokens);
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


    function locationOf(currentNode, tokens) {
        switch(currentNode.type) {
        case syntax.MemberExpression:
            return propertyLocationOf(currentNode, tokens);
        case syntax.CallExpression:
            if (currentNode.callee.type === syntax.MemberExpression) {
                return propertyLocationOf(currentNode.callee, tokens);
            }
            break;
        case syntax.BinaryExpression:
        case syntax.LogicalExpression:
        case syntax.AssignmentExpression:
            return infixOperatorLocationOf(currentNode, tokens);
        default:
            break;
        }
        return currentNode.loc;
    }


    function propertyLocationOf(memberExpression, tokens) {
        var prop = memberExpression.property,
            token;
        if (!memberExpression.computed) {
            return prop.loc;
        }
        token = findLeftBracketTokenOf(memberExpression, tokens);
        return token ? token.loc : prop.loc;
    }


    // calculate location of infix operator for BinaryExpression, AssignmentExpression and LogicalExpression.
    function infixOperatorLocationOf (expression, tokens) {
        var token = findOperatorTokenOf(expression, tokens);
        return token ? token.loc : expression.left.loc;
    }


    function findLeftBracketTokenOf(expression, tokens) {
        var fromLine = expression.loc.start.line,
            toLine = expression.property.loc.start.line,
            fromColumn = expression.property.loc.start.column;
        return searchToken(tokens, fromLine, toLine, function (token, index) {
            var prevToken;
            if (token.loc.start.column === fromColumn) {
                prevToken = tokens[index - 1];
                if (prevToken.type === 'Punctuator' && prevToken.value === '[') {
                    return prevToken;
                }
            }
            return undefined;
        });
    }


    function findOperatorTokenOf(expression, tokens) {
        var fromLine = expression.left.loc.end.line,
            toLine = expression.right.loc.start.line,
            fromColumn = expression.left.loc.end.column,
            toColumn = expression.right.loc.start.column;
        return searchToken(tokens, fromLine, toLine, function (token, index) {
            if (fromColumn < token.loc.start.column &&
                token.loc.end.column < toColumn &&
                token.type === 'Punctuator' &&
                token.value === expression.operator) {
                return token;
            }
            return undefined;
        });
    }


    function searchToken(tokens, fromLine, toLine, predicate) {
        var i, token, found;
        for(i = 0; i < tokens.length; i += 1) {
            token = tokens[i];
            if (token.loc.start.line < fromLine) {
                continue;
            }
            if (toLine < token.loc.end.line) {
                break;
            }
            found = predicate(token, i);
            if (found) {
                return found;
            }
        }
        return undefined;
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


    function multibyteStringWidthOf (str) {
        var i, c, width = 0;
        for(i = 0; i < str.length; i+=1){
            c = str.charCodeAt(i);
            if ((0x0 <= c && c < 0x81) || (c === 0xf8f0) || (0xff61 <= c && c < 0xffa0) || (0xf8f1 <= c && c < 0xf8f4)) {
                width += 1;
            } else {
                width += 2;
            }
        }
        return width;
    }


    function defaultStringifier (config) {
        var toStr = Object.prototype.toString,
            constructors = [
                Boolean,
                Date,
                Number,
                String
            ];

        function getClassName(obj) {
            var ctor = obj.constructor,
                cname = '';
            if (typeof(ctor) === 'function') {
                cname = ctor.name ? ctor.name : toStr.call(obj).slice(8, -1);
            }
            return cname ? cname : 'Object';
        }

        function stringifyObject(obj, depth) {
            var pairs, cname;
            depth -= 1;
            if (obj instanceof RegExp) {
                return obj.toString();
            }
            cname = getClassName(obj);
            if (constructors.some(function (ctor) { return obj instanceof ctor; })) {
                return 'new ' + cname + '(' + JSON.stringify(obj) + ')';
            }
            if (depth === 0) {
                return '#' + cname + '#';
            }
            pairs = [];
            Object.keys(obj).forEach(function (key) {
                var val = stringifyAny(obj[key], depth);
                if (!/^[A-Za-z_]+$/.test(key)) {
                    key = JSON.stringify(key);
                }
                pairs.push(key + ':' + val);
            });
            return cname + ':{' + pairs.join(',') + '}';
        }

        function stringifyNumber(num) {
            if (isNaN(num)) {
                return 'NaN';
            }
            if (!isFinite(num)) {
                return num === Infinity ? 'Infinity' : '-Infinity';
            }
            return JSON.stringify(num);
        }

        function stringifyArray(ary, depth) {
            depth -= 1;
            if (depth === 0) {
                return '#Array#';
            }
            return '[' + ary.map(function (elem, idx) {
                return stringifyAny(elem, depth);
            }).join(',') + ']';
        }


        function stringifyAny(obj, depth) {
            switch(typeof obj) {
            case 'string':
            case 'boolean':
                return JSON.stringify(obj);
            case 'number':
                return stringifyNumber(obj);
            case 'function':
                return '#function#';
            case 'undefined':
                return 'undefined';
            case 'object':
                if (obj === null) {
                    return 'null';
                } else if (Array.isArray(obj)) {
                    return stringifyArray(obj, depth);
                } else {
                    return stringifyObject(obj, depth);
                }
                break;
            default:
                break;
            }
        }

        return function (obj, depth) {
            if (typeof depth !== 'number') {
                depth = config.stringifyDepth;
            }
            return stringifyAny(obj, depth);
        };
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
    return create;
}));
