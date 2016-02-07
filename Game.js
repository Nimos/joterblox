
// literally copypasted from the socket.io tutorial and other nodejs resources
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile('index.html', { root: __dirname });
});

app.get('/editor', function(req, res){
  res.sendFile('editor.html', { root: __dirname });
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

        // Iterate over connections to do connection things
        for (var i=0; i<connections.length; i++) {
            var c = connections[i];
            var r = c.update();
            if (!r) { // remove connection if its update() returns false
                connections.splice(i--, 1);
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

    // check for collisions on a path
    this.collisionRay = function (from, to, size, terrainOnly) {
        if (!size) size = 0;
        // get vector to where we're shooting at, normalize it
        var targetdist = Math.sqrt(Math.pow(from[0]-to[0], 2)+Math.pow(from[1]-to[1], 2));
        if (targetdist == 0) return false; //if we're not moving, we can't collide

        var direction = [(to[0]-from[0])/targetdist, (to[1]-from[1])/targetdist]
        
        // start from where we're shooting from
        var pos = [from[0], from[1]]

        // and walk a line until we first hit a wall, checking if anyone is in our path...
        col = this.map.checkCollision(pos, size)
        while (!col[0] && !col[1]) {
            pos[0] += direction[0];
            pos[1] += direction[1];

            var done;
            if (direction[0] != 0) {
                done = direction[0] > 0 ? pos[0] > to[0] : pos[0] < to[0];
            } else if (direction[1] != 0) {
                done = direction[1] > 0 ? pos[1] > to[1] : pos[1] < to[1];
            } else {
                return false;
            }

            if (done) {
                return false;
                break;
            }

            if (!terrainOnly) {
                for (var i=0; i<this.actors.length; i++) {
                    var a = this.actors[i];
                    if (a.type != "player") continue;
                    var dist = Math.sqrt(Math.pow(pos[0]-a.pos[0], 2)+Math.pow(pos[1]-a.pos[1], 2))
                    if (dist < 6) {
                        if (a.type == "player") {
                            return [a, null];
                        }
                    }
                }
            }
            col = this.map.checkCollision(pos, size)
        }
        if (col[0]) pos[0] -= direction[0];
        if (col[1]) pos[1] -= direction[1];
        return [null, col, pos];
    }
}

// Start the Game
var g = new Game()
g.init();