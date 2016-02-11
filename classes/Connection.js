var Player = require("./Player")
var adds = [];
var settings = require("../settings");

var curID=0;

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
    this.joined = false;

    // Personal message / sound queues
    this.messages = [];
    this.sounds = [];

    // unique ID
    this.uid = curID++;


    // Things to do regularily
    this.update = function () {
        // Send a ping every ~2.5 seconds
        pingticks %= settings.playerConnection.pingInterval;
        if (pingticks++ == 0) {
            if (pingWaiting) {
                game.messages.push(settings.strings.playerTimeout.replace("{name}", this.name));
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
        // Remove from game's connection array
        if (!connected) return 0;

        return 1;
    }

    this.sendUpdate = function (packet) {
       // Update player's screen with new info
        var hud = {
            "ping": this.ping, 
            "messages": this.messages,
            "sounds": this.sounds,
            "self": this.uid
        }
        if (player && player.active) { // User is in the Game, show game screen
            hud["screen"] = 0;
            hud["hp"] = player.hp;
            hud["weapon"] = {
                "ammo": player.weapon.ammo, 
                "ammoRecharge": player.weapon.ammoRecharge, 
                "fireRate": player.weapon.fireRate, 
                "cooldown": player.weapon.cooldown, 
                "maxAmmo": player.weapon.maxAmmo, 
                "ammoTicks": player.weapon.ammoTicks
            };
            hud["playerX"] = player.pos[0];
            hud["playerY"] = player.pos[1];
            hud["playerColor"] = player.color;
        } else if (player && !player.active) { // User is dead, show respawn screen
            hud["screen"] = 1;
            hud["hp"] = 0;
            hud["respawn"] = respawnFrames++;
        } else { // User has not joined yet, show menu
            hud["screen"] = 2;
        }

        packet["hud"] = hud;
        packet["messages"] = game.messages.concat(this.messages);
        packet["sounds"] = game.sounds.concat(this.sounds);
        socket.emit("update", packet);

        // Clear the queues
        this.messages = [];
        this.sounds = [];
    }

    // Called when a round is restarted
    this.reset = function () {
        if (!this.joined) return;
        player = null;
        this.score = 0;
        respawnFrames = 0;
        spawnPlayer();
    }


    // Spawn/Respawn
    var spawnPlayer = function () {
        // Don't spawn 2 players
        if (player && player.active) return;
        
        // No empty names
        if (!name || name == "") {
            name = settings.playerConnection.defaultName;
            self.name = name;
        }

        // Spawn
        player = new Player(game, self, name, color)
        player.active = true;
        respawnFrames = 0;
        

        if (!self.joined) {
            game.messages.push(settings.strings.playerJoin.replace("{name}", name));
            game.sounds.push("join");
        }
        self.joined = true;
    }

    this.pack = function () {
        return {
            "joined": this.joined,
            "name": this.name,
            "ping": this.ping,
            "score": this.score,
            "color": color,
            "uID": this.uid
        }
    }


    // Add socket listeners, mostly self explanatory
    var self = this;
    socket.on('setName', function(n){
        n = n.substring(0,settings.playerConnection.maxNameLength);
        name = n;
        self.name = n;
        spawnPlayer();
    });

    socket.on('presskey', function (key) {
        keys[key] = true;

        // (for "press any key to respawn")
        if (player && !player.active && respawnFrames >= settings.playerConnection.respawnDelay) {
            spawnPlayer();
        }
    });

    socket.on('releasekey', function (key) {
        keys[key] = false;
    });

    socket.on('disconnect', function (key) {
        connected = false;
        if (self.joined) {
            game.messages.push(settings.strings.playerQuit.replace("{name}", self.name));
            game.sounds.push("leave");
        }
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

    socket.on('chat', function (message) {
        if (message.substr(0,1) == "/") {
            // commands
        } else if (message.trim() != "") {
            game.messages.push("<"+self.name+"> "+message.substr(0,140))
            game.sounds.push("leave")
        }
    });

    socket.emit("loadMap", game.map.pack())

    // Add this object to the connection array
    game.addConnection(this);
}

module.exports = Connection