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
    }
};
