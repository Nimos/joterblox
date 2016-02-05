var Player = require("./Player")
var adds = [];

var Connection = function (game, socket) {
    // Track Controls
    this.keys = {
        "up": false,
        "down": false,
        "left": false,
        "right": false,
        "space": false
    }
    this.cursor = [0,0];
    
    var keys = this.keys;
    var cursor = this.cursor;

    // Track Socket Status
    var connected = true;
    var pingWaiting = false;
    var pingticks = 0;
    this.ping = 0;

    // Player customization
    var name = null;
    var color = [0,0,0];
    this.name = name;

    // Game related things
    var player = null;
    var respawnFrames = 0;
    this.score = 0;


    // Things to do regularily
    this.update = function () {
        // Send a ping every ~2.5 seconds
        pingticks %= 100;
        if (pingticks++ == 0) {
            if (pingWaiting) {
                game.messages.push(name +" timed out.");
                socket.disconnect();
                if (player) {
                    player.active = false;
                    player.remove = true;
                }
                return 0;
            } else {
                pingWaiting = true;
                socket.emit("pung", (new Date()).getTime());
            }
        }

        // Update player's screen with hud info
        if (player && player.active) { // User is in the Game, show game screen
            socket.emit("hud", {"screen": 0, "hp": player.hp, "ping": this.ping, "weapon": player.weapon})
        } else if (player && !player.active) { // User is dead, show respawn screen
            socket.emit("hud", {"screen": 1, "hp": 0, "ping": this.ping, "respawn": respawnFrames++})
        } else { // User has not joined yet, show menu
            socket.emit("hud", {"screen": 2, "hp": 0, "ping": this.ping, "weapon": null})
        }

        // Remove from game's connection array
        if (!connected) return 0;

        return 1;
    }


    // Spawn/Respawn
    var spawnPlayer = function () {
        // Don't spawn 2 players
        if (player && player.active) return;
        
        // No empty names
        if (!name || name == "") {
            name = "Unnamed Block";
            self.name = "Unnamed Block";
        }

        // Spawn
        player = new Player(game, self, name, color)
        player.active = true;
        respawnFrames = 0;
    }


    // Add socket listeners, mostly self explanatory
    var self = this;
    socket.on('setName', function(n){
        n = n.substring(0,24);
        name = n;
        self.name = n;
        spawnPlayer();
    });

    socket.on('presskey', function (key) {
        keys[key] = true;

        // (for "press any key to respawn")
        if (player && !player.active && respawnFrames >= 40) {
            spawnPlayer();
        }
    });

    socket.on('releasekey', function (key) {
        keys[key] = false;
    });

    socket.on('disconnect', function (key) {
        connected = false;
        game.messages.push(name +" has left the game.");
        if (player) {
            player.active = false;
            player.remove = true;
        }
        for (var i=0;i<adds.length;i++) {
            if (socket.handshake.address == adds[i]) {
                adds.splice(i--, 1)
            }
        }
    });

    socket.on("pang", function (time) {
        var newping = (new Date()).getTime()-time;
        if (newping > 10000) {
            // Had a problem with pings being cray high, but it disappeared when I added this block to track them
            console.log("Weird ping:", time);
            return;
        }
        self.ping = newping
        pingWaiting = false;
    });


    socket.on('setColor', function (cs) {
        color = cs;
    });

    socket.on('mousemove', function (cords) {
        self.cursor = cords;
    });

    // Add this object to the connection array
    game.addConnection(this);
}

module.exports = Connection