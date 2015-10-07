var Helicopter = require('helicopter');

module.exports = Helicopter.extend({
    commands() {
        return {
            print: {
                params: '[text]',
                description: 'Print console argument',
                action: (text) => {
                    console.log('Hello');
                }
            }
        };
    }
});
