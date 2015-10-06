module.exports = {
    send: function * (params) {
        PrintService.print('Message', params.text);

        return {response: 'got this'};
    }
};
