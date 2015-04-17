(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['power-assert-formatter', 'empower', 'espower', 'acorn', 'escodegen', 'assert'], factory);
    } else if (typeof exports === 'object') {
        factory(require('..'), require('empower'), require('espower'), require('acorn'), require('escodegen'), require('assert'));
    } else {
        factory(root.powerAssertFormatter, root.empower, root.espower, root.acorn, root.escodegen, root.assert);
    }
}(this, function (
    createFormatter,
    empower,
    espower,
    acorn,
    escodegen,
    baseAssert
) {

// see: https://github.com/Constellation/escodegen/issues/115
if (typeof define === 'function' && define.amd) {
    escodegen = window.escodegen;
}

    function weave (line) {
        var filepath = '/path/to/some_test.js';
        var options = {ecmaVersion: 6, locations: true, sourceType: 'module', sourceFile: filepath};
        var jsAST = acorn.parse(line, options);
        var espoweredAST = espower(jsAST, {source: line, path: filepath});
        return escodegen.generate(espoweredAST, {format: {compact: true}});
    }

suite('lineSeparator option', function () {
    function lineSeparatorTest (name, option, expectedSeparator) {
        var assert = empower(baseAssert, createFormatter(option));
        test(name, function () {
            var falsyNum = 0;
            try {
                eval(weave('assert(falsyNum);'));
            } catch (e) {
                baseAssert.equal(e.message, [
                    '  # /path/to/some_test.js:1',
                    '  ',
                    '  assert(falsyNum)',
                    '         |        ',
                    '         0        ',
                    '  '
                ].join(expectedSeparator));
                baseAssert.equal(e.name, 'AssertionError');
            }
        });
    }
    lineSeparatorTest('default is LF', {}, '\n');
    lineSeparatorTest('LF', {lineSeparator: '\n'}, '\n');
    lineSeparatorTest('CR', {lineSeparator: '\r'}, '\r');
    lineSeparatorTest('CRLF', {lineSeparator: '\r\n'}, '\r\n');
});


suite('outputOffset option', function () {
    function outputOffsetCustomizationTest (option, expectedLines) {
        var assert = empower(baseAssert, createFormatter(option));
        test(JSON.stringify(option), function () {
            var hoge = 'foo';
            var fuga = 'bar';
            try {
                eval(weave('assert.ok(hoge === fuga, "comment");'));
            } catch (e) {
                var actual = e.message.split(createFormatter.defaultOptions().lineSeparator);
                baseAssert.deepEqual(actual, expectedLines);
                baseAssert.equal(e.name, 'AssertionError');
            }
        });
    }
    outputOffsetCustomizationTest({outputOffset: 1}, [
        'comment  # /path/to/some_test.js:1',
        ' ',
        ' assert.ok(hoge === fuga, "comment")',
        '           |    |   |               ',
        '           |    |   "bar"           ',
        '           |    false               ',
        '           "foo"                    ',
        ' ',
        ' --- [string] fuga',
        ' +++ [string] hoge',
        ' @@ -1,3 +1,3 @@',
        ' -bar',
        ' +foo',
        ' ',
        ' '
    ]);
    outputOffsetCustomizationTest({outputOffset: 3}, [
        'comment    # /path/to/some_test.js:1',
        '   ',
        '   assert.ok(hoge === fuga, "comment")',
        '             |    |   |               ',
        '             |    |   "bar"           ',
        '             |    false               ',
        '             "foo"                    ',
        '   ',
        '   --- [string] fuga',
        '   +++ [string] hoge',
        '   @@ -1,3 +1,3 @@',
        '   -bar',
        '   +foo',
        '   ',
        '   '
    ]);
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
                baseAssert.equal(e.message, expectedLines.join('\n'));
                baseAssert.equal(e.name, 'AssertionError');
            }
        });
    }

    rendererCustomizationTest('default', null, [
        'comment   # /path/to/some_test.js:1',
        '  ',
        '  assert.ok(hoge === fuga, "comment")',
        '            |    |   |               ',
        '            |    |   "bar"           ',
        '            |    false               ',
        '            "foo"                    ',
        '  ',
        '  --- [string] fuga',
        '  +++ [string] hoge',
        '  @@ -1,3 +1,3 @@',
        '  -bar',
        '  +foo',
        '  ',
        '  '
    ]);

    rendererCustomizationTest('without file renderer', {
        renderers: [
            './built-in/assertion',
            './built-in/diagram',
            './built-in/binary-expression'
        ]
    }, [
        'comment   ',
        '  assert.ok(hoge === fuga, "comment")',
        '            |    |   |               ',
        '            |    |   "bar"           ',
        '            |    false               ',
        '            "foo"                    ',
        '  ',
        '  --- [string] fuga',
        '  +++ [string] hoge',
        '  @@ -1,3 +1,3 @@',
        '  -bar',
        '  +foo',
        '  ',
        '  '
    ]);


    rendererCustomizationTest('without assertion renderer (though it is nonsense)', {
        renderers: [
            './built-in/file',
            './built-in/diagram',
            './built-in/binary-expression'
        ]
    }, [
        'comment   # /path/to/some_test.js:1',
        '            |    |   |               ',
        '            |    |   "bar"           ',
        '            |    false               ',
        '            "foo"                    ',
        '  ',
        '  --- [string] fuga',
        '  +++ [string] hoge',
        '  @@ -1,3 +1,3 @@',
        '  -bar',
        '  +foo',
        '  ',
        '  '
    ]);

    rendererCustomizationTest('without diagram renderer', {
        renderers: [
            './built-in/file',
            './built-in/assertion',
            './built-in/binary-expression'
        ]
    }, [
        'comment   # /path/to/some_test.js:1',
        '  ',
        '  assert.ok(hoge === fuga, "comment")',
        '  ',
        '  --- [string] fuga',
        '  +++ [string] hoge',
        '  @@ -1,3 +1,3 @@',
        '  -bar',
        '  +foo',
        '  ',
        '  '
    ]);

    rendererCustomizationTest('without binary-expression renderer', {
        renderers: [
            './built-in/file',
            './built-in/assertion',
            './built-in/diagram'
        ]
    }, [
        'comment   # /path/to/some_test.js:1',
        '  ',
        '  assert.ok(hoge === fuga, "comment")',
        '            |    |   |               ',
        '            |    |   "bar"           ',
        '            |    false               ',
        '            "foo"                    ',
        '  '
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
                './built-in/file',
                CustomRenderer,
                './built-in/binary-expression'
            ]
        }, [
            'comment   # /path/to/some_test.js:1',
            '  ',
            '  ## assert.ok(hoge === fuga, "comment") ##',
            '  ',
            '  --- [string] fuga',
            '  +++ [string] hoge',
            '  @@ -1,3 +1,3 @@',
            '  -bar',
            '  +foo',
            '  ',
            '  '
        ]);
    })();

});

}));
