var settings = require("../settings");
var mapEntities = require("./MapEntity");
// Only one hardcoded map for now, should be able to load different layouts later
var Map = function (game, mapname) {
    // Defining a map as a size and a set of rectangles
    this.rects = [];
    this.size = [0,0];
    var killZones = [];

    this.backgroundImage = null;
    this.foregroundImage = null;

    // 0: Solid, 1: not solid, 2: kill
    var bounds = [0,0,0,0];

    // Random if empty
    var powerupSpawns = [];
    var playerSpawns = [];

    this.load = function (name) {
        var m = require("../maps/"+name+".json")

        if (!m.size || !m.rects) {
            return false;
        }

        this.size = m.size;
        this.rects = m.rects;
        this.backgroundImage = m.backgroundImage;
        this.foregroundImage = m.foregroundImage;
        bounds = m.bounds;
        if (m.powerups) powerupSpawns = m.powerups;
        if (m.spawns) playerSpawns = m.spawns;
        if (m.killZones) killZones = m.killZones;

        if (m.objects) {
            for (var i=0;i<m.objects.length;i++) {
                var o = m.objects[i];
                new mapEntities[o[2]](game, [o[0], o[1]])
            }
        }

        return true;
    }

    // Checks if a block of a size at a position collides with a rectangle or the edges of the map
    // returns collision for both axises seperately
    this.checkCollision = function (pos, size) {
        var collides = [false, false]

        // Edges
        if ( (pos[0]-size/2 < 0 && !bounds[3]) || (!bounds[1] && pos[0]+size/2 > this.size[0]) ) {
            collides[0] = true;
        }
        if ( (pos[1]+size/2 > this.size[1] && !bounds[0]) || (!bounds[2] && pos[1]-size/2 < 0) ) {
            collides[1] = true;
        }

        // Rects
        for (var i=0;i<this.rects.length; i++) {
            var rect = this.rects[i];
            /*if (pos[0]-size/2 < rect[0]+rect[2] && pos[0]+size/2 > rect[0] && pos[1]+size/2 > rect[1] && pos[1]-size/2 < rect[1]+rect[3]) {
                collides[0] = true;
            }*/
            if (pos[1]-size/2 < rect[1]+rect[3] && pos[1]+size/2 > rect[1] && pos[0]+size/2 > rect[0] && pos[0]-size/2 < rect[0]+rect[2]) {
                collides[1] = true;
            }         
        }

        return collides;
    }

    this.checkKillzones = function (player) {
        if (killZones.length == 0) return false;
        
        var pos = player.pos;
        var size = settings.player.hitBoxSize;

        for (var i=0;i<killZones.length; i++) {
            var kz = killZones[i];
            if (pos[1]-size/2 < kz[1]+kz[3] && pos[1]+size/2 > kz[1] && pos[0]+size/2 > kz[0] && pos[0]-size/2 < kz[0]+kz[2]) {
                player.hp -= 10;
                return true;
            }         
        }
    }

    // Returns one of the map's powerup spawns, or picks a random coordinate
    this.getPowerupSpawn = function () {
        if (powerupSpawns.length > 0) {
            // Pick a spawn point that is not taken
            var freeSpawns = powerupSpawns.slice(0);
            //console.log(game.actors);
            for (var n=0; n<game.actors.length; n++) {
                var a = game.actors[n];
                if (a.type != "powerup") continue;
                for (var i=0;i<freeSpawns.length;i++) {
                    if (freeSpawns[i][0] == a.pos[0] && freeSpawns[i][1] == a.pos[1]) {
                        freeSpawns.splice(i--, 1);
                        if (freeSpawns.length == 0) return false;
                    }
                }
                
            }
            return freeSpawns[Math.floor( Math.random() * freeSpawns.length )];

        } else {
            // Pick a random starting point that does not collide with anything
            do {
                var x = Math.round( Math.random() * (this.size[0]-200) )+100;
                var y = Math.round( Math.random() * (this.size[1]-200) )+100;
            } while (this.checkCollision([x,y], 20)[1]);
            
            // Then move down to the ground
            while (!game.map.checkCollision([x,y], 20)[1]) {
                y--;
                if (game.map.checkBounds([x,y], 20)) break; // Don't fall out of the screen tho
            }

            return [x,y,"random"];
        }
    }

    // Returns one of the map's player spawns, or picks a random coordinate
    this.getPlayerSpawn = function () {
        if (playerSpawns.length > 0) {
            return playerSpawns[Math.floor( Math.random() * playerSpawns.length )];
        } else {
            do {
                var x = Math.round( Math.random() * (this.size[0]-200) )+100;
                var y = Math.round( Math.random() * (this.size[1]-200) )+100;
            } while (this.checkCollision([x,y], settings.player.hitBoxSize)[1]);
            return [x,y];
        }
    }

    // Checks if object is outside of the map
    // If player, enforce out of bounds death
    this.checkBounds = function (pos, size, player) {
        var r = [0,0,0,0];
        if (pos[1]-size/2 > this.size[1]) {
            r[0] = 1;
        }
        if (pos[0]-size/2 > this.size[0]) {
            r[1] = 1;
        }
        if (pos[1]+size/2 < 0) {
            r[2] = 1;
        }
        if ( pos[0]+size/2 < 0 ) {
            r[3] = 1;
        }

        if (player) {
            if ( (r[0] && (bounds[0] == 2)) || (r[1] && (bounds[1] == 2)) || (r[2] && (bounds[2] == 2)) || (r[3] && (bounds[3] == 2)) ) player.hp -= 100;
        }

        return (r[0] || r[1] || r[2] || r[3]);
    }

    this.pack = function () {
        return {
            "backgroundImage": this.backgroundImage,
            "foregroundImage": this.foregroundImage,
            "rects": this.rects,
            "size": this.size
        }
    }

    if (!mapname) var mapname = settings.map.fallbackMap;
    this.load(mapname);
}

module.exports = Map