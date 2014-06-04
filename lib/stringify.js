var typeName = require('type-name'),
    globalConstructors = [
        Boolean,
        Date,
        Number,
        RegExp,
        String
    ];

function defaultStringifier (config) {

    function stringify(obj, depth) {
        if (typeof depth !== 'number') {
            depth = config.stringifyDepth;
        }
        return stringifyAny(obj, depth);
    }

    function stringifyAny(obj, depth) {
        switch(typeof obj) {
        case 'string':
        case 'boolean':
            return JSON.stringify(obj);
        case 'number':
            return stringifyNumber(obj);
        case 'function':
            return '#function#';
        case 'undefined':
            return 'undefined';
        case 'object':
            if (obj === null) {
                return 'null';
            } else if (Array.isArray(obj)) {
                return stringifyArray(obj, depth);
            } else {
                return stringifyObject(obj, depth);
            }
            break;
        default:
            break;
        }
    }

    function stringifyNumber(num) {
        if (isNaN(num)) {
            return 'NaN';
        }
        if (!isFinite(num)) {
            return num === Infinity ? 'Infinity' : '-Infinity';
        }
        return JSON.stringify(num);
    }

    function stringifyArray(ary, depth) {
        depth -= 1;
        if (depth === 0) {
            return '#Array#';
        }
        return '[' + ary.map(function (elem, idx) {
            return stringifyAny(elem, depth);
        }).join(',') + ']';
    }

    function stringifyObject(obj, depth) {
        var pairs, cname;
        depth -= 1;
        if (obj instanceof RegExp) {
            return obj.toString();
        }
        cname = typeName(obj);
        if (cname === '') {
            cname = 'Object';
        }
        if (globalConstructors.some(function (ctor) { return obj instanceof ctor; })) {
            return 'new ' + cname + '(' + JSON.stringify(obj) + ')';
        }
        if (depth === 0) {
            return '#' + cname + '#';
        }
        pairs = [];
        Object.keys(obj).forEach(function (key) {
            var val = stringifyAny(obj[key], depth);
            if (!/^[A-Za-z_]+$/.test(key)) {
                key = JSON.stringify(key);
            }
            pairs.push(key + ':' + val);
        });
        return cname + '{' + pairs.join(',') + '}';
    }

    return stringify;
}

module.exports = defaultStringifier;
