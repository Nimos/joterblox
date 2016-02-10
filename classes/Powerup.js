var settings = require("../settings");

// Powerup class
var Powerup = function (game) {
    // Possible powerup types
    types = settings.powerup.types;
    // Pick random powerup type
    this.content = types[Math.floor(Math.random()*types.length)]

    // Pick random spawn point
    this.pos = game.map.getPowerupSpawn();
    // but always move down to the first ground    
    while (!game.map.checkCollision(this.pos, 20)[1] && !game.map.checkCollision(this.pos, 20)[0]) {
        this.pos[1]--;
        if (game.map.checkBounds(this.pos, 20)) break;
    }

    this.active = true;
    this.type = "powerup"

    this.update = function () {
        // Check if we got picked up
        for (var i=0; i<game.actors.length; i++) {
            var a = game.actors[i];
            // Only check players of course
            if (a.type != "player") continue;

            // Check pickup based on distance for simplicity
            var dist = Math.sqrt(Math.pow(this.pos[0]-a.pos[0], 2)+Math.pow(this.pos[1]-a.pos[1], 2))
            if (dist < 5+20) {
                if (this.content != "medipack") {
                    // Give new weapon to player
                    a.weapon = new Weapon(game, this.content, a);
                } else if (this.content == "medipack") {
                    a.hp += 25;
                    a.hp = Math.min(100, a.hp);
                }

                // Pickup sound
                game.sounds.push("powerup");

                // One less powerup on the map
                game.powerups--;

                // Despawn
                return 0;
            }
        }
        return 1;
    }
    game.addActor(this);
}


module.exports = Powerup;