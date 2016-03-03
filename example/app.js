var Helicopter = require('../src/helicopter.js');

module.exports = Helicopter.extend({
    init() {
        this.loadConfig();
        this.config.apiDir = '.';
        this.module(require('./modules/db.js'));
    },
    commands() {
        return {
            print: {
                params: '[text]',
                description: 'Print console arguments',
                action: (text) => {
                    this.service('Print').print(text);
                }
            }
        };
    }
});
