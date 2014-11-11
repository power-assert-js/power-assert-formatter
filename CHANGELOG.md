### [0.10.1](https://github.com/twada/power-assert-formatter/releases/tag/v0.10.1) (2014-11-12)


* **power-assert-formatter:**
  * stop using inherits module directly since web shim is handled by browserify ([984becd6](https://github.com/twada/power-assert-formatter/commit/984becd6f08454babac80f99521a98841c23797a))


## [0.10.0](https://github.com/twada/power-assert-formatter/releases/tag/v0.10.0) (2014-11-11)


#### Features

* **new options**
  * [options.outputOffset](https://github.com/twada/power-assert-formatter#optionsoutputoffset)
  * [options.ambiguousEastAsianCharWidth](https://github.com/twada/power-assert-formatter#optionsambiguouseastasiancharwidth)
  * [options.diff](https://github.com/twada/power-assert-formatter#optionsdiff)

* **power-assert-formatter:**
  * make string diff function pluggable ([6571eaa3](https://github.com/twada/power-assert-formatter/commit/6571eaa34ce310d796fa8e2040143516db094527))
  * outputOffset option to configure number of spaces inserted at the left ([d646aa86](https://github.com/twada/power-assert-formatter/commit/d646aa86d9ed8952433a2ca6f903362754aa5a31))
  * set outputOffset default to 2 ([f05b411d](https://github.com/twada/power-assert-formatter/commit/f05b411ddb5123d15f5613714fec1b777403e853))
  * make ambiguous east asian character width configurable ([7e8c9328](https://github.com/twada/power-assert-formatter/commit/7e8c9328b1b62879c0ee0a86a495fa25f5c22865))
  * treat ambiguous east asian character as fullwidth (= 2) ([20ee139a](https://github.com/twada/power-assert-formatter/commit/20ee139a13677a043ce8c5982b8dae9d6ef6cb59))
  * use inherits module to reduce browserify build size ([26b62daf](https://github.com/twada/power-assert-formatter/commit/26b62daf7f46f2b47029013568407e6ca56631bb))
  * update object-keys ([9285c343](https://github.com/twada/power-assert-formatter/commit/9285c3430261513dad6283a4dd100acb4dd91925))
  * update estraverse and stringifier ([06f3748b](https://github.com/twada/power-assert-formatter/commit/06f3748b9995de035110a2e562f81fd1dc09c972))


## 0.9.0 (2014-09-02)


#### Features

* **power-assert-formatter:**
  * move built-in renderers to ./built-in/ ([acf85109](https://github.com/twada/power-assert-formatter/commit/acf85109bcb579109b80a36a8a6439c4e028066d))
  * customize rendering by using custom renderer constructor in `renderers` option ([265d3539](https://github.com/twada/power-assert-formatter/commit/265d353997f7321e9e24c5252c7aa0f4c696624a))
  * use EventEmitter to make renderers customizable ([7c190e11](https://github.com/twada/power-assert-formatter/commit/7c190e1170de8c96129a2ccd3e67fd9f14623732))


#### Breaking Changes

* built-in renderers are listed as relative path

If you are customizing renderers by `options.renderers`, you may have to migrate.

To migrate, change your code from the following:

```
[
    'file',
    'assertion',
    'diagram',
    'binary-expression'
]
```

To:

```
 [
    './built-in/file',
    './built-in/assertion',
    './built-in/diagram',
    './built-in/binary-expression'
 ]
```

 ([265d3539](https://github.com/twada/power-assert-formatter/commit/265d353997f7321e9e24c5252c7aa0f4c696624a)), ([acf85109](https://github.com/twada/power-assert-formatter/commit/acf85109bcb579109b80a36a8a6439c4e028066d))


## 0.8.0 (2014-08-12)


#### Features


* **power-assert-formatter:**
  * [built and modularized by browserify](https://github.com/twada/power-assert-formatter/pull/8)
  * [use spun-off stringifier module](https://github.com/twada/power-assert-formatter/pull/9)


#### Breaking Changes

* option `stringifyDepth` does not supported any more. use `maxDepth` option instead.

If you already customize formatter config using `stringifyDepth`, you need to migarte. To migrate, change your code from the following:

```javascript
var createFormatter = require('power-assert-formatter');
var options = {
    stringifyDepth: 2
};
var formatter = createFormatter(options);
```

To:

```javascript
var createFormatter = require('power-assert-formatter');
var options = {
    maxDepth: 1
};
var formatter = createFormatter(options);
```

Beware that `stringifyDepth - 1 === maxDepth` !
