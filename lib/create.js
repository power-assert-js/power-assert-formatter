'use strict';

var createFormatter = require('power-assert-context-formatter');
var appendAst = require('power-assert-context-reducer-ast');
var FileRenderer = require('power-assert-renderer-file');
var AssertionRenderer = require('power-assert-renderer-assertion');
var DiagramRenderer = require('power-assert-renderer-diagram');
var ComparisonRenderer = require('power-assert-renderer-comparison');
var defaultOptions = require('./default-options');
var typeName = require('type-name');
var extend = require('xtend');
var map = require('array-map');

// "Browserify can only analyze static requires. It is not in the scope of browserify to handle dynamic requires."
// https://github.com/substack/node-browserify/issues/377
var defaultRendererClasses = {
    './built-in/file': FileRenderer,
    './built-in/assertion': AssertionRenderer,
    './built-in/diagram': DiagramRenderer,
    './built-in/binary-expression': ComparisonRenderer
};

function toRendererClass (rendererName) {
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

function create (options) {
    var config = extend(defaultOptions(), options);
    var rendererClasses = map(config.renderers, toRendererClass);
    var renderers = map(rendererClasses, function (clazz) {
        return { ctor: clazz, options: config };
    });
    return createFormatter(extend(config, {
        reducers: [
            appendAst
        ],
        renderers: renderers,
        legacy: true
    }));
}

create.renderers = {
    AssertionRenderer: AssertionRenderer,
    FileRenderer: FileRenderer,
    DiagramRenderer: DiagramRenderer,
    BinaryExpressionRenderer: ComparisonRenderer
};
create.defaultOptions = defaultOptions;
module.exports = create;
