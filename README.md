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

## Motivation


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

The MongoDB transport takes the following options. 'db' is required:

* __level:__ Level of messages that this transport should log.
* __silent:__ Boolean flag indicating whether to suppress output.
* __formatter:__ Optional formatter function to override the structure of the JSON data sent to the subscriber

*Metadata:* Logged as a native JSON object.

#### Author: [David Henderson](@DHDev)

[0]: https://github.com/indexzero/winston