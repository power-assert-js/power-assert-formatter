function multibyteStringWidthOf (str) {
    var i, c, width = 0;
    for(i = 0; i < str.length; i+=1){
        c = str.charCodeAt(i);
        if ((0x0 <= c && c < 0x81) || (c === 0xf8f0) || (0xff61 <= c && c < 0xffa0) || (0xf8f1 <= c && c < 0xf8f4)) {
            width += 1;
        } else {
            width += 2;
        }
    }
    return width;
}

module.exports = multibyteStringWidthOf;
