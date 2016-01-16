'use strict';

var CustomError = require('./custom-error.js');

module.exports = HelicopterError;

function HelicopterError(message, details) {
    CustomError.call(this, message, details);
}

CustomError.extend(HelicopterError);

// Error messages
HelicopterError.ROUTER_BAD_ACTION = 'Invalid action for route ${route}.';
HelicopterError.ROUTER_BAD_METHOD = 'Invalid method ${method} for route ${route}.';
