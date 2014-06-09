/**
 * power-assert-formatter.js - Power Assert output formatter
 *
 * https://github.com/twada/power-assert-formatter
 *
 * Copyright (c) 2013-2014 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/twada/power-assert-formatter/blob/master/MIT-LICENSE.txt
 */
'use strict';

var defaultStringifier = require('./lib/stringify'),
    stringWidth = require('./lib/string-width'),
    StringWriter = require('./lib/string-writer'),
    PowerAssertContextRenderer = require('./lib/renderer'),
    BinaryExpressionComparator = require('./lib/comparator'),
    traverseContext = require('./lib/traverse'),
    extend = require('node.extend');

function defaultOptions () {
    return {
        lineDiffThreshold: 5,
        stringifyDepth: 2,
        lineSeparator: '\n'
    };
}

function create (options) {
    var config = extend(defaultOptions(), (options || {}));
    if (typeof config.widthOf !== 'function') {
        config.widthOf = stringWidth;
    }
    if (typeof config.stringify !== 'function') {
        config.stringify = defaultStringifier(config);
    }
    if (!config.writerClass) {
        config.writerClass = StringWriter;
    }
    if (!config.comparatorClass) {
        config.comparatorClass = BinaryExpressionComparator;
    }
    if (!config.rendererClass) {
        config.rendererClass = PowerAssertContextRenderer;
    }
    return function (context) {
        var writer = new config.writerClass(extend({}, config)),
            comparator = new config.comparatorClass(extend({}, config)),
            renderer = new config.rendererClass(extend({}, config));
        renderer.init(context);
        comparator.init(context);
        traverseContext(context, [renderer, comparator]);
        renderer.render(writer);
        comparator.render(writer);
        writer.write('');
        return writer.flush();
    };
}

create.stringWidth = stringWidth;
module.exports = create;
