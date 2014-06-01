var constructorNameOf = require('./constructor-name');

function typeNameOf (val) {
    var type = typeof(val);
    if (val === null) {
        return 'null';
    }
    if (typeof val === 'undefined') {
        return 'undefined';
    }
    if (type === 'object') {
        if (Array.isArray(val)) {
            return 'Array';
        }
        return constructorNameOf(val);
    }
    return type;
}

module.exports = typeNameOf;
