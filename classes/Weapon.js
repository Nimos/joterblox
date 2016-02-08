Projectile = require("./Projectile")
Effect = require("./Effect")

// Class to define the behaviour of different weapons in the game
// Probably should have made a class for each weapon instead of identifying them by name, but whatever
var Weapon = function (game, name, owner) {
    // Track at which step we are in the ammo recharge
    this.ammoTicks = 0;

    // Weapon stats (as reference)
    this.maxAmmo; // Maximum ammo in storage
    this.ammoRecharge; // How many ticks to restore one shot
    this.fireRate; // How many ticks between shots
    this.bulletSize; // Size of the bullets
    this.bulletSpeed; // Speed of the bullets
    this.bulletGravity; // How fast the bullet fall
    this.bulletLife; // How many ticks the bullets last
    this.bulletColor; // Color of bullets in game
    this.weaponColor; // Border color of blocks holding this weapon

    this.onImpact; // Function (target, projectile) - What to do when a bullet hits something
    this.onShot; // Function (position, target) - What to do when this weapon is fired

    if (name == "flamethrower") {
        this.maxAmmo = 50;
        this.ammoRecharge = 1;
        this.bulletSize = 20;
        this.bulletSpeed = 25;
        this.bulletGravity = 0;
        this.bulletLife = 5;
        this.fireRate = 1;

        this.bulletColor = "rgb(255,127,0)"
        this.weaponColor = "rgb(255,127,0)"

        this.onImpact = function (target, projectile) {
            if (target) {
                target.hp -= 5;
                if (target !== owner) target.setLastHitBy( owner, "Flamethrower");
            }
            return 1;
        };

        this.onShot = function () {
            game.sounds.push("flame");
        }

    } else if (name == "grenades") {
        this.maxAmmo = 1;
        this.ammo = 1;
        this.ammoRecharge = 30;
        this.fireRate = 1;

        this.bulletSize = 6;
        this.bulletColor = "rgb(0,100,0)"
        this.weaponColor = "rgb(100,200,100)"

        this.bulletSpeed = 15;
        this.bulletGravity = 2;
        this.bulletLife = 1000;

        this.onImpact = function (target, projectile) {
            if (target) target.hp -= 10; // some extra damage for direct hits

            // add Explosion effect
            new Effect(game, "explosion", 4, projectile.pos, [0,0])
            game.sounds.push("explosion");
            
            // Check who is in range of explosion and apply damage
            for (var i=0; i<game.actors.length; i++) {
                var a = game.actors[i];
                if (a.type != "player") continue;
                var vec = [a.pos[0]-projectile.pos[0], a.pos[1]-projectile.pos[1]]
                var dist = Math.sqrt(Math.pow(projectile.pos[0]-a.pos[0], 2)+Math.pow(projectile.pos[1]-a.pos[1], 2))
                if (dist < 5+60) {
                    if (a.type == "player") {
                        a.hp -= 50;
                        a.speed[0] += vec[0]/(dist/40);
                        a.speed[1] += vec[1]/(dist/20); 
                        if (owner !== a) a.setLastHitBy (owner, "Grenade");
                    }
                }
            }
            return 0;
        };

    } else if (name == "laser") {
        this.maxAmmo = 1;
        this.ammo = 1;
        this.ammoRecharge = 100;
        this.fireRate = 1;

        this.bulletSize = 2;
        this.bulletColor = "rgb(0,100,0)"
        this.weaponColor = "rgb(100,100,255)"

        this.onShot = function (player, p, target) {
            // Make pew sound
            game.sounds.push("laser")

            // get vector to where we're shooting at, normalize it
            var targetdist = Math.sqrt(Math.pow(p[0]-target[0], 2)+Math.pow(p[1]-target[1], 2));
            var direction = [(target[0]-p[0])/targetdist, (target[1]-p[1])/targetdist]
            
            // start from where we're shooting from
            var pos = [p[0], p[1]]

            // and walk a line until we first hit a wall, checking if anyone is in our path...
            col = game.map.checkCollision(pos, 2)
            while (!col[0] && !col[1]) {
                pos[0] += direction[0];
                pos[1] += direction[1];
                for (var i=0; i<game.actors.length; i++) {
                    var a = game.actors[i];
                    if (a.type != "player") continue;
                    var dist = Math.sqrt(Math.pow(pos[0]-a.pos[0], 2)+Math.pow(pos[1]-a.pos[1], 2))
                    if (dist < 6) {
                        if (a.type == "player" && a !== owner) {
                            //...and damage them if they are
                            a.hp-=20;
                            a.setLastHitBy(owner, "Laser");
                        }
                    }
                }
                col = game.map.checkCollision(pos, 2)
            }

            // draw the effect from where we shot from to where the laser stopped
            new Effect(game, "laser", 10, [p[0],p[1]], pos)
           
        };

        this.onImpact = function (player ,pos, target) {
            return 0; // we don't actually have a projectile
        };

        this.bulletSpeed = 2;
        this.bulletGravity = 2;
        this.bulletLife = 0;
    } else if (name == "shotgun") {
        this.maxAmmo = 5;
        this.ammo = 5;
        this.ammoRecharge = 20;
        this.fireRate = 15;

        this.bulletSize = 5;
        this.bulletColor = "rgb(20,40,20)"
        this.weaponColor = "rgb(120,127,120)"

        this.bulletSpeed = 20;
        this.bulletGravity = 0.5;
        this.bulletLife = 8;

        this.onImpact = function (target, projectile) {
            if (target) {
                target.hp -= 50;
                if (owner !== target) target.setLastHitBy (owner, "Shotgun");
            }
            return 0;
        };

        this.onShot = function (player, pos, target) {
            game.sounds.push("shotgun");

            var target = [target[0], target[1]]
            // Get vector and rotate it
            var v = [target[0]-pos[0], target[1]-pos[1]]
            var ca = Math.cos(0.18); // about 10° in rad
            var sa = Math.sin(0.18);
            var v1 = [ca*v[0] - sa*v[1], sa*v[0] + ca*v[1]];
            ca = Math.cos(-0.18); // about -10° in rad
            sa = Math.sin(-0.18);
            var v2 = [ca*v[0] - sa*v[1], sa*v[0] + ca*v[1]];
            
            target = [pos[0]+v1[0], pos[1]+v1[1]];
            new Projectile(game, pos, target, this, player);
            target = [pos[0]+v2[0], pos[1]+v2[1]];
            new Projectile(game, pos, target, this, player);
        }
    } else if (name == "hook") {
        this.maxAmmo = 1;
        this.ammo = 1;
        this.ammoRecharge = 1;
        this.fireRate = 0;

        this.bulletSize = 4;
        this.bulletColor = "rgb(20,40,20)"
        this.weaponColor = "rgb(120,127,120)"

        this.bulletSpeed = 20;
        this.bulletGravity = 0;
        this.bulletLife = 100;

        this.onImpact = function (target, projectile) {
            if (target) return 1;
            owner.hookPos = [projectile.pos[0], projectile.pos[1]];
            owner.hookState = 2;
            return 0;
        };

        this.onShot = function (player, pos, target) {
            this.ammo = 10;
            new Projectile(game, pos, target, this, player);
        }
    
    } else {// Default gun
        this.bulletSpeed = 20;
        this.bulletGravity = 1;
        this.maxAmmo = 5;
        this.ammo = 5;
        this.ammoRecharge = 7;
        this.fireRate = 3;

        this.bulletSize = 4;
        this.bulletColor = "rgb(255,0,0)"
        this.weaponColor = "#000"

        this.onShot = function (player, p, target) {
            game.sounds.push("normalshot");
        }

        this.onImpact = function (target, projectile) {
            if (target) {
                target.hp -= 20;
                if (target !== owner) target.setLastHitBy(owner,"Gun");
            }
        }

    }

    // Start with full magazine after picking up the powerup
    this.ammo = this.maxAmmo;
    this.cooldown = 0;

    // Called by player object to shoot
    this.shoot = function (player, pos, target) {
        console.log(this.ammo, this.cooldown);
        if (this.ammo > 0 && this.cooldown <= 0) {
            if (this.onShot) {
                this.onShot(player, pos, target);
            }

            new Projectile(game, pos, target, this, player);
            this.ammo--;
            this.cooldown = this.fireRate;
        }
    }

    // Called every tick to recharge ammo
    this.updateAmmo = function (shooting) {
        this.cooldown--;
        // For more than one-shot weapons, don't recharge when shoot button is held
        if (this.maxAmmo != 1 && shooting) return;
        if (this.ammo < this.maxAmmo) {
            this.ammoTicks++;
            this.ammoTicks %= this.ammoRecharge;
            if (this.ammoTicks == 0) {
                this.ammo = Math.min(this.ammo+1, this.maxAmmo);
            }
        }
    }


}


module.exports = Weapon
