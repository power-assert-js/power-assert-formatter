function constructorNameOf (obj) {
    var ctor = obj.constructor,
        cname = '';
    if (typeof(ctor) === 'function') {
        cname = ctor.name ? ctor.name : Object.prototype.toString.call(obj).slice(8, -1);
    }
    return cname ? cname : 'Object';
}

module.exports = constructorNameOf;
