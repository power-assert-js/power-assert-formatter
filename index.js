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
    defaultComparator = require('./lib/comparator'),
    stringWidth = require('./lib/string-width'),
    PowerAssertContextRenderer = require('./lib/renderer'),
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
create.stringWidth = stringWidth;
module.exports = create;
