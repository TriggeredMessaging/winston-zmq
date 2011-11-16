var winston = require('winston');
var Zmq = require('../lib/winston-zmq.js').Zmq;


var transports = {};


// set up the zmq transport
var zmqOptions = {
    level : 'silly',
    port: 7890
    };

transports.Zmq = new Zmq(zmqOptions);


// Instantiate out logger.
var logger = new (winston.Logger)({
    transports : [transports.Zmq]
});




function log(){


logger.log('silly', 'Some Text', {somekey: 'some data'});
logger.log('error', 'Some Text', {somekey: 'some data'});


 setTimeout(log, 500);
}

log();