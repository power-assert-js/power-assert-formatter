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
    traverseContext = require('./lib/traverse'),
    extend = require('node.extend');

(function() {
    // "Browserify can only analyze static requires. It is not in the scope of browserify to handle dynamic requires."
    // https://github.com/substack/node-browserify/issues/377
    require('./lib/renderers/assertion');
    require('./lib/renderers/binary-expression');
    require('./lib/renderers/diagram');
    require('./lib/renderers/file');
})();

function defaultOptions () {
    return {
        lineDiffThreshold: 5,
        stringifyDepth: 2,
        lineSeparator: '\n',
        renderers: [
            './lib/renderers/file',
            './lib/renderers/assertion',
            './lib/renderers/diagram',
            './lib/renderers/binary-expression'
        ]
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
    return function (context) {
        var writer = new config.writerClass(extend({}, config)),
            renderers = config.renderers.map(function (rendererName) {
                var RendererClass = require(rendererName);
                return new RendererClass(extend({}, config));
            });
        renderers.forEach(function (renderer) {
            renderer.init(context);
        });
        traverseContext(context, renderers);
        renderers.forEach(function (renderer) {
            renderer.render(writer);
        });
        writer.write('');
        return writer.flush();
    };
}

create.stringWidth = stringWidth;
module.exports = create;
