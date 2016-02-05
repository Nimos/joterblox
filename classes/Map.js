// Only one hardcoded map for now, should be able to load different layouts later
var Map = function (game) {
    // Defining a map as a size and a set of rectangles
    this.size = [640,440];
    this.rects = []

    this.rects.push([30, 30, 200, 10]);
    this.rects.push([340, 100, 200, 10]);
    this.rects.push([100, 200, 200, 10]);


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
            if (pos[0]-size/2 > rect[0]+rect[2] && pos[0]+size/2 < rect[0]) {
                collides[0] = true;
            }
            if (pos[1]-size/2 < rect[1]+rect[3] && pos[1]+size/2 > rect[1] && pos[0]+size/2 > rect[0] && pos[0]-size/2 < rect[0]+rect[2]) {
                collides[1] = true;
            }         
        }

        return collides;
    }
}

module.exports = Map