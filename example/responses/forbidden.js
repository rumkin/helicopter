module.exports = function (req, res) {
    return function (message) {
        this.status(403).end(message || 'Access forbidden');
    };
};
