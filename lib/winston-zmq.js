/*
 * winston-zmq.js: Transport for sending via a 0mq publish socket
 *
 * (C) 2011 TriggredMessaging Ltd
 * MIT LICENCE
 *
 */

var util = require('util'),
    zmq = require('zmq'),
    winston = require('winston');

//
// ### function Zmq (options)
// Constructor for the MongoDB transport object.
//
var Zmq = exports.Zmq = function (options) {
    options = options || {};
    var self = this;

    //console.log(options);

    if ((!options.transport || options.transport === 'tcp') && !options.port) {
        throw new Error("Cannot log to zmq without a port number (for tcp).");
    }

    // Validate the transport
    if (options.transport) {
        if (!(
            options.transport === 'inproc'
                || options.transport === 'ipc'
                || options.transport === 'tcp'
                || options.transport === 'pgm'
                || options.transport === 'epgm')) {
            throw new Error("Invalid transport option: " + options.transport);
        }
    }

    if (options.address && typeof options.address !== 'string') {
        throw new Error("The Address option must be a string. e.g. '127.0.0.1' or '*' ");
    }

    this.name = 'zmq';

    this.port = options.port;
    this.level = options.level || 'info';
    this.transport = options.transport || 'tcp'; // use tcp by default. See http://api.zeromq.org/2-1:zmq-bind
    this.address = options.address || '*'; // Bind to all interfaces
    this.separator = options.separator || '|*|'; // Separate the level string from the JSON
    this.prefix = options.prefix || '*';
    this.prefixMapping = options.prefixMapping || { silly: 1, verbose: 2, info: 3, warn: 4, debug: 5, error: 6 }; // Map log levels to prefix lengths


    this.state = 'unbound';
    this.error = null;
    this.queue = [];

    /*this.db         = options.db;
     this.host       = options.host       || 'localhost';

     this.collection = options.collection || "log";
     this.safe       = options.safe       || true;
     this.level      = options.level      || 'info';
     this.silent     = options.silent     || false;
     this.username   = options.username   || null;
     this.password   = options.password   || null;
     this.keepAlive  = options.keepAlive  || 10000;
     this.state      = 'unopened';
     this.formatter  = options.formatter  || null;
     this.pending    = [];
     */

    // Create a pub socket, and bind it to the required port and interface.
    this.socket = zmq.socket('pub');

    var bindString = this.transport + '://' + this.address;
    if (this.transport === 'tcp') {
        bindString += ':' + this.port;
    }

    this.socket.bind(bindString, function(err) {
        if (err) {
            self.state = 'error';
            self.error = err;
        } else {
            self.state = 'bound';


            if (self.queue.length) {
                var msg;
                while(self.queue.length){
                    msg = self.queue.pop();
                    self.socket.send(msg);
                    self.emit('logged');
                }
            }
        }
    });
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Zmq, winston.Transport);

//
// Define a getter so that `winston.transports.MongoDB` 
// is available and thus backwards compatible.
//
winston.transports.Zmq = Zmq;

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Zmq.prototype.log = function (level, msg, meta, callback) {
    var self = this;
    var message;

    if (this.silent) {
        return callback(null, true);


    }


    try {
        message = self.constructMessage(level, msg, meta);
    } catch(err) {
        callback(err, false);
        return;
    }


    if (self.state !== 'bound') {
        // Put off sending until we're bound correctly.
        self.queue.push(message);
        return callback(null, true);
    }


    if (!self.socket || self.socket._zmq.state > 0) {
        return callback(null, true);
    }


    // Send to zmq.
    self.socket.send(message);
    self.emit('logged');

    callback(null, true);
};


Zmq.prototype.constructMessage = function(level, msg, meta) {
    var self
        = this;
    var entry;
    var prefix = 'NONE';
    var prefixLength;
    var i;
    // Now get the prefix from the logging level.var


    if (!self.prefix) {
        throw new Error('No Prefix set');
    }

    if (self.prefixMapping[level]) {

        var prefixSize = self.prefixMapping[level] * 1;

        if (prefixSize < 1) {
            throw new Error('The mapped prefix level for ' + level + ' is lss than 1.');
        }

        // Generate a repeated string.
        prefix = Array(prefixSize + 1).join(self.prefix);

    } else {
        throw new Error('There is no mapping present for log level "' + level + '". You should pass a prefixMapping object in the options: e.g. {"' + level + '": 2}');
    }


    // Get our message together
    if (typeof self.formatter === 'function') {
        entry = self.formatter(level, msg, meta);
    } else {
        entry = {
            timestamp: new Date(), // RFC3339/ISO8601 format instead of common.timestamp()
            level: level,
            message: msg,
            meta: meta
        };
        entry = JSON.stringify(entry);
    }

    // Prefix the message with the requisite number of the prefix
    var message = prefix + this.separator + entry;


    return message;


}

Zmq.prototype.close = function() {
    if (this.socket) {
        this.socket.close();
        this.state = 'closed';
    }
}


//
// ### function open (callback)
// #### @callback {function} Continuation to respond to when complete
// Attempts to open a new connection to MongoDB. If one has not opened yet
// then the callback is enqueued for later flushing.
//
Zmq.prototype.open = function (callback) {

    return;

    var self = this;

    if (this.state === 'opening' || this.state === 'unopened') {
        //
        // While opening our MongoDB connection, append any callback
        // to a list that is managed by this instance.
        //
        this.pending.push(callback);

        if (this.state === 'opening') {
            return;
        }
    }
    else if (this.state === 'opened') {
        return callback();
    }
    else if (this.state === 'error') {
        return callback(err);
    }

    function flushPending(err, db) {
        self._db = db;
        self.state = 'opened';

        //
        // Iterate over all callbacks that have accumulated during
        // the creation of the TCP socket.
        //
        for (var i = 0; i < self.pending.length; i++) {
            self.pending[i]();
        }

        // Quickly truncate the Array (this is more performant).
        self.pending.length = 0;
    }

    function onError(err) {
        self.state = 'error';
        self.error = err;
        flushPending(err, false);
    }

    this.state = 'opening';
    this.client.open(function (err, db) {
        if (err) {
            return onError(err);
        }
        else if (self.username && self.password) {
            return self.client.authenticate(self.username, self.password, function (err) {
                return err ? onError(err) : flushPending(null, db);
            });
        }

        flushPending(null, db)
    });

    //
    // Set a timeout to close the client connection unless `this.keepAlive`
    // has been set to true in which case it is the responsibility of the
    // programmer to close the underlying connection.
    //
    if (!(this.keepAlive === true)) {
        setTimeout(function () {
            self.state = 'unopened';
            return self._db ? self._db.close() : null
        }, this.keepAlive);
    }
};
