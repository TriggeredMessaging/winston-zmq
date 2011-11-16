/*
 * mongodb-test.js: Tests for instances of the MongoDB transport
 *
 * (C) 2011 Charlie Robbins, Kendrick Taylor
 * MIT LICENSE
 *
 */

var path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    winston = require('winston'),
    helpers = require('winston/test/helpers'),
    Zmq = require('../lib/winston-zmq').Zmq;
require('should');

function assertZmq(transport) {
    assert.instanceOf(transport, Zmq);
    assert.isFunction(transport.log);
}


var config = helpers.loadConfig(__dirname),
    transport = new (Zmq)(config.transports.zmq);

vows.describe('winston-zmq').addBatch({
    "An instance of the Zmq Transport": {
        "should have the proper methods defined": function () {
            assertZmq(transport);
        }

    }
}).addBatch({
        "An instance of the Zmq Transport": {
            "should throw errors when loading with a bad transport": function() {
                assert.throws(function() {
                        new (Zmq)(config.transports.zmq_bad_transport)
                    },
                    function(err) {
                        assert.isNotNull(err);
                        assert.equal(err.message, 'Invalid transport option: BadTransport');
                        return true;
                    });
            },
            "should throw errors when loading with no port": function() {
                assert.throws(function() {
                        new (Zmq)(config.transports.zmq_no_port)
                    },
                    function(err) {
                        assert.isNotNull(err);
                        assert.equal(err.message, 'Cannot log to zmq without a port number (for tcp).');
                        return true;
                    });
            },
            "should throw errors when loading bad address": function() {
                assert.throws(function() {
                        new (Zmq)(config.transports.zmq_bad_address)
                    },
                    function(err) {
                        assert.isNotNull(err);
                        assert.equal(err.message, "The Address option must be a string. e.g. '127.0.0.1' or '*' ");
                        return true;
                    });
            }
        }

    }


).addBatch({
        "A zmq logger" : {
            topic: function() {
                var logger = new (Zmq)(config.transports.zmq_test2);
                var callback = this.callback;
                var started = new Date();

                function checkChanged() {
                    if ((started - new Date()) > 10000) {
                        throw new Error('Setup timed out');
                    }
                    if (logger.state !== 'unbound') {
                        callback(null, logger);
                        return;
                    }

                    setTimeout(function() {
                        checkChanged();
                    }, 500);
                }

                checkChanged();
            },

            'should have a state of bound': function(err, logger) {
                assert.equal(logger.state, 'bound');
                assert.isNull(logger.error);
            },

            'should be able to be closed': function(err, logger) {
                assert.equal(logger.state, 'bound');
                assert.isNull(logger.error);
                assert.equal(logger.socket._zmq.state, 0); //open
                logger.close();
                assert.equal(logger.socket._zmq.state, 2); //closed
                assert.isNull(logger.error);
            }
        }
    }

).addBatch({
        "A zmq logger" : {
            topic: function() {
                var logger = new (Zmq)(config.transports.zmq_test2);
                var callback = this.callback;
                var started = new Date();

                function checkChanged() {
                    if ((started - new Date()) > 10000) {
                        throw new Error('Setup timed out');
                    }
                    if (logger.state !== 'unbound') {
                        callback(null, logger);
                        return;
                    }

                    setTimeout(function() {
                        checkChanged();
                    }, 500);
                }

                checkChanged();
            },

            'should have a state of bound': function(err, logger) {
                assert.equal(logger.state, 'bound');
                assert.isNull(logger.error);
            },

            "the log() method": helpers.testNpmLevels(transport, "should log messages to Zmq", function (ign, err, logged) {
                assert.isTrue(!err);
                assert.isTrue(logged);
            }),


            'should log ok': function(err, logger) {
                logger.log('info', 'test message', {metadata:true}, function() {

                })
            },

            'should be able to be closed': function(err, logger) {
                assert.equal(logger.state, 'bound');
                assert.isNull(logger.error);
                assert.equal(logger.socket._zmq.state, 0); //open
                logger.close();
                assert.equal(logger.socket._zmq.state, 2); //closed
                assert.isNull(logger.error);
            }
        }
    }

).addBatch({
        "A zmq logger" : {
            topic: function() {
                var logger = new (Zmq)(config.transports.zmq_test2);
                var callback = this.callback;
                var started = new Date();

                function checkChanged() {
                    if ((started - new Date()) > 10000) {
                        throw new Error('Setup timed out');
                    }
                    if (logger.state !== 'unbound') {
                        callback(null, logger);
                        return;
                    }

                    setTimeout(function() {
                        checkChanged();
                    }, 500);
                }

                checkChanged();
            },

            'should generate a prefix correctly': function(err, logger) {
                var msg = logger.constructMessage('info', 'test message', {metadata:true});
                msg.should.include.string("***|*|");
            },
            'should generate a prefix correctly for error': function(err, logger) {
                var msg = logger.constructMessage('error', 'test message', {metadata:true});
                msg.should.include.string("*|*|");
            },
            'should throw an error on an unknown log level': function(err, logger) {
                assert.throws(function() {
                        logger.constructMessage('asfasfasfasfa', 'test message', {metadata:true})
                    },
                    function(err) {
                        assert.isNotNull(err);
                        assert.equal(err.message, 'There is no mapping present for log level "asfasfasfasfa". You should pass a prefixMapping object in the options: e.g. {"asfasfasfasfa": 2}');
                        return true;
                    });
            },

            'should be able to be closed': function(err, logger) {
                assert.equal(logger.state, 'bound');
                assert.isNull(logger.error);
                assert.equal(logger.socket._zmq.state, 0); //open
                logger.close();
                assert.equal(logger.socket._zmq.state, 2); //closed
                assert.isNull(logger.error);
            }
        }
    }

)

    .exportTo(module);

/*


 .addBatch({
 "An instance of the Zmq Transport": {
 "when the timeout has fired": {
 topic: function () {
 setTimeout(this.callback, config.transports.mongodb.keepAlive);
 },
 "the log() method": helpers.testNpmLevels(transport, "should log messages to Zmq", function (ign, err, logged) {
 assert.isTrue(!err);
 assert.isTrue(logged);
 })
 }
 }
 })

 */