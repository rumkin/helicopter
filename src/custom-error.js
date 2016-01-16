var util = require('util');
var helpers = require('./helpers.js');
var classify = require('../lib/classify.js');

module.exports = CustomError;

/**
 * Custom error constructor has two arguments: message and details.
 * Message is a string with placeholders or error code. Properties from
 * details replace message placeholders.
 *
 * Error codes could be defined like so:
 * CustomError.CODE = 'Any error'
 *
 * @param {string} message Error message or code.
 * @param {object} details Error details.
 * @example
 *
 * // Create error with default code `CustomError.DEFAULT_CODE`.
 * var error = new CustomError('Some error');
 *
 * error.code; // -> 'ERROR';
 * error.message; // -> 'Some error'
 *
 * // Define new code
 * CustomError.FILE_NOT_FOUND = 'File not found at ${path}'
 *
 * // Create error
 * var error = new CustomError('FILE_NOT_FOUND', {path: 'index.js'});
 *
 * error.code; // -> 'FILE_NOT_FOUND';
 * error.message; // -> 'File not found at index.js'
 */
function CustomError(message, details) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;

    if (this.constructor.hasOwnProperty(message)) {
        this.code = message;
        message = this.constructor[message];
    } else {
        this.code = this.constructor.DEFAULT_CODE;
    }

    if (typeof details !== 'undefined') {
        message = helpers.replace(message, details);
        this.details = details;
    }

    this.message = message;
}

util.inherits(CustomError, Error);

CustomError.prototype.toJSON = function () {
    return {
        code: this.code,
        message: this.message,
        details: this.details
    };
};

classify(CustomError);

// Default error code
CustomError.DEFAULT_CODE = 'ERROR';
