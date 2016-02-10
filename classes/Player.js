Weapon = require("./Weapon")
var settings = require("../settings");

// Class for the player actor in the game
var Player = function (game, connection, name, color) {
    // Attributes I might want to tweak
    var maxhp = settings.player.maxHP;
    var speedcap = settings.player.speedCap;
    var hacceleration = settings.player.hacceleration;
    var hdeceleration = settings.player.hdeceleration;
    var jumpspeed = settings.player.jumpSpeed;
    var gravity = settings.player.gravity;
    var size = settings.player.hitBoxSize;

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
    this.pos = game.map.getPlayerSpawn();
    this.type = "player";
    this.state = STANDING;

    var multiKillTimer = -1;
    var multiKillCount = 0;
    var killStreak = 0;

    var lasthitby =  null;
    this.lasthitby = {"name": "", "weapon": ""};

    var holdingClick = false;


    this.setLastHitBy = function (player, weapon) {
        this.lasthitby = {"name": player.name, "weapon": weapon};
        lasthitby = player
    }

    this.increaseScore = function(number) {
        if (!number) number = 1;
        connection.score += number;

        killStreak++;
        multiKillCount++;
        multiKillTimer = 30;

        var numberWords = settings.strings.multiKillNumbers;
        var message = settings.strings.multiKill;

        if (multiKillCount > 1) game.messages.push(message.replace("{name}", this.name).replace("{number}", numberWords[multiKillCount-1]));

        if (killStreak > 1) {
            var message = (killStreak <= settings.strings.killStreak.length) ? settings.strings.killStreak[killStreak+1] : settings.strings.killStreak[settings.strings.killStreak.length-1];
            if (message) {
                game.messages.push(message.replace("{name}", this.name));
            }
        }
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
            var success = this.weapon.shoot(this, this.pos, cursor)
            if (!success && !holdingClick) connection.sounds.push("cd");
            holdingClick = true;
        } else {
            holdingClick = false;
        }
        // process ammo reload
        this.weapon.updateAmmo(keys.space)

        // Fall
        this.speed[1] -= gravity;

        // Calculate new position based on what happened before..
        var newpos = [this.pos[0]+this.speed[0], this.pos[1]+this.speed[1]];

        hit = game.playerCollision(this.pos, newpos, size)
        if (hit[0]) {
            this.pos = hit[1];
        } else {
            this.pos = newpos;
        }
        
        // stop moving on the axis we're colliding on
        col = hit[2];
        if (col[0]) {
            this.speed[0] = 0;
        }

        if (col[1]) {
            this.state = 0;
            this.speed[1] = 0;
        } else {
            this.state = JUMPING;
        }

        game.map.checkBounds(this.pos, size, this);
        game.map.checkKillzones(this);

        // Process Multikills and Killstreaks
        if (multiKillTimer-- == 0) {
            multiKillCount = 0;
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

    this.pack = function () {
        var pack = {
            "color": this.color,
            "hp": this.hp,
            "name": this.name,
            "pos": this.pos,
            "type": this.type,
            "weaponColor": this.weapon.weaponColor
        }
        return pack;
    }

    // add this to actors list
    game.addActor(this);

}


module.exports = Player;