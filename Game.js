
// literally copypasted from the socket.io tutorial and other nodejs resources
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.use('/assets', express.static('assets'));
app.use('/static', express.static('static'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});

// Import stuff
var Map = require("./classes/Map")
var Powerup = require("./classes/Powerup")
var Player = require("./classes/Player")
var Connection = require("./classes/Connection")


// Main class to do things in
var Game = function () {
    // an actor in this case is everything that's dynamically on the screen, currently that's Projectiles, Effects and Players. And they all go in here.
    // An actor object has to provide:
    // 1. this.type, string, an identifier of what this is
    // 2. this.update, function, function to be executed every tick, return true if the object should be kept, return false if it should be removed
    // 3. this.active, boolean, if not true, update will not be called
    //
    // Like with weapons, I should have probably used inheritance, but this started with way less features than it ended up with     
    var actors = [];
    this.actors = actors;

    // Array of connections, working a lot like actors
    var connections = [];

    // How many powerups we have, and when we spawn our next powerup
    var powerupcounter = 0;
    this.powerups = 0;
    
    // Load the map
    this.map = new Map();

    // Sounds and messages for the clients to play/display on the next update
    this.sounds = [];
    this.messages = [];

    // Names are self explanatory
    this.addActor = function (obj) {
        actors.push(obj);
    }

    this.addConnection = function (c) {
        connections.push(c);
    }

    // Main loop of the game
    this.update = function () {
        // Measuring tick time to track performance issues
        var stopwatch = (new Date()).getTime()
        
        // Reset our sound and message queue
        this.sounds = [];
        this.messages = [];
        
        // Iterate over connections to do connection things
        for (var i=0; i<connections.length; i++) {
            var c = connections[i];
            var r = c.update();
            if (!r) { // remove connection if its update() returns false
                connections.splice(i--, 1);
                continue;
            }
        }

        // Iterate over actors to do actor things
        for (var i=0; i<actors.length; i++) {
            if (actors[i].remove) {// remove actor if something flagged it for remove
                actors.splice(i--, 1);
                continue;
            }
            if (!actors[i].active) continue; // don't process if inactive

            var r = actors[i].update();
            if (!r) { // remove actor if its update() returns false
                actors.splice(i--, 1);
                continue;
            }
        }

        // Add a new powerup every 100 ticks, up to maximum of 3
        powerupcounter %= 100;
        if (powerupcounter++ == 0) {
            if (this.powerups < 3) {
                this.powerups++;
                new Powerup(this);
            }

        }

        // Output the message queue to console as well
        for (var i=0; i<this.messages.length; i++) console.log("[Game]", this.messages[i]);
        
        // Wrap up all the important things in an object and send it to clients
        var gameState = {"map": this.map, "actors": actors, "sounds": this.sounds, "messages": this.messages, "users": connections}
        io.emit('update', gameState);

        // Measure the time we took to process this tick and warn if it's higher than my arbitrary chosen threshold
        var tickTime = (new Date()).getTime()-stopwatch
        if (tickTime > 10) console.log("[Warning] Long tick time:", tickTime, "ms");
    }

    // idk why this isn't part of the constructor
    this.init = function () {
        var game = this;

        // Add the listeners for new connections
        io.on('connection', function(socket){
            console.log('[Info] New player');
            new Connection(game, socket)
        });

        // Start the game loop
        setInterval(this.update.bind(this), 32);
    }
}

// Start the Game
var g = new Game()
g.init();