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

    var syntax = estraverse.Syntax,
        dmp = new DiffMatchPatch();

    function defaultOptions () {
        return {
            lineDiffThreshold: 5,
            lineSeparator: '\n',
            dump: jsonDump,
            widthOf: multibyteStringWidthOf
        };
    }


    function PowerAssertContextRenderer (config, context) {
        this.config = config;
        this.dump = config.dump;
        this.widthOf = config.widthOf;
        this.initialVertivalBarLength = 1;
    }

    PowerAssertContextRenderer.prototype.init = function (context) {
        var i, events = collectEvents(context);
        // console.log(JSON.stringify(context, null, 2));
        events.sort(rightToLeft);
        this.context = context;
        this.events = events;
        this.assertionLine = context.source.content;
        this.filepath = context.source.filepath;
        this.lineNumber = context.source.line;
        this.rows = [];
        for (i = 0; i <= this.initialVertivalBarLength; i += 1) {
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
            var dumpedValue = that.dump(captured.value);
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
        var lines = [], lineNum = this.lineNumber;
        this.constructRows(this.events);
        if (this.filepath) {
            lines.push('# ' + [this.filepath, lineNum].join(':'));
        } else {
            lines.push('# at line: ' + lineNum);
        }
        lines.push('');
        lines.push(this.assertionLine);
        this.rows.forEach(function (columns) {
            lines.push(columns.join(''));
        });
        this.renderBinaryExpressionDiff(lines);
        lines.push('');
        return lines;
    };

    PowerAssertContextRenderer.prototype.isTargetBinaryExpression = function (node) {
        return node && node.type === syntax.BinaryExpression && node.operator === '===';
    };

    PowerAssertContextRenderer.prototype.shouldUseLineLevelDiff = function (text) {
        return this.config.lineDiffThreshold < text.split(/\r\n|\r|\n/).length;
    };

    PowerAssertContextRenderer.prototype.renderBinaryExpressionDiff = function (lines) {
        var pairs = [], map = {}, that = this;
        this.context.args.forEach(function (arg) {
            // console.log(JSON.stringify(arg.meta.tree, null, 2));
            var espathList = arg.events.map(function (ev) {
                    return ev.espath;
                }),
                espathToValue = arg.events.reduce(function (accum, ev) {
                    accum[ev.espath] = ev.value;
                    return accum;
                }, {}),
                jsAST = esprima.parse(that.context.source.content, {tolerant: true, loc: true, raw: true});
            estraverse.traverse(extractExpressionFrom(jsAST), {
                enter: function (currentNode, parentNode) {
                    var obj,
                        controller = this,
                        path = controller.path(),
                        espath = path ? path.join('/') : '',
                        currentProp = path ? path[path.length - 1] : null,
                        parentEspath = path ? path.slice(0, path.length - 1).join('/') : '';
                    if (that.isTargetBinaryExpression(parentNode) && currentNode.type === syntax.Literal && typeof map[parentEspath] === 'object') {
                        map[parentEspath][currentProp] = {name: '' + currentProp + '(' + currentNode.type + ')', value: currentNode.value};
                    }
                    if ((typeof espathToValue[espath] === 'undefined') && (espathList.indexOf(espath) === -1)) {
                        return;
                    }
                    if (that.isTargetBinaryExpression(currentNode)) {
                        obj = {};
                        map[espath] = obj;
                        pairs.push(obj);
                    }
                    if (that.isTargetBinaryExpression(parentNode)) {
                        if (currentNode.type === syntax.Identifier) {
                            map[parentEspath][currentProp] = {name: currentNode.name, value: espathToValue[espath]};
                        } else {
                            map[parentEspath][currentProp] = {name: '' + currentProp + '(' + currentNode.type + ')', value: espathToValue[espath]};
                        }
                    }
                }
            });
        });

        pairs.filter(function (pair) {
            return typeof pair.left.value === 'string' && typeof pair.right.value === 'string';
        }).forEach(function (pair) {
            var patch;
            if (that.shouldUseLineLevelDiff(pair.left.value)) {
                patch = udiffLines(pair.left.value, pair.right.value);
            } else {
                patch = udiffChars(pair.left.value, pair.right.value);
            }
            lines.push('');
            lines.push('--- ' + pair.left.name);
            lines.push('+++ ' + pair.right.name);
            lines.push(decodeURIComponent(patch));
        });
    };


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


    function extractExpressionFrom (tree) {
        var expressionStatement = tree.body[0],
            expression = expressionStatement.expression;
        return expression;
    }


    function collectEvents(context) {
        var events = [];
        context.args.forEach(function (arg) {
            var jsAST,
                tree,
                tokens,
                espathList = arg.events.map(function (ev) {
                    return ev.espath;
                }),
                espathToValue = arg.events.reduce(function (accum, ev) {
                    accum[ev.espath] = ev.value;
                    return accum;
                }, {});
            jsAST = esprima.parse(context.source.content, {tolerant: true, loc: true, tokens: true, raw: true});
            tokens = jsAST.tokens;
            tree = extractExpressionFrom(jsAST);
            // console.log(JSON.stringify(espathToValue, null, 2));
            // console.log(JSON.stringify(espathList, null, 2));
            // console.log(JSON.stringify(arg.meta.tree, null, 2));
            estraverse.traverse(tree, {
                enter: function (currentNode, parentNode) {
                    var controller = this,
                        path = controller.path(),
                        espath = path ? path.join('/') : '';
                    if ((typeof espathToValue[espath] === 'undefined') && (espathList.indexOf(espath) === -1)) {
                        return;
                    }
                    events.push({value: espathToValue[espath], espath: espath, loc: locationOf(currentNode, tokens)});
                }
            });
        });
        return events;
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


    function jsonDump (obj) {
        var seen = [],
            replacer = function(key, val) {
                if (typeof val === 'object' && val) {
                    if (seen.indexOf(val) !== -1) {
                        return '#Circular#';
                    }
                    seen.push(val);
                }
                return val;
            },
            str = JSON.stringify(obj, replacer);
        if (typeof str === 'undefined') {
            return 'undefined';
        }
        return str;
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
        return function (context) {
            var renderer = new PowerAssertContextRenderer(config);
            renderer.init(context);
            return renderer.renderLines().join(config.lineSeparator);
        };
    }

    create.PowerAssertContextRenderer = PowerAssertContextRenderer;
    return create;
}));
