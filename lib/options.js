module.exports = function defaultOptions () {
    'use strict';
    return {
        lineDiffThreshold: 5,
        stringifyDepth: 2,
        lineSeparator: '\n',
        renderers: [
            './renderers/file',
            './renderers/assertion',
            './renderers/diagram',
            './renderers/binary-expression'
        ]
    };
};
