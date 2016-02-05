// Powerup class
var Powerup = function (game) {
    // Possible powerup types
    types = ["laser", "grenades", "flamethrower"];

    // Pick random powerup type
    this.content = types[Math.floor(Math.random()*types.length)]

    // Pick random spawn point
    this.pos = [Math.random()*(game.map.size[0]-200)+100, Math.random()*(game.map.size[1]-200)+100];
    // but always move down to the first ground    
    while (!game.map.checkCollision(this.pos, 20)[1] && !game.map.checkCollision(this.pos, 20)[0]) {
        this.pos[1]--;
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
                // Give new weapon to player
                a.weapon = new Weapon(game, this.content, a);

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