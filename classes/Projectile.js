// Actor class for everything that comes out of a gun
var Projectile = function (game, pos, target, myWeapon, myOwner) {
    this.weapon = myWeapon;
    this.type = "bullet";
    this.active = true;
    
    // Calculate a vector to where we were aimed, normalize it, multiply by speed to get our movement vector
    var targetdist = Math.sqrt(Math.pow(pos[0]-target[0], 2)+Math.pow(pos[1]-target[1], 2));
    var direction = [(target[0]-pos[0])/targetdist, (target[1]-pos[1])/targetdist]
    this.speed = [direction[0]*myWeapon.bulletSpeed, direction[1]*myWeapon.bulletSpeed]

    // Move one step into our directions so we don't collide with our player on the first tick
    this.pos = [pos[0]+direction[0]*myWeapon.bulletSize+5, pos[1]+direction[1]*myWeapon.bulletSize+5];
    
    // Track projectile lifetime
    var lifeFrames = 0;


    this.update = function () {
        if (lifeFrames++ > myWeapon.bulletLife) return 0;
        
        // Fall
        this.speed[1] -= myWeapon.bulletGravity;
        
        // Move
        var newpos = [this.pos[0]+this.speed[0], this.pos[1]+this.speed[1]];

        // Collide with terrain
        var col = game.map.checkCollision(newpos, myWeapon.bulletSize)
        if (col[0] || col[1]) {
            // If we collide with terrain, call our weapon's onImact
            myWeapon.onImpact(null, this);
            return 0;
        }
        // move
        this.pos = newpos;

        // Collide with players
        for (var i=0; i<game.actors.length; i++) {
            var a = game.actors[i];
            if (a.type != "player") continue;

            // Don't collide on first few frames, just to make extra sure we're not hitting our player
            if (this.lifeFrames < 3) continue;

            // Collide with players based on distance
            var dist = Math.sqrt(Math.pow(this.pos[0]-a.pos[0], 2)+Math.pow(this.pos[1]-a.pos[1], 2))
            if (dist < 5+myWeapon.bulletSize/2) {
                if (a.type == "player") {
                    // And call onImpact if we hit something
                    return myWeapon.onImpact(a, this);
                }
            }
        }
        return 1;
    }

    game.addActor(this); // Add to actors array
}

module.exports = Projectile