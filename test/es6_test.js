var createFormatter = require('..');
var empower = require('empower');
var baseAssert = require('assert');
var assert = empower(baseAssert, createFormatter());
var babel = require('babel-core');

function weave (line) {
    return babel.transform(line, {
        filename: '/path/to/some_test.js',
        plugins: ['babel-plugin-espower']
    }).code;
}

function assertPowerAssertContextFormatting (body, expectedLines) {
    try {
        body();
        baseAssert.fail('AssertionError should be thrown');
    } catch (e) {
        baseAssert.equal(e.message, expectedLines.join('\n'));
    }
}

suite('ES6 features', function () {

    test('TemplateLiteral', function () {
        var alice = { name: 'alice' };
        var bob = { name: 'bob' };
        assertPowerAssertContextFormatting(function () {
            eval(weave('assert(`${alice.name} and ${bob.name}` === `bob and alice`);'));
        }, [
            '  # /path/to/some_test.js:1',
            '  ',
            '  assert(`${ alice.name } and ${ bob.name }` === `bob and alice`)',
            '         |   |     |             |   |       |   |               ',
            '         |   |     |             |   |       |   "bob and alice" ',
            '         |   |     |             |   "bob"   false               ',
            '         |   |     "alice"       Object{name:"bob"}              ',
            '         |   Object{name:"alice"}                                ',
            '         "alice and bob"                                         ',
            '  ',
            '  --- [string] `bob and alice`',
            '  +++ [string] `${ alice.name } and ${ bob.name }`',
            '  @@ -1,13 +1,13 @@',
            '  -bob and alice',
            '  +alice and bob',
            '  ',
            '  '
        ]);
    });

    test('ArrowFunctionExpression and SpreadElement', function () {
        var seven = 7, ary = [4, 5];
        assertPowerAssertContextFormatting(function () {
            eval(weave('assert(seven === ((v, i) => v + i)(...[...ary]));'));
        }, [
            '  # /path/to/some_test.js:1',
            '  ',
            '  assert(seven === ((v, i) => v + i)(...[...ary]))',
            '         |     |   |                    |   |     ',
            '         |     |   |                    |   [4,5] ',
            '         |     |   9                    [4,5]     ',
            '         7     false                              ',
            '  ',
            '  [number] ((v, i) => v + i)(...[...ary])',
            '  => 9',
            '  [number] seven',
            '  => 7',
            '  '
        ]);
    });

    test('Enhanced Object Literals', function () {
        var name = 'bobby';
        assertPowerAssertContextFormatting(function () {
            eval(weave('assert.deepEqual({ name, [ `${name} greet` ]: `Hello, I am ${name}` }, null);'));
        }, [
            '  # /path/to/some_test.js:1',
            '  ',
            '  assert.deepEqual({name,[`${ name } greet`]: `Hello, I am ${ name }`}, null)',
            '                   |      |   |               |               |              ',
            '                   |      |   |               |               "bobby"        ',
            '                   |      |   "bobby"         "Hello, I am bobby"            ',
            '                   |      "bobby greet"                                      ',
            '                   Object{name:"bobby","bobby greet":"Hello, I am bobby"}    ',
            '  '
        ]);
    });

});
