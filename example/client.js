var util = require('util'),
    zmq = require('zmq');


var socket = zmq.socket('sub');
socket.subscribe('');

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


