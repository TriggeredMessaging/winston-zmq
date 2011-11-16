# winston

A 0mq transport for [winston][0].

## Installation

### Installing npm (node package manager)

``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing winston-zmq

``` bash
  $ npm install winston
  $ npm install winston-zmq
```

## Purpose

This winston transport allows you to publish logs using a 0mq pub socket (so that multiple recipients can subscribe to it)

The message is sent with a variable length prefix that allows the subscribers to subscribe log message of a certain threshold and above.

## Usage
``` js
  var winston = require('winston');

  //
  // Requiring `winston-zmq` will expose
  // `winston.transports.Zmq`
  //
  require('winston-zmq').Zmq;

  winston.add(winston.transports.Zmq, options);
```

The Zmq transport takes the following options. 'db' is required:


* __transport:__ Transport to use for 0mq. (tcp|ipc|inproc|pgm|epgm)
* __address:__ Address that the socket will bind to e.g. "127.0.0.1" or "10.23.45.67"
* __separator:__ Separator to separate the level string from the JSON default |*|
* __prefix:__ Prefix used to denote the log level
* __prefixMapping:__ Mapping between log levels and prefix string length. Used if using custom log levels. e.g. { silly: 1, verbose: 2, info: 3, warn: 4, debug: 5, error: 6 }
* __port:__ [required for tcp] : port to bind to when using the tcp transport  
* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output.
* __formatter:__ Optional formatter function to override the structure of the JSON data sent to the subscriber

*Metadata:* Logged as a native JSON object.

## Examples

###Client 
```
var util = require('util'), zmq = require('zmq');

var socket = zmq.createSocket('sub');
socket.subscribe(''); // subscribe to all
// socket.subscribe('***'); // subscribe to info and above

socket.on('message', function(bufMsg) {
    var msg = bufMsg.toString('utf8');
    try {
        var message = msg.split('|*|')[1];
        oMessage = JSON.parse(message);
        console.log(oMessage);
    } catch(err) {
        console.log(err);
    }
});

socket.connect("tcp://127.0.0.1:7890");
```

### Log Source

```
var winston = require('winston');
var Zmq = require('../lib/winston-zmq.js').Zmq;
var transports = {};

// Set up the zmq transport
transports.Zmq = new Zmq({level : 'silly',port: 7890});

// Instantiate out logger.
var logger = new (winston.Logger)({transports : [transports.Zmq]});

logger.log('silly', 'Some Text', {somekey: 'some data'});
logger.log('error', 'Some Text', {somekey: 'some data'});
```




#### Author: [David Henderson](http://twitter.com/@DHDev)

[0]: https://github.com/indexzero/winston