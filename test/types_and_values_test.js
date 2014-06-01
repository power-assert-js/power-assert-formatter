(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['power-assert-formatter', 'assert'], factory);
    } else if (typeof exports === 'object') {
        factory(require('../lib/power-assert-formatter'), require('assert'));
    } else {
        factory(root.powerAssertFormatter, root.assert);
    }
}(this, function (
    formatter,
    assert
) {
    function Person(name, age) {
        this.name = name;
        this.age = age;
    }
    var AnonPerson = function(name, age) {
        this.name = name;
        this.age = age;
    };
    var constructorNameOf = formatter.constructorNameOf,
        typeNameOf = formatter.typeNameOf,
        isComparedByValue = formatter.isComparedByValue,
        fixtures = {
            'string literal': 'hoge',
            'number literal': 5,
            'boolean literal': false,
            'regexp literal': /^not/,
            'array literal': [],
            'function expression': function () {},
            'String object': new String('hoge'),
            'Number object': new Number('1'),
            'Boolean object':new Boolean('1'),
            'Date object': new Date(),
            'RegExp object': new RegExp('^not', 'g'),
            'Array object': new Array(),
            'Function object': new Function('x', 'y', 'return x + y'),
            'user-defined constructor': new Person('alice', 5),
            'anonymous constructor': new AnonPerson('bob', 4),
            'NaN': NaN,
            'Infinity': Infinity,
            'null literal': null,
            'undefined value': undefined
        };


    suite('constructorNameOf ', function () {
        [
            ['string literal',           'String'],
            ['number literal',           'Number'],
            ['boolean literal',          'Boolean'],
            ['regexp literal',           'RegExp'],
            ['array literal',            'Array'],
            ['function expression',      'Function'],
            ['String object',            'String'],
            ['Number object',            'Number'],
            ['Boolean object',           'Boolean'],
            ['Date object',              'Date'],
            ['RegExp object',            'RegExp'],
            ['Array object',             'Array'],
            ['Function object',          'Function'],
            ['user-defined constructor', 'Person'],
            ['anonymous constructor',    'Object'],
            ['NaN',                      'Number'],
            ['Infinity',                 'Number']
        ].forEach(function(col) {
            var testName = col[0], input = fixtures[testName], expected = col[1];
            test(testName, function () {
                assert.equal(constructorNameOf(input), expected);
            });
        });
        test('undefined throws TypeError', function () {
            assert.throws(function () {
                constructorNameOf(undefined);
            });
        });
        test('null throws TypeError', function () {
            assert.throws(function () {
                constructorNameOf(null);
            });
        });
    });


    suite('typeNameOf', function () {
        [
            ['string literal',           'string'],
            ['number literal',           'number'],
            ['boolean literal',          'boolean'],
            ['regexp literal',           'RegExp'],
            ['array literal',            'Array'],
            ['function expression',      'function'],
            ['String object',            'String'],
            ['Number object',            'Number'],
            ['Boolean object',           'Boolean'],
            ['Date object',              'Date'],
            ['RegExp object',            'RegExp'],
            ['Array object',             'Array'],
            ['Function object',          'function'], // be careful!
            ['user-defined constructor', 'Person'],
            ['anonymous constructor',    'Object'],
            ['NaN',                      'number'],
            ['Infinity',                 'number'],
            ['null literal',             'null'],
            ['undefined value',          'undefined']
        ].forEach(function(col) {
            var testName = col[0], input = fixtures[testName], expected = col[1];
            test(testName, function () {
                assert.equal(typeNameOf(input), expected);
            });
        });
    });


    suite('isComparedByValue', function () {
        [
            ['string literal',           true],
            ['number literal',           true],
            ['boolean literal',          true],
            ['regexp literal',           false],
            ['array literal',            false],
            ['function expression',      false],
            ['String object',            false],
            ['Number object',            false],
            ['Boolean object',           false],
            ['Date object',              false],
            ['RegExp object',            false],
            ['Array object',             false],
            ['Function object',          false],
            ['user-defined constructor', false],
            ['anonymous constructor',    false],
            ['NaN',                      true],
            ['Infinity',                 true],
            ['null literal',             true],
            ['undefined value',          true]
        ].forEach(function(col) {
            var testName = col[0], input = fixtures[testName], expected = col[1];
            test(testName, function () {
                assert.equal(isComparedByValue(input), expected);
            });
        });
    });

}));
