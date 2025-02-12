/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var express = require('express');
var app = express();
var omxp = require('omxplayer-controll');
var exec = require('child_process').exec;

var media = ['./videos/T.I.FinalLoop.mp4', './videos/T.I.Final.mp4'];
/// T.I.FinalLoop.mp4 = 45070; T.I.Final.mp4 = 1260202
var mediaLength = [-1, -1];

var mediaString = ['szünet', 'műsor'];

var mode = 0;

var status = -1;
var currently = -1;
var stopping = 0;
var startTime;

var opts = {
    'audioOutput': 'local', //  'hdmi' | 'local' | 'both'.
    'blackBackground': true, //false | true | default: true.
    'disableKeys': true, //false | true | default: false.
    'disableOnScreenDisplay': true, //false | true | default: false.
    'disableGhostbox': true, //false | true | default: false.
    'subtitlePath': '', //default: "".
    'startAt': 0, //default: 0.
    'startVolume': 1.0, //0.0 ... 1.0 default: 1.0 ,
    'alpha': 255,
    'loop': true
};

var poller = setInterval(function() {
    if (currently !== -1) {
        omxp.getDuration(function(err,dur) {
            if ( err ) {
                // console.log(err, mediaLength[currently], dur)
            }
            else if (mediaLength[currently] === -1 ) {            
                mediaLength[currently] = dur/1000;
                // console.log("MediaLength: ", mediaLength[currently], "s")
            }
        }); 
        omxp.getPosition(function(err,pos) {
            if ( err ) {
                // console.log(err, mediaLength[currently], pos)
                
                return;
            }
            status = pos;
        });
    }
}, 500);


var startNewVideo = function() {
    currently = mode;
    omxp.open(media[mode], opts);
    mode = 0;

    timeout0 = setTimeout(function() {
        fade(1, 1000, 50);
    }, 50);

    startTime = new Date().getTime();
};

var fade = function(to, totalTime, steps, callback) {
    var time = parseInt(totalTime / steps);
    var internalCallback = function(t) {
        return function() {
            if (t > 0) {
                t--;
                setTimeout(internalCallback, time);
                var al = (to === 0) ? (parseInt(t * 255 / steps)) : (255 - parseInt(t * 255 / steps));
		if (to === 0) {
		    omxp.setVolume(al*al/(256*256));
		}
                omxp.setAlpha(al, function(err) {
		    //console.log(err);
		});
            } else {
		if (callback !== undefined) {
		    callback();
		}
	    }
        };
    }(steps);
    setTimeout(internalCallback, time);
};


omxp.on('finish', startNewVideo);

app.use(express.static('public'));

app.get('/control', function(request, response) {
    var command = request.query.command;
    if (command === 'start') {
        if (currently === 0) {
	    fade(0, 2000, 50, function() {
		exec('killall omxplayer.bin');
		mode = 1;
		stopping = 0;
            });
	mode = 1;
	stopping = 1;
        }
    } else if (command === 'stop') {
        if (currently === 1) {
	    fade(0, 2000, 50, function() {
		exec('killall omxplayer.bin');
		mode = 0;
		stopping = 0;
	    });
        }
        mode = 0;
	stopping = 1;
    }
    var responseJson = {};
    var percent = Math.max(0, Math.round((mediaLength[currently] -  ((new Date().getTime()) - startTime)) / 1000));
    var currentString = (stopping === 1) ? mediaString[currently] + ' (stop)' : mediaString[currently] + ' (' + (Math.floor(percent/60)) +':' + ('00' + (percent%60)).slice(-2) + ')';
    responseJson.statusMessage = 'Pillanatnyilag fut: ' + currentString + '\n' +
            'Következő: ' + mediaString[mode];
    responseJson.mode = mode;
    responseJson.currently = Math.abs(currently - stopping);
    response.writeHead(200, {"Content-Type": "application/json"});
    response.write(JSON.stringify(responseJson));
    response.end();
});


app.get('*', function(req, res) {
    res.redirect('index.html');
});

// Listen on port 8000, IP defaults to 127.0.0.1
app.listen(8080);

// Put a friendly message on the terminal
// console.log("Server running at http://127.0.0.1:8080/");

///exec('sudo fbi -noverbose -vt 1 ./black.png')

startNewVideo();
    
