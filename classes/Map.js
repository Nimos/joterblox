// Only one hardcoded map for now, should be able to load different layouts later
var Map = function (game, mapname) {
    // Defining a map as a size and a set of rectangles
    this.rects = [];
    this.size = [0,0];

    this.backgroundImage = null;
    this.foregroundImage = null;

    this.load = function (name) {
        var m = require("../maps/"+name+".json")

        if (!m.size || !m.rects) {
            return false;
        }

        this.size = m.size;
        this.rects = m.rects;
        this.backgroundImage = m.backgroundImage;
        this.foregroundImage = m.foregroundImage;

        return true;
    }

    // Checks if a block of a size at a position collides with a rectangle or the edges of the map
    // returns collision for both axises seperately
    this.checkCollision = function (pos, size) {
        var collides = [false, false]

        // Edges
        if (pos[0]-size/2 < 0 || pos[0]+size/2 > this.size[0]) {
            collides[0] = true;
        }
        if (pos[1]+size/2 > this.size[1] || pos[1]-size/2 < 0) {
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
    if (!mapname) var mapname = "3lines";
    this.load(mapname);
}

module.exports = Map