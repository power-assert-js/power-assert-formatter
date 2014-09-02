'use strict';

var stringifier = require('stringifier'),
    stringWidth = require('./string-width'),
    StringWriter = require('./string-writer'),
    ContextTraversal = require('./traverse'),
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
        config.widthOf = stringWidth;
    }
    if (typeof config.stringify !== 'function') {
        config.stringify = stringifier(config);
    }
    if (!config.writerClass) {
        config.writerClass = StringWriter;
    }
    return function (context) {
        var traversal = new ContextTraversal(context);
        var writer = new config.writerClass(extend(config));
        config.renderers.forEach(function (rendererName) {
            var RendererClass;
            if (typeName(rendererName) === 'function') {
                RendererClass = rendererName;
            } else if (typeName(rendererName) === 'string') {
                RendererClass = require(rendererName);
            }
            new RendererClass(traversal, extend(config));
        });
        traversal.emit('start', context);
        traversal.traverse();
        traversal.emit('render', writer);
        writer.write('');
        return writer.flush();
    };
}

create.defaultOptions = defaultOptions;
create.stringWidth = stringWidth;
module.exports = create;
