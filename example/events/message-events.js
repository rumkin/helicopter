var HelicopterError = require('../../src/helicopter.js').Error;

module.exports = {
    send: function * (params) {
        PrintService.print('Message', params.text);

        return {response: 'got this'};
    },
    error: function * (params) {
        throw new HelicopterError('Test error');
    },
    nativeError: function * (params) {
        throw new Error('Test error');
    }
};
