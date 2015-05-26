'use strict';

var stringifier = require('stringifier');
var stringWidth = require('./string-width');
var StringWriter = require('./string-writer');
var ContextTraversal = require('./traverse');
var udiff = require('./udiff');
var defaultOptions = require('./default-options');
var typeName = require('type-name');
var extend = require('xtend');

// "Browserify can only analyze static requires. It is not in the scope of browserify to handle dynamic requires."
// https://github.com/substack/node-browserify/issues/377
var defaultRendererClasses = {
    './built-in/file': require('./built-in/file'),
    './built-in/assertion': require('./built-in/assertion'),
    './built-in/diagram': require('./built-in/diagram'),
    './built-in/binary-expression': require('./built-in/binary-expression')
};

function findRendererClass (rendererName, config) {
    var RendererClass;
    if (typeName(rendererName) === 'function') {
        RendererClass = rendererName;
    } else if (typeName(rendererName) === 'string') {
        if (defaultRendererClasses[rendererName]) {
            RendererClass = defaultRendererClasses[rendererName];
        } else {
            RendererClass = require(rendererName);
        }
    }
    return RendererClass;
}

function configure (options) {
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
    return config;
}

function create (options) {
    var config = configure(options);
    var rendererClasses = config.renderers.map(function (rendererName) {
        return findRendererClass(rendererName, config);
    });
    return function (context) {
        var traversal = new ContextTraversal(context);
        var writer = new config.writerClass(extend(config));
        var renderers = rendererClasses.map(function (RendererClass) {
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
