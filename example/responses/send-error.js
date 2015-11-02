module.exports = function (req, res) {
    // Send error to client.
    return function (error) {
        if (error instanceof Error) {
            if (config.get('debug')) {
                error = error.stack;
            } else {
                error = error.message;
            }
        }

        return this.json({
            error: error,
            data: null
        });
    };
};
