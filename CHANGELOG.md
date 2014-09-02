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
