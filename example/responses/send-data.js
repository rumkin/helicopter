module.exports = function (req, res) {
    // Send success data to client.
    return function (data) {
        return this.json({
            error: null,
            data
        });
    };
};
