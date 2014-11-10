power-assert-formatter
================================

[![Build Status](https://travis-ci.org/twada/power-assert-formatter.svg?branch=master)](https://travis-ci.org/twada/power-assert-formatter)
[![NPM version](https://badge.fury.io/js/power-assert-formatter.svg)](http://badge.fury.io/js/power-assert-formatter)
[![Dependency Status](https://gemnasium.com/twada/power-assert-formatter.svg)](https://gemnasium.com/twada/power-assert-formatter)
[![Coverage Status](https://coveralls.io/repos/twada/power-assert-formatter/badge.png?branch=master)](https://coveralls.io/r/twada/power-assert-formatter?branch=master)
[![Code Climate](https://codeclimate.com/github/twada/power-assert-formatter/badges/gpa.svg)](https://codeclimate.com/github/twada/power-assert-formatter)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/twada/power-assert-formatter/blob/master/MIT-LICENSE.txt)
[![Built with Gulp](http://img.shields.io/badge/built_with-gulp-brightgreen.svg)](http://gulpjs.com/)

Power Assert output formatter.


DESCRIPTION
---------------------------------------
`power-assert-formatter` is a formatter module for Power Assert output.

Please note that `power-assert-formatter` is a beta version product. Pull-requests, issue reports and patches are always welcomed. See [power-assert](http://github.com/twada/power-assert) project for more documentation.


CHANGELOG
---------------------------------------
See [CHANGELOG](https://github.com/twada/power-assert-formatter/blob/master/CHANGELOG.md)


API
---------------------------------------

### var createFormatter = require('power-assert-formatter');

| return type |
|:------------|
| `function`  |

Returns creator function for power-assert.

### var formatter = createFormatter([options]);

| return type |
|:------------|
| `function`  |

Create formatter function with options. `options` argument is optional.

#### options

| type     | default value |
|:---------|:--------------|
| `object` | (return value of `createFormatter.defaultOptions()`) |

Configuration options. If not passed, default options will be used.

#### options.lineDiffThreshold

| type     | default value |
|:---------|:--------------|
| `number` | `5`           |

Threshold to show diff at character level or line level. If number of lines in target string is greater than `lineDiffThreshold`, then line diff mode will be used to show diff output.

#### options.maxDepth

| type     | default value |
|:---------|:--------------|
| `number` | `1`           |

Depth of object traversal. If object depth is greater than `maxDepth`, compound object (IOW, `Array` or `object`) will be pruned with `#` like `["foo",#Array#,#Object#]`.

#### options.outputOffset

| type     | default value |
|:---------|:--------------|
| `number` | `2`           |

Number of spaces inserted at the left in power-assert output.

#### options.anonymous

| type     | default value |
|:---------|:--------------|
| `string` | `"Object"`    |

Type name to show when target object is created by anonymous constructor.

#### options.circular

| type     | default value   |
|:---------|:----------------|
| `string` | `"#@Circular#"` |

Name to show when target object is detected as circular structure.

#### options.lineSeparator

| type     | default value |
|:---------|:--------------|
| `string` | `"\n"`        |

Line separator in power assert output.

#### options.ambiguousEastAsianCharWidth

| type     | default value |
|:---------|:--------------|
| `number` | `2`           |

Width of 'Ambiguous' characters defined in [Unicode Standard Annex \#11 EAST ASIAN WIDTH](http://www.unicode.org/reports/tr11/#Ambiguous). Configure `options.ambiguousEastAsianCharWidth` to treat ambiguous east asian character as fullwidth (= `2`) or narrow (= `1`). Default is `2`.

#### options.widthOf

| type       | default value |
|:-----------|:--------------|
| `function` | [string-width.js](https://github.com/twada/power-assert-formatter/blob/master/lib/string-width.js) |

Function to calculate width of string.

#### options.stringify

| type       | default value |
|:-----------|:--------------|
| `function` | [stringifier module](https://github.com/twada/stringifier) |

Function to stringify any target value.

#### options.diff

| type       | default value |
|:-----------|:--------------|
| `function` | [udiff.js](https://github.com/twada/power-assert-formatter/blob/master/lib/udiff.js) |

Function to create diff string between two strings.

#### options.writerClass

| type       | default value |
|:-----------|:--------------|
| `function` | [string-writer.js](https://github.com/twada/power-assert-formatter/blob/master/lib/string-writer.js) |

Constructor Function for output writer class.

#### options.renderers

| type                                | default value |
|:------------------------------------|:--------------|
| `Array` of (`string` or `function` )| shown below   |

```javascript
[
    './built-in/file',
    './built-in/assertion',
    './built-in/diagram',
    './built-in/binary-expression'
]
```

Output renderers. Power assert output is rendered by renderers in order. You can create custom renderer and add its constructor function to customize power-assert-output.

```javascript
[
    './built-in/file',
    './built-in/assertion',
    YourCustomRenderer,
    './built-in/binary-expression'
]
```


### var options = createFormatter.defaultOptions();

Returns default options object for createFormatter function. In other words, returns

```javascript
{
    lineDiffThreshold: 5,
    maxDepth: 1,
    anonymous: 'Object',
    circular: '#@Circular#',
    lineSeparator: '\n',
    ambiguousEastAsianCharWidth: 2,
    renderers: [
        './built-in/file',
        './built-in/assertion',
        './built-in/diagram',
        './built-in/binary-expression'
    ]
};
```


### var formattedText = formatter(powerAssertContext);

| return type |
|:------------|
| `string`  |

Format `powerAssertContext` into `formattedText`. `powerAssertContext` is an internal object structure, containing informations to render. Example of `powerAssertContext` is:

```javascript
{
    source: {
        content: "assert.equal(foo, bar)",
        filepath: "/path/to/some_test.js",
        line: 1
    },
    args: [
        {
            value: "foo",
            events: [
                {
                    value: "foo",
                    espath: "arguments/0"
                }
            ]
        },
        {
            value: "bar",
            events: [
                {
                    value: "bar",
                    espath: "arguments/1"
                }
            ]
        }
    ]
}
```

Note that structure of powerAssertContext may change.


INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save-dev power-assert-formatter


### via bower

Install

    $ bower install --save-dev power-assert-formatter

Then load (`powerAssertFormatter` function is exported)

    <script type="text/javascript" src="./path/to/bower_components/power-assert-formatter/build/power-assert-formatter.js"></script>


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](https://github.com/twada/power-assert-formatter/blob/master/MIT-LICENSE.txt) license.
