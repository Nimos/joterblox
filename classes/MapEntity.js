var settings = require("../settings");

// Various actors spawned by the map to interact with things
var Jumper = function (game, pos) {
    this.type = "jumper";
    this.active = true;
    this.pos = pos;
    
    this.update = function () {
        var hit;

        myHitBox = [this.pos[0]-settings.map.jumper.hitbox[0]/2, this.pos[1]-settings.map.jumper.hitbox[1], this.pos[0]+settings.map.jumper.hitbox[0]/2, this.pos[1]+settings.map.jumper.hitbox[1]]
        for (var i=0; i<game.actors.length; i++) {
            var a = game.actors[i];
            if (a.type != "player") continue;

            if (a.pos[1]-settings.player.hitBoxSize/2 < myHitBox[3] && a.pos[1]+settings.player.hitBoxSize/2 > myHitBox[1] && a.pos[0]+settings.player.hitBoxSize/2 > myHitBox[0] && a.pos[0]-settings.player.hitBoxSize/2 < myHitBox[2]) {
                a.speed[1] += settings.map.jumper.power;
            }
        }
        return 1;
    }

    this.pack = function () {
        return {
            "pos": this.pos,
            "type": this.type
        }
    }
    game.addActor(this); // Add to actors array
}

module.exports.jumper = Jumper