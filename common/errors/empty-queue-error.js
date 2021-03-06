/**
 * Created by dmytro on 15.08.16.
 */
'use strict';
function EmptyQueueError(message) {
    Error.call(this, message);
    this.name = 'EmptyQueueError';
    this.message = message;

    Error.captureStackTrace(this, EmptyQueueError);
}
EmptyQueueError.prototype = Object.create(Error.prototype);

module.exports = EmptyQueueError;