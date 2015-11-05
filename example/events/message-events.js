var HelicopterError = require('../../src/helicopter.js').Error;

module.exports = {
    send: function * (params) {
        PrintService.print('Message', params.text);

        return {got: params.text};
    },
    promise: function (params) {
        return new Promise(function (resolve, reject) {
            setImmediate(resolve, {
                got: params.text
            });
        });
    },
    error: function * (params) {
        throw new HelicopterError('Test error');
    },
    nativeError: function * (params) {
        throw new Error('Test error');
    }
};
