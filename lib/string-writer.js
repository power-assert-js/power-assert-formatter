function StringWriter (lineSeparator) {
    this.lines = [];
    this.lineSeparator = lineSeparator;
}

StringWriter.prototype.write = function (str) {
    this.lines.push(str);
};

StringWriter.prototype.toString = function () {
    return this.lines.join(this.lineSeparator);
};

module.exports = StringWriter;
