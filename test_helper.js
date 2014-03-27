(function (root, factory) {
    'use strict';

    var dependencies = [
        'espower',
        'esprima',
        'escodegen'
    ];

    if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    } else if (typeof exports === 'object') {
        module.exports = factory.apply(root, dependencies.map(function (path) { return require(path); }));
    } else {
        root.testHelper = factory.apply(root, dependencies.map(function (path) {
            var tokens = path.split('/');
            return root[tokens[tokens.length - 1]];
        }));
    }
}(this, function (
    espower,
    esprima,
    escodegen
) {
    // see: https://github.com/Constellation/escodegen/issues/115
    if (typeof define === 'function' && define.amd) {
        escodegen = window.escodegen;
    }

function extractBodyOfAssertionAsCode (node) {
    var expression;
    if (node.type === 'ExpressionStatement') {
        expression = node.expression;
    }
    return escodegen.generate(expression.arguments[0], {format: {compact: true}});
}

function applyEspower (line, options) {
    options = options || {destructive: false, source: line, path: '/path/to/some_test.js', powerAssertVariableName: 'assert'};
    var tree = esprima.parse(line, {tolerant: true, loc: true, range: true, tokens: true});
    return espower(tree, options);
}

function weave (line, options) {
    return escodegen.generate(applyEspower(line, options), {format: {compact: true}});
}

return {
    weave: weave,
    extractBodyOfAssertionAsCode: extractBodyOfAssertionAsCode
};

}));
