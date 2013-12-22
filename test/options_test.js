var createFormatter = require('../lib/power-assert-formatter'),
    empower = require('empower'),
    weave = require('../test_helper').weave,
    baseAssert = require('assert');

suite('lineSeparator option', function () {
    function lineSeparatorTest (name, option, expectedSeparator) {
        var baseAssert = require('assert'),
            assert = empower(baseAssert, createFormatter(option));
        test(name, function () {
            var falsyNum = 0;
            try {
                eval(weave('assert(falsyNum);'));
            } catch (e) {
                baseAssert.equal(e.name, 'AssertionError');
                baseAssert.equal(e.message, [
                    '# /path/to/some_test.js:1',
                    '',
                    'assert(falsyNum);',
                    '       |         ',
                    '       0         ',
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
