Weapon = require("./Weapon")

// Class for the player actor in the game
var Player = function (game, connection, name, color) {
    // Attributes I might want to tweak
    var maxhp = 100;
    var speedcap = 10;
    var hacceleration = 5;
    var hdeceleration = 5;
    var jumpspeed = 20;
    var gravity = 2;
    
    // Customizations
    this.name = name;
    this.color = color;
    
    // constanst for states
    STANDING = 0;
    WALKING = 1;
    JUMPING = 2;
    
    // Won't update if this is false
    this.active = false;

    // Will be removed on next update if this is true
    this.remove = false;
    
    // Game related stuff
    this.speed = [0, 0];
    this.hp = maxhp;
    this.weapon = new Weapon(game, "default", this);
    this.pos = [Math.random()*(game.map.size[0]-200)+100, Math.random()*(game.map.size[1]-100)+100];
    this.type = "player";
    this.state = STANDING;

    var lasthitby =  null;
    this.lasthitby = {"name": "", "weapon": ""};


    this.setLastHitBy = function (player, weapon) {
        this.lasthitby = {"name": player.name, "weapon": weapon};
        lasthitby = player
    }

    this.increaseScore = function(number) {
        if (!number) number = 1;
        connection.score += number;
    }

    this.decreaseScore = function(number) {
        if (!number) number = 1;
        connection.score -= number;
    }

    // Called every tick
    this.update = function () {
        // Get our current inputs
        var keys = connection.keys; 
        var cursor = connection.cursor;

        // See above
        if (this.remove) return 0;

        // Jump if we're not jumping already
        if (keys.up && this.state != JUMPING) {
            this.speed[1] += jumpspeed;
        } 

        // Move
        if (keys.left) {
            this.speed[0] = Math.max(-1*speedcap, this.speed[0]-hacceleration);
        } else if (keys.right) {
            this.speed[0] = Math.min(speedcap, this.speed[0]+hacceleration);
        } else { // Or slow down
            this.speed[0] = (this.speed[0] > 0) ? Math.max(0, this.speed[0] - hdeceleration) : Math.min(0, this.speed[0] + hdeceleration);
        }

        // Shoot
        if (keys.space) {
            this.weapon.shoot(this, this.pos, cursor)
        }
        // process ammo reload
        this.weapon.updateAmmo(keys.space)

        // Fall
        this.speed[1] -= gravity;

        // Calculate new position based on what happened before..
        var newpos = [this.pos[0]+this.speed[0], this.pos[1]+this.speed[1]];

        // ..and check collision for new position
        var col = game.map.checkCollision(newpos, 10)

        // stop moving on the axis we're colliding on
        if (col[0]) {
            this.speed[0] = 0;
        } else {
            this.pos[0] = newpos[0];
        }

        if (col[1]) {
            this.state = 0;
            this.speed[1] = 0;
        } else {
            this.pos[1] = newpos[1];
            this.state = JUMPING;
        }

        // die if we're dead
        if (this.hp <= 0) {
            // output kill message
            if (this.lasthitby.name == "") {
                game.messages.push(this.name +" committed suicide.");
            } else {
                game.messages.push(this.lasthitby.name +" killed "+ this.name + " (Weapon:  "+this.lasthitby.weapon+")");
            }

            // give points
            if (lasthitby) {
                lasthitby.increaseScore();
            } else {
                this.decreaseScore();
            }

            this.active = false; // probably unneeded

            // make death sound
            game.sounds.push("death");
            return 0;
        }
        return 1;
    }

    // add this to actors list
    game.addActor(this);

}


module.exports = Player;