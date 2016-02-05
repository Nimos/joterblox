// Actor for graphics effects, on this side only acts as a position marker, rest is done on client side 
var Effect = function (game, name, duration, pos1, pos2) {
    var lifeTicks = 0;
    this.active = 1;
    this.type = "effect"
    this.update = function () {
        return lifeTicks++ < duration;
    }
    this.name = name;

    this.pos1 = pos1;
    this.pos2 = pos2;

    game.addActor(this);
}

module.exports = Effect