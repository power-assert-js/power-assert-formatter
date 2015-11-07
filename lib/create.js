'use strict';

var stringifier = require('stringifier');
var stringWidth = require('./string-width');
var StringWriter = require('./string-writer');
var ContextTraversal = require('./traverse');
var udiff = require('./udiff');
var defaultOptions = require('./default-options');
var extend = require('xtend');
var map = require('array-map');
var builtinRenderers = require('power-assert-renderers');

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
    var rendererClasses = map(config.renderers, builtinRenderers.lookup);
    return function (context) {
        var traversal = new ContextTraversal(context);
        var writer = new config.writerClass(extend(config));
        var renderers = map(rendererClasses, function (RendererClass) {
            var renderer;
            if (RendererClass.length === 2) {
                renderer = new RendererClass(traversal, extend(config));
            } else {
                renderer = new RendererClass(extend(config));
                renderer.init(traversal);
            }
            return renderer;
        });
        traversal.emit('start', context);
        traversal.traverse();
        traversal.emit('render', writer);
        writer.write('');
        renderers.length = 0;
        return writer.flush();
    };
}

create.renderers = builtinRenderers;
create.defaultOptions = defaultOptions;
create.stringWidth = stringWidth;
module.exports = create;
