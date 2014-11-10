'use strict';

var stringifier = require('stringifier'),
    stringWidth = require('./string-width'),
    StringWriter = require('./string-writer'),
    ContextTraversal = require('./traverse'),
    udiff = require('./udiff'),
    defaultOptions = require('./default-options'),
    typeName = require('type-name'),
    extend = require('xtend');

(function() {
    // "Browserify can only analyze static requires. It is not in the scope of browserify to handle dynamic requires."
    // https://github.com/substack/node-browserify/issues/377
    require('./built-in/assertion');
    require('./built-in/binary-expression');
    require('./built-in/diagram');
    require('./built-in/file');
})();

function create (options) {
    var config = extend(defaultOptions(), options);
    if (typeof config.widthOf !== 'function') {
        config.widthOf = stringWidth(extend(config));
    }
    if (typeof config.stringify !== 'function') {
        config.stringify = stringifier(extend(config));
    }
    if (typeof config.diff !== 'function') {
        config.diff = udiff(extend(config));
    }
    if (!config.writerClass) {
        config.writerClass = StringWriter;
    }
    return function (context) {
        var traversal = new ContextTraversal(context);
        var writer = new config.writerClass(extend(config));
        var renderers = config.renderers.map(function (rendererName) {
            var RendererClass;
            if (typeName(rendererName) === 'function') {
                RendererClass = rendererName;
            } else if (typeName(rendererName) === 'string') {
                RendererClass = require(rendererName);
            }
            return new RendererClass(traversal, extend(config));
        });
        traversal.emit('start', context);
        traversal.traverse();
        traversal.emit('render', writer);
        writer.write('');
        renderers.length = 0;
        return writer.flush();
    };
}

create.defaultOptions = defaultOptions;
create.stringWidth = stringWidth;
module.exports = create;
