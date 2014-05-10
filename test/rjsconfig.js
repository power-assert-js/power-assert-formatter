var require = {
    paths: {
        assert: "../bower_components/assert/assert",
        empower: "../bower_components/empower/lib/empower",
        "es5-shim": "../bower_components/es5-shim/es5-shim",
        escodegen: "../bower_components/escodegen/escodegen.browser",
        espower: "../bower_components/espower/lib/espower",
        esprima: "../bower_components/esprima/esprima",
        estraverse: "../bower_components/estraverse/estraverse",
        mocha: "../bower_components/mocha/mocha",
        requirejs: "../bower_components/requirejs/require",
        diff_match_patch: "../bower_components/google-diff-match-patch-js/diff_match_patch"
    },
    shim: {
        assert: {
            exports: "assert"
        },
        diff_match_patch: {
            exports: "diff_match_patch"
        },
        escodegen: {
            exports: "escodegen"
        }
    }
};
