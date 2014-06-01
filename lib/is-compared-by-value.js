function isComparedByValue (obj) {
    if (obj === null) {
        return true;
    }
    switch(typeof obj) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
        return true;
    }
    return false;
}

module.exports = isComparedByValue;
