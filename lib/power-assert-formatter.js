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
 *
 * A part of parseTextDiff function is:
 *   Copyright (c) 2014 Benjamín Eidelman twitter.com/beneidel
 *   Released under the MIT license.
 *   https://github.com/benjamine/jsondiffpatch/blob/master/MIT-LICENSE.txt
 */
(function (root, factory) {
    'use strict';

    // using returnExports UMD pattern
    if (typeof define === 'function' && define.amd) {
        define(['estraverse', 'jsondiffpatch'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('estraverse'), require('jsondiffpatch'));
    } else {
        root.powerAssertFormatter = factory(root.estraverse, root.jsondiffpatch);
    }
}(this, function (estraverse, jsondiffpatch) {
    'use strict';

    var syntax = estraverse.Syntax,
        stringDiff = jsondiffpatch.create({
            textDiff: {
                // minimum string length (left and right sides) to use text diff algorithm: google-diff-match-patch
                minLength: 1
            }
        });

    function defaultOptions () {
        return {
            lineSeparator: '\n',
            dump: jsonDump,
            widthOf: multibyteStringWidthOf
        };
    }


    function PowerAssertContextRenderer (dump, widthOf, context) {
        this.dump = dump;
        this.widthOf = widthOf;
        this.initialVertivalBarLength = 1;
        this.initWithContext(context);
    }

    PowerAssertContextRenderer.prototype.initWithContext = function (context) {
        var i, events = collectEvents(context);
        // console.log(JSON.stringify(context, null, 2));
        events.sort(rightToLeft);
        this.context = context;
        this.events = events;
        this.assertionLine = context.source.content;
        this.filepath = context.source.filepath;
        this.lineNumber = firstLineNumberFor(context);
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
        renderBinaryExpressionDiff(this.context, lines);
        lines.push('');
        return lines;
    };


    function renderBinaryExpressionDiff(context, lines) {
        var pairs = [], map = {};
        context.args.forEach(function (arg) {
            // console.log(JSON.stringify(arg.meta.tree, null, 2));
            var espathList = arg.events.map(function (ev) {
                    return ev.espath;
                }),
                espathToValue = arg.events.reduce(function (accum, ev) {
                    accum[ev.espath] = ev.value;
                    return accum;
                }, {});
            estraverse.traverse(arg.meta.tree, {
                enter: function (currentNode, parentNode) {
                    var obj,
                        controller = this,
                        path = controller.path(),
                        espath = path ? path.join('/') : '',
                        currentProp = path ? path[path.length - 1] : null,
                        parentEspath = path ? path.slice(0, path.length - 1).join('/') : '';
                    if (parentNode && currentNode.type === 'Literal' && parentNode.type === 'BinaryExpression' && typeof map[parentEspath] === 'object') {
                        map[parentEspath][currentProp] = {name: '[' + currentProp + ']', value: currentNode.value};
                    }
                    if ((typeof espathToValue[espath] === 'undefined') && (espathList.indexOf(espath) === -1)) {
                        return;
                    }
                    if (currentNode.type === 'BinaryExpression') {
                        obj = {};
                        map[espath] = obj;
                        pairs.push(obj);
                    }
                    if (parentNode && parentNode.type === 'BinaryExpression') {
                        map[parentEspath][currentProp] = {name: currentNode.name, value: espathToValue[espath]};
                    }
                }
            });
        });

        pairs.filter(function (pair) {
            return typeof pair.left.value === 'string' && typeof pair.right.value === 'string';
        }).forEach(function (pair) {
            var delta = stringDiff.diff(pair.left.value, pair.right.value),
                diffs = lineDiffs(delta);
            lines.push('');
            diffs.forEach(function (diff) {
                lines.push(pair.left.name + ' : ' + decodeURIComponent(diff.left));
                lines.push(pair.right.name + ' : ' + decodeURIComponent(diff.right));
            });
        });
    }


    function firstLineNumberFor(context) {
        var lineNums = context.args.map(function (arg) {
            return arg.meta.tree.loc.start.line;
        });
        lineNums.sort(function (a, b) {
            return b - a;
        });
        return lineNums[0];
    }


    function collectEvents(context) {
        var events = [];
        context.args.forEach(function (arg) {
            var tokens = arg.meta.tokens,
                espathList = arg.events.map(function (ev) {
                    return ev.espath;
                }),
                espathToValue = arg.events.reduce(function (accum, ev) {
                    accum[ev.espath] = ev.value;
                    return accum;
                }, {});
            // console.log(JSON.stringify(espathToValue, null, 2));
            // console.log(JSON.stringify(espathList, null, 2));
            // console.log(JSON.stringify(arg.meta.tree, null, 2));
            estraverse.traverse(arg.meta.tree, {
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


    function lineDiffs(delta) {
        var lines = parseTextDiff(delta[0]);
        return lines.map(function (line) {
            var diff = {left: '', right: ''};
            line.pieces.forEach(function (piece) {
                switch (piece.type) {
                case 'context':
                    diff.left += piece.text;
                    diff.right += piece.text;
                    break;
                case 'added':
                    diff.right += ('(' + piece.text + ')');
                    break;
                case 'deleted':
                    diff.left += ('(' + piece.text + ')');
                    break;
                }
            });
            return diff;
        });
    }


    // borrowed from jsondiffpatch
    function parseTextDiff(value) {
        var output = [];
        var lines = value.split('\n@@ ');
        for (var i = 0, l = lines.length; i < l; i++) {
            var line = lines[i];
            var lineOutput = {
                pieces: []
            };
            var location = /^(?:@@ )?[-+]?(\d+),(\d+)/.exec(line).slice(1);
            lineOutput.location = {
                line: location[0],
                chr: location[1]
            };
            var pieces = line.split('\n').slice(1);
            for (var pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
                var piece = pieces[pieceIndex];
                if (!piece.length) { continue; }
                var pieceOutput = { type: 'context' };
                if (piece.substr(0, 1) === '+') {
                    pieceOutput.type = 'added';
                } else if (piece.substr(0, 1) === '-') {
                    pieceOutput.type = 'deleted';
                }
                pieceOutput.text = piece.slice(1);
                lineOutput.pieces.push(pieceOutput);
            }
            output.push(lineOutput);
        }
        return output;
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
            var renderer = new PowerAssertContextRenderer(config.dump, config.widthOf, context);
            return renderer.renderLines().join(config.lineSeparator);
        };
    }

    create.PowerAssertContextRenderer = PowerAssertContextRenderer;
    return create;
}));
