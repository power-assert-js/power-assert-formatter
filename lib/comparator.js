var DiffMatchPatch = require('googlediff'),
    typeNameOf = require('./type-name');

function defaultComparator(config) {
    var dmp = new DiffMatchPatch();

    function compare(pair, lines) {
        if (isStringDiffTarget(pair)) {
            showStringDiff(pair, lines);
        } else {
            showExpectedAndActual(pair, lines);
        }
    }

    function isStringDiffTarget(pair) {
        return typeof pair.left.value === 'string' && typeof pair.right.value === 'string';
    }

    function showExpectedAndActual (pair, lines) {
        lines.push('');
        lines.push('[' + typeNameOf(pair.right.value) + '] ' + pair.right.code);
        lines.push('=> ' + config.stringify(pair.right.value));
        lines.push('[' + typeNameOf(pair.left.value)  + '] ' + pair.left.code);
        lines.push('=> ' + config.stringify(pair.left.value));
    }

    function showStringDiff (pair, lines) {
        var patch;
        if (shouldUseLineLevelDiff(pair.right.value)) {
            patch = udiffLines(pair.right.value, pair.left.value);
        } else {
            patch = udiffChars(pair.right.value, pair.left.value);
        }
        lines.push('');
        lines.push('--- [string] ' + pair.right.code);
        lines.push('+++ [string] ' + pair.left.code);
        lines.push(decodeURIComponent(patch));
    }

    function shouldUseLineLevelDiff (text) {
        return config.lineDiffThreshold < text.split(/\r\n|\r|\n/).length;
    }

    function udiffLines(text1, text2) {
        /*jshint camelcase: false */
        var a = dmp.diff_linesToChars_(text1, text2),
            diffs = dmp.diff_main(a.chars1, a.chars2, false);
        dmp.diff_charsToLines_(diffs, a.lineArray);
        dmp.diff_cleanupSemantic(diffs);
        return dmp.patch_toText(dmp.patch_make(text1, diffs));
    }

    function udiffChars (text1, text2) {
        /*jshint camelcase: false */
        var diffs = dmp.diff_main(text1, text2, false);
        dmp.diff_cleanupSemantic(diffs);
        return dmp.patch_toText(dmp.patch_make(text1, diffs));
    }

    return compare;
}

module.exports = defaultComparator;
