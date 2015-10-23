var util = require('util');

module.exports = HelicopterError;

function HelicopterError(message) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;

    if (this.constructor.hasOwnProperty(message)) {
        this.code = message;
        message = this.constructor[message];
    } else {
        this.code = 'UNKNOWN_ERROR';
    }

    this.message = message;
}

util.inherits(HelicopterError, Error);

HelicopterError.prototype.toJSON = function () {
    return {
        code: this.code,
        message: this.message
    };
};
HelicopterError.ROUTER_BAD_ACTION = 'Invalid action #{action} for route #{route}.';
HelicopterError.ROUTER_BAD_METHOD = 'Invalid method #{method} for route #{route}.';
