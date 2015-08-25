var require = {
    paths: {
        assert: "../bower_components/assert/assert",
        empower: "../node_modules/empower/build/empower",
        esprima: '../node_modules/esprima/esprima',
        escodegen: '../bower_components/escodegen/escodegen.browser',
        espower: "../node_modules/espower/build/espower",
        "power-assert-formatter": "../build/power-assert-formatter",
        mocha: "../bower_components/mocha/mocha",
        requirejs: "../bower_components/requirejs/require"
    },
    shim: {
        assert: {
            exports: "assert"
        }
    }
};
