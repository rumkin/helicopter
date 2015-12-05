var fs = require('fs');

module.exports = {
    // Extends default controller
    extends: 'default',

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
    },

    throws(req, res) {
        throw new Error('throws error');
    },

    // Call socket.io events via http interface example
    events: function * (req, res) {
        if (! config.get('debug')) {
            res.forbidden();
            return;
        }

        var event = req.params.event.split('.');

        var target = Events;
        while (event.length > 1) {
            let segment = event.shift();
            if (! target.hasOwnProperty(segment)) {
                return res.notFound();
            }

            if (typeof target[segment] !== 'object') {
                res.notFound();
            }

            target = target[segment];
        }

        var method = target[event.shift()];
        if (typeof method !== 'function') {
            return res.notFound();
        }

        return yield method.call(target, req.body);
    }
};
