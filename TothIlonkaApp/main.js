/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var express = require('express');
var app = express();
var omxp = require('omxplayer-controll');
var exec = require('child_process').exec;

var media = ['./videos/loopvideo.mp4', './videos/oncevideo.mp4'];
var mediaLength = [44144, 34344]


var mediaString = ['szünet', 'műsor'];

var mode = 0;

var status = -1;
var currently = -1;
var startTime;

var opts = {
    'audioOutput': 'hdmi', //  'hdmi' | 'local' | 'both'.
    'blackBackground': true, //false | true | default: true.
    'disableKeys': true, //false | true | default: false.
    'disableOnScreenDisplay': true, //false | true | default: false.
    'disableGhostbox': true, //false | true | default: false.
    'subtitlePath': '', //default: "".
    'startAt': 0, //default: 0.
    'startVolume': 1.0, //0.0 ... 1.0 default: 1.0 ,
    'alpha': 0

};

var poller = setInterval(function() {
    if (currently !== -1) {
        omxp.getPosition(function(err,pos) {
	    console.log(err, pos)
            status = pos;
        });
        console.log(status, mediaLength[currently]);
    }
}, 500);


var startNewVideo = function() {
    currently = mode;
    omxp.open(media[mode], opts);
    mode = 0;

    timeout0 = setTimeout(function() {
        fade(1, 1000, 50);
    }, 50);

//    timeout1 = setTimeout(function() {
//        fade(0, 1000, 50);
//    }, 6000 - 1000);

    startTime = new Date().getTime();

};

var fade = function(to, totalTime, steps) {
    var time = parseInt(totalTime / steps);
    var internalCallback = function(t) {
        return function() {
            if (t > 0) {
                t--;
                setTimeout(internalCallback, time);
                var al = (to === 0) ? (parseInt(t * 255 / steps)) : (255 - parseInt(t * 255 / steps));
                omxp.setAlpha(al, function(err) {
		    //console.log(err);
		});
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
	    fade(0, 1000, 50);
	    timeout1 = setTimeout(function() {
		mode = 1;
		exec('killall omxplayer.bin');
	    }, 1100);
	    
            
        }
    } else if (command === 'stop') {
        if (currently === 1) {
	    fade(0, 1000, 50);
	    timeout1 = setTimeout(function() {
		mode = 0;
		exec('killall omxplayer.bin');
	    }, 1100);
        }
        mode = 0;
    }
    var responseJson = {};
    var percent = Math.round(100 * (((new Date().getTime()) - startTime) / mediaLength[currently]));
    responseJson.statusMessage = 'Pillanatnyilag fut: ' + mediaString[currently] + ' (' + (percent) + '%)\n' +
            'Következő: ' + mediaString[mode];
    responseJson.mode = mode;
    responseJson.currently = currently;
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
console.log("Server running at http://127.0.0.1:8080/");

exec('sudo fbi -noverbose -vt 1 ./black.png')

startNewVideo();
    