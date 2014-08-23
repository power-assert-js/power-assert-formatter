(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['power-assert-formatter', 'empower', 'espower-source', 'assert'], factory);
    } else if (typeof exports === 'object') {
        factory(require('..'), require('empower'), require('espower-source'), require('assert'));
    } else {
        factory(root.powerAssertFormatter, root.empower, root.espowerSource, root.assert);
    }
}(this, function (
    createFormatter,
    empower,
    espowerSource,
    baseAssert
) {
    function weave (line) {
        return espowerSource(line, '/path/to/some_test.js');
    }

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

suite('renderers customization', function () {
    function rendererCustomizationTest (name, option, expectedLines) {
        var assert = empower(baseAssert, createFormatter(option));
        test(name, function () {
            var hoge = 'foo';
            var fuga = 'bar';
            try {
                eval(weave('assert.ok(hoge === fuga, "comment");'));
            } catch (e) {
                baseAssert.equal(e.name, 'AssertionError');
                baseAssert.equal(e.message, expectedLines.join('\n'));
            }
        });
    }

    rendererCustomizationTest('default', null, [
        'comment # /path/to/some_test.js:1',
        '',
        'assert.ok(hoge === fuga, "comment")',
        '          |    |   |               ',
        '          |    |   "bar"           ',
        '          |    false               ',
        '          "foo"                    ',
        '',
        '--- [string] fuga',
        '+++ [string] hoge',
        '@@ -1,3 +1,3 @@',
        '-bar',
        '+foo',
        '',
        ''
    ]);

    rendererCustomizationTest('without file renderer', {
        renderers: [
            './renderers/assertion',
            './renderers/diagram',
            './renderers/binary-expression'
        ]
    }, [
        'comment ',
        'assert.ok(hoge === fuga, "comment")',
        '          |    |   |               ',
        '          |    |   "bar"           ',
        '          |    false               ',
        '          "foo"                    ',
        '',
        '--- [string] fuga',
        '+++ [string] hoge',
        '@@ -1,3 +1,3 @@',
        '-bar',
        '+foo',
        '',
        ''
    ]);


    rendererCustomizationTest('without assertion renderer (though it is nonsense)', {
        renderers: [
            './renderers/file',
            './renderers/diagram',
            './renderers/binary-expression'
        ]
    }, [
        'comment # /path/to/some_test.js:1',
        '          |    |   |               ',
        '          |    |   "bar"           ',
        '          |    false               ',
        '          "foo"                    ',
        '',
        '--- [string] fuga',
        '+++ [string] hoge',
        '@@ -1,3 +1,3 @@',
        '-bar',
        '+foo',
        '',
        ''
    ]);

    rendererCustomizationTest('without diagram renderer', {
        renderers: [
            './renderers/file',
            './renderers/assertion',
            './renderers/binary-expression'
        ]
    }, [
        'comment # /path/to/some_test.js:1',
        '',
        'assert.ok(hoge === fuga, "comment")',
        '',
        '--- [string] fuga',
        '+++ [string] hoge',
        '@@ -1,3 +1,3 @@',
        '-bar',
        '+foo',
        '',
        ''
    ]);

    rendererCustomizationTest('without binary-expression renderer', {
        renderers: [
            './renderers/file',
            './renderers/assertion',
            './renderers/diagram'
        ]
    }, [
        'comment # /path/to/some_test.js:1',
        '',
        'assert.ok(hoge === fuga, "comment")',
        '          |    |   |               ',
        '          |    |   "bar"           ',
        '          |    false               ',
        '          "foo"                    ',
        ''
    ]);


    (function () {
        function CustomRenderer (traversal, config) {
            var assertionLine;
            traversal.on('start', function (context) {
                assertionLine = context.source.content;
            });
            traversal.on('render', function (writer) {
                writer.write('');
                writer.write('## ' + assertionLine + ' ##');
            });
        }
        rendererCustomizationTest('without binary-expression renderer', {
            renderers: [
                './renderers/file',
                CustomRenderer,
                './renderers/binary-expression'
            ]
        }, [
            'comment # /path/to/some_test.js:1',
            '',
            '## assert.ok(hoge === fuga, "comment") ##',
            '',
            '--- [string] fuga',
            '+++ [string] hoge',
            '@@ -1,3 +1,3 @@',
            '-bar',
            '+foo',
            '',
            ''
        ]);
    })();

});

}));
