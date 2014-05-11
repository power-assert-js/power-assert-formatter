(function (root, factory) {
    'use strict';

    var dependencies = [
        '../lib/power-assert-formatter',
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
    formatter,
    assert
) {
    var constructorNameOf = formatter.constructorNameOf,
        typeNameOf = formatter.typeNameOf;

    suite('constructorNameOf', function () {

        suite('primitives', function () {
            test('string', function () {
                assert.equal(constructorNameOf('hoge'), 'String');
            });
            test('number', function () {
                assert.equal(constructorNameOf(5), 'Number');
            });
            test('boolean', function () {
                assert.equal(constructorNameOf(false), 'Boolean');
            });
            test('regexp literal', function () {
                assert.equal(constructorNameOf(/^not/), 'RegExp');
            });
            test('array literal', function () {
                assert.equal(constructorNameOf([]), 'Array');
            });
            test('function', function () {
                assert.equal(constructorNameOf(function () {}), 'Function');
            });
        });

        suite('global objects', function () {
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
            test('NaN', function () {
                assert.equal(constructorNameOf(NaN), 'Number');
            });
            test('Infinity', function () {
                assert.equal(constructorNameOf(Infinity), 'Number');
            });
        });

        suite('wrapper objects', function () {
            test('String', function () {
                assert.equal(constructorNameOf(new String('hoge')), 'String');
            });
            test('Number', function () {
                assert.equal(constructorNameOf(new Number('1')), 'Number');
            });
            test('Boolean', function () {
                assert.equal(constructorNameOf(new Boolean('1')), 'Boolean');
            });
            test('Date', function () {
                assert.equal(constructorNameOf(new Date()), 'Date');
            });
            test('RegExp', function () {
                assert.equal(constructorNameOf(new RegExp('^not', 'g')), 'RegExp');
            });
            test('Array', function () {
                assert.equal(constructorNameOf(new Array()), 'Array');
            });
            test('Function', function () {
                assert.equal(constructorNameOf(new Function('x', 'y', 'return x + y')), 'Function');
            });
        });

        suite('user-defined constructor', function () {
            test('named', function () {
                function Person(name, age) {
                    this.name = name;
                    this.age = age;
                }
                assert.equal(constructorNameOf(new Person('bob', 5)), 'Person');
            });
            test('anonymous', function () {
                var Person = function(name, age) {
                    this.name = name;
                    this.age = age;
                };
                assert.equal(constructorNameOf(new Person('bob', 5)), 'Object');
            });
        });
    });


    suite('typeNameOf', function () {

        suite('primitives', function () {
            test('string', function () {
                assert.equal(typeNameOf('hoge'), 'string');
            });
            test('number', function () {
                assert.equal(typeNameOf(5), 'number');
            });
            test('boolean', function () {
                assert.equal(typeNameOf(false), 'boolean');
            });
            test('regexp literal', function () {
                assert.equal(typeNameOf(/^not/), 'RegExp');
            });
            test('array literal', function () {
                assert.equal(typeNameOf([]), 'Array');
            });
            test('function', function () {
                assert.equal(typeNameOf(function () {}), 'function');
            });
        });

        suite('global objects', function () {
            test('undefined', function () {
                assert.equal(typeNameOf(undefined), 'undefined');
            });
            test('null', function () {
                assert.equal(typeNameOf(null), 'null');
            });
            test('NaN', function () {
                assert.equal(typeNameOf(NaN), 'number');
            });
            test('Infinity', function () {
                assert.equal(typeNameOf(Infinity), 'number');
            });
        });

        suite('wrapper objects', function () {
            test('String', function () {
                assert.equal(typeNameOf(new String('hoge')), 'String');
            });
            test('Number', function () {
                assert.equal(typeNameOf(new Number('1')), 'Number');
            });
            test('Boolean', function () {
                assert.equal(typeNameOf(new Boolean('1')), 'Boolean');
            });
            test('Date', function () {
                assert.equal(typeNameOf(new Date()), 'Date');
            });
            test('RegExp', function () {
                assert.equal(typeNameOf(new RegExp('^not', 'g')), 'RegExp');
            });
            test('Array', function () {
                assert.equal(typeNameOf(new Array()), 'Array');
            });
            test('Function', function () {
                assert.equal(typeNameOf(new Function('x', 'y', 'return x + y')), 'function'); // be careful!
            });
        });

        suite('user-defined constructor', function () {
            test('named', function () {
                function Person(name, age) {
                    this.name = name;
                    this.age = age;
                }
                assert.equal(typeNameOf(new Person('bob', 5)), 'Person');
            });
            test('anonymous', function () {
                var Person = function(name, age) {
                    this.name = name;
                    this.age = age;
                };
                assert.equal(typeNameOf(new Person('bob', 5)), 'Object');
            });
        });
    });

}));
