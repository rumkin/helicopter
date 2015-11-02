var fs = require('fs');

module.exports = {
    hello(req, res) {
        PrintService.print('hello');
        res.end('Hello');
    },
    text(req, res) {
        return 'Text output';
    },
    stream(req, res) {
        res.type('application/json');
        return fs.createReadStream(config.get('dir') + '/package.json');
    },
    object(req, res) {
        return {
            status: true
        };
    },
    error(req, res) {
        return new Error('Test error');
    },
    generator: function * (req, res) {
        // Wait until timed out promise does resolve.
        yield new Promise((resolve, reject) => {
            setTimeout(resolve, 1000);
        });
        // Return data after 1 second timeout.
        return '1 second ago';
    }
};
