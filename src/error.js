var util = require('util');

module.exports = HelicopterError;

function HelicopterError(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;

    if (this.constructor.hasOwnProperty(message)) {
        message = this.constructor[message];
    }

    this.message = message;
}

util.inherits(HelicopterError, Error);

HelicopterError.ROUTER_BAD_ACTION = 'Invalid action #{action} for route #{route}.';
HelicopterError.ROUTER_BAD_METHOD = 'Invalid method #{method} for route #{route}.';
