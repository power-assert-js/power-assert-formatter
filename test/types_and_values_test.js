(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['power-assert-formatter', 'assert'], factory);
    } else if (typeof exports === 'object') {
        factory(require('..'), require('assert'));
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
    var isComparedByValue = formatter.isComparedByValue,
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
            'Error object': new Error('error!'),
            'user-defined constructor': new Person('alice', 5),
            'anonymous constructor': new AnonPerson('bob', 4),
            'NaN': NaN,
            'Infinity': Infinity,
            'Math': Math,
            'JSON': JSON,
            'arguments object': (function(){ return arguments; })(),
            'null literal': null,
            'undefined value': undefined
        };

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
            ['Error object',             false],
            ['NaN',                      true],
            ['Infinity',                 true],
            ['Math',                     false],
            ['JSON',                     false],
            ['arguments object',         false],
            ['user-defined constructor', false],
            ['anonymous constructor',    false],
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
