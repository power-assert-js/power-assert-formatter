(function (root, factory) {
    'use strict';

    var dependencies = [
        '../lib/power-assert-formatter',
        'empower',
        '../test_helper',
        'assert'
    ];

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function toLowerCamel(str) {
        var tokens = str.split(/[-_]/);
        return tokens[0] + tokens.slice(1).map(function (token) { return capitalize(token); }).join('');
    }

    if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    } else if (typeof exports === 'object') {
        factory.apply(root, dependencies.map(function (path) { return require(path); }));
    } else {
        factory.apply(root, dependencies.map(function (path) {
            var tokens = path.split('/'),
                basename = tokens[tokens.length - 1];
            return root[toLowerCamel(basename)];
        }));
    }
}(this, function (
    createFormatter,
    empower,
    testHelper,
    baseAssert
) {

var weave = testHelper.weave;

suite('lineSeparator option', function () {
    function lineSeparatorTest (name, option, expectedSeparator) {
        var assert = empower(baseAssert, createFormatter(option));
        test(name, function () {
            var falsyNum = 0;
            try {
                eval(weave('assert(falsyNum);'));
            } catch (e) {
                baseAssert.equal(e.name, 'AssertionError');
                baseAssert.equal(e.message, [
                    '# /path/to/some_test.js:1',
                    '',
                    'assert(falsyNum)',
                    '       |        ',
                    '       0        ',
                    ''
                ].join(expectedSeparator));
            }
        });
    }
    lineSeparatorTest('default is LF', {}, '\n');
    lineSeparatorTest('LF', {lineSeparator: '\n'}, '\n');
    lineSeparatorTest('CR', {lineSeparator: '\r'}, '\r');
    lineSeparatorTest('CRLF', {lineSeparator: '\r\n'}, '\r\n');
});

}));
