var http = require('http');
var express = require('express');
var app = express();
var path = require('path');
var server = http.createServer(app);
var io = require('../..')(server);


const hostname = '127.0.0.1';
const port = process.env.PORT | 3000;

server.listen(port, hostname, function () {
    console.log("Server running at http://" + hostname + ":" + port + "/");
});

app.use(express.static(path.join(__dirname, 'public')));

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;

    socket.score = 0;

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.$emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.$broadcast.$emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.$broadcast.$emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });

    /* Math Game Start */

    var newProblem = function () {
        socket.firstInt = getRandomInt(10000);
        socket.secondInt = getRandomInt(10000);
        socket.$emit('new problem', {
            firstInt: firstInt,
            secondInt: secondInt,
            problem: firstInt + " + " + secondInt
        })};

    //when client emits 'new problem', generate new problem and sends to the user
    socket.on('new problem', newProblem);

    // when the user emits 'answer', this listens and executes by emitting back
    // the evaluation to the user.
    // If the answer is correct, sends the user a new problem and broadcasts the user's
    // score to everyone
    socket.on('answer', function (data) {
        var correct = false;
        if (data === socket.firstInt + socket.secondInt) {
            correct = true;
            socket.score++;
        }
        socket.$emit('evaluation', {
            isCorrect: correct
        });
        if (correct) {
            newProblem();
            socket.$broadcast.$emit('user score', {
                message: socket.username + "'s score went up to " + socket.score
            });
        }

    });

    /* Math Game End */

});