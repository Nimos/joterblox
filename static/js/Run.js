// Settings for the bottom bar
var bottomHudHeight = settings.client.bottomHudHeight;
var hudBarWidth = settings.client.hudBarWidth;
var hudBarHeight = settings.client.hudBarHeight;
var hudAmmoColor1 = settings.client.hudAmmoColor1;
var hudAmmoColor2 = settings.client.hudAmmoColor2;
var hudReloadColor1 = settings.client.hudReloadColor1;
var hudReloadColor2 = settings.client.hudReloadColor2;
var hudInactiveColor = settings.client.hudInactiveColor;
var hudHpColor1 = settings.client.hudHpColor1;
var hudHpColor2 = settings.client.hudHpColor2;
var hudBarTextColor = settings.client.hudBarTextColor;
var hudBarFont = settings.client.hudBarFont;


// Get rendering context
var ctx = c.getContext("2d")

// this will hold the current game state
var state, map, hud;

// cursor coordinates
var cursor = [0, 0];

// Messages that are displayed
var messagelog = [];
var multiKillMessageTimeout = null;
var killStreakMessageTimeout = null;

var lastMultiKill = null;
var lastKillStreak = null;

// Messages and sounds that are about to be displayed
var messageQueue = [];
var soundQueue = [];

// Are we holding tab right now?
var showScores = false;

// Are we holding alt right now?
var showLocationFinder = false;

// Information about the UI
var hud = {"hp": 0, "ping": 0, "showscreen": 2}

// Currently selected input field
var selectedInput = null;

// All inputs on this screen
var allInputs = [];

// Global pointers to inputs
var chatInput = null;
var nameinput;

// Keep track of stuff.
var connecting = false;
var sock;

var profile;

// Load resources
/*var sounds = {
    "powerup": new Audio("/assets/sounds/powerup.wav"),
    "laser": new Audio("/assets/sounds/laser.wav"),
    "explosion": new Audio("/assets/sounds/explosion.wav"),
    "normalshot": new Audio("/assets/sounds/normalshot.wav"),
    "flame": new Audio("/assets/sounds/flame.wav"),
    "death": new Audio("/assets/sounds/death.wav"),
    "shotgun": new Audio("/assets/sounds/shotgun.wav"),
    "join": new Audio("/assets/sounds/join.wav"),
    "leave": new Audio("/assets/sounds/leave.wav"),
    "cd": new Audio("/assets/sounds/cd.wav")
};*/

// Sprites we want to preload
var gfxpreload = [
    "/assets/images/title.jpg", 
    "/assets/images/cover.jpg", 
    "/assets/images/entername.png", 
    "/assets/images/akirabg.png", 
    "/assets/images/akirafg.png",
    ["/assets/images/jumper.png", 18, 20, 5, 1]
];

var sfxpreload = [
    ["powerup", "/assets/sounds/powerup.wav"],
    ["laser", "/assets/sounds/laser.wav"],
    ["explosion", "/assets/sounds/explosion.wav"],
    ["normalshot", "/assets/sounds/normalshot.wav"],
    ["flame", "/assets/sounds/flame.wav"],
    ["death", "/assets/sounds/death.wav"],
    ["shotgun", "/assets/sounds/shotgun.wav"],
    ["join", "/assets/sounds/join.wav"],
    ["leave", "/assets/sounds/leave.wav"],
    ["cd", "/assets/sounds/cd.wav"]
]

var SFXStorage = function (preload) {
    var sounds = {};
    this.soundCount = 0;
    this.finished = -1;
    this.currentlyLoading = "";

    this.get = function(name, path) {
        if (sounds[name]) {
            return sounds[name];
        } else if (path) {
            sounds[name] = new Audio(path);
            return sounds[name];
        } else {
            return null;
        }
    }
    
    this.loaded = function () {
        return this.finished >= this.soundCount;
    }

    this.play = function(path) {
        this.get(path).play()
    }

    var loadNext = function() {
        this.finished++;
        console.log(this.queue);
        if (this.queue.length == 0) return;
        var path = this.queue.pop();
        console.log("Loading sounds... ",path, Math.round(this.finished*100/this.soundCount), "%")
        sounds[path[0]] = new Audio(path[1]);
        sounds[path[0]].onloadeddata = loadNext.bind(this);
        this.currentlyLoading = path[1];
    }

    if (preload) {
        this.soundCount = preload.length;
        this.queue = preload;
        loadNext.bind(this)();
    }
}

sounds = new SFXStorage(sfxpreload);

//Class to manage sprites
var SpriteStorage = function (preload) {
    var sprites = {};

    this.spriteCount = 0;
    this.finished = -1;
    this.currentlyLoading = "";

    this.loaded = function () {
        return this.finished >= this.spriteCount;
    }

    // Get a Sprite from cache or create it
    this.get = function (path, width,height, frames, speed) {
        if (sprites[path]) {
            return sprites[path];
        } else {
            sprites[path] = new Sprite(path,height, width, frames, speed);
            return sprites[path];
        }
    }

    // Shortcut to draw a sprite
    this.draw = function(ctx, path, x, y, x2, y2) {
        return this.get(path).draw(ctx, x, y, x2, y2);
    }


    // Load the preload queue
    var loadNext = function() {
        this.finished++;
        if (this.queue.length == 0) return;
        var path = this.queue.shift();
        if (typeof path != "object") {
            sprites[path] = new Sprite(path);
            this.currentlyLoading = path;
            sprites[path].load = loadNext.bind(this);
        } else {
            sprites[path[0]] = new Sprite(path[0], path[1], path[2], path[3], path[4])
            this.currentlyLoading = path[0];
            sprites[path[0]].load = loadNext.bind(this);
        }

    }

    if (preload) {
        this.spriteCount = preload.length;
        this.queue = preload;
        loadNext.bind(this)();
    }

}



// Class for Sprites
var Sprite = function (path, width, height, frames, speed) {

    var animated = false;
    var startFrame;

    if (frames) {
        animated = true;
        var startFrame = animFrames;
    }


    this.load = function () {console.log("HIHIHIHI")};
    this.onload = function () {
        console.log(image);
        this.load();
    }

    var image = new Image();
    image.onload  = this.onload.bind(this);
    image.src = path;

    this.draw = function (ctx, x, y, x2, y2) {
        if (!animated) {
            if (!x2) x2=image.width;
            if (!y2) y2=image.height;
            ctx.drawImage(image, x, y, x2, y2);
        } else {
            var curFrame = Math.ceil((animFrames-startFrame) / speed) % frames;
            if (!x2) x2=width;
            if (!y2) y2=image.height;
            var offset = curFrame*width;
            ctx.drawImage(image, offset, 0, width, image.height, x, y, x2, y2);
        }
    }

    this.getWidth = function () {
        if (animated) return width;
        return image.width
    }

    this.getHeight = function () {
        if (animated) return image.height;
        return image.height
    }

}

var sprites = new SpriteStorage(gfxpreload);

// Shifting color used for powerups;
var rainbowAnimation = function () {
    this.red = 255;
    this.green = 0;
    this.blue = 0;

    this.state = 0;

    this.step = function () {
        if (this.state == 0) {
            if (this.green++ >= 255)  this.state++;
        } else if (this.state == 1) {
            if (this.red-- <= 0)  this.state++;
        } else if (this.state == 2) {
            if (this.blue++ >= 255) this.state++;
        } else if (this.state == 3) {
            if (this.green-- <= 0) this.state++;
        } else if (this.state == 4) {
            if (this.red++ >= 255) this.state++;
        } else if (this.state == 5) {
            if (this.blue-- <= 0) this.state = 0;
        }
    }

    this.getColor = function () {
        this.step();
        return "rgb(" + this.red + "," + this.green + "," + this.blue + ")"
    }
}

var rainbow = new rainbowAnimation()

// Canvas only input element
var CanvasInput = function (ctx, name, x, y, width) {
    this.ctx = ctx;                 // the context to draw on
    this.name = name;               // Name for checking on submit
    this.x = x;                     // x-pos of the input text
    this.y = y;                     // y-pos of the input text
    this.width = width || 200;      // width of the input element in px

    this.text = "";                 // value
    this.maxLength = 30;            // maximum length of the input

    this.fontSize = 30;             // font size in px
    this.fontFace = "sans-serif";   // font face
    this.color = "black";           // color of the text
    this.align = "center";          // alignment ("left" or "center")

    this.padding = 10;              // padding in px
    this.backgroundColor = null;    // color of the background (null = no background)
    this.borderColor = null;        // color of the border (null = no border)
    this.borderWidth = 1;           // Border thickness in px

    this.active = true;             // Stop interacting with this input if this value is true

    // Check if user clicked on an input field
    c.onclick = function(e) {
        // Iterate through all inputs and check if cursor was inside for each one
        // Cursor x has to be between minX and maxX of box
        // AND    y has to be between minY and maxY of box
        for (var i=0; i<allInputs.length; i++) {
            if (!allInputs[i].active) return; // don't interact with inactive inputs

            var minX;

            if (allInputs[i].align == "center") {
                minX = allInputs[i].x - allInputs[i].width / 2 - allInputs[i].padding;
            } else if (allInputs[i].align == "left") {
                minX = allInputs[i].x - allInputs[i].padding;
            }

            var maxX = minX + 2 * allInputs[i].padding + allInputs[i].width;
            var minY = allInputs[i].y - allInputs[i].fontSize * 0.8 - allInputs[i].padding;
            var maxY = minY + 2 * allInputs[i].padding + allInputs[i].fontSize;

            // If cursor is inside the coords, the user has clicked the input field.
            if (minX < cursor[0] && cursor[0] < maxX && minY < cursor[1] && cursor[1] < maxY) {
                selectedInput = allInputs[i];
            }
        }
    };

    // Draw this input to the canvas
    this.draw = function() {
        if (!this.active) return; // don't draw inactive inputs

        // corrected x coordinate needed for center align
        var myX;

        if (this.align == "center") {
            // Move text to the right to center it
            // Text will always be centered without considering the trailing "_" or " "
            // If there is no text the lone underscore will be centered.
            if (this.text && this.text.length == this.maxLength) {
                myX = this.x;
            } else if (this.text && this.text.length > 0) {
                // That's 50% of the character width for monospace fonts
                myX = this.x + 0.275 * this.fontSize;
            } else {
                myX = this.x;
            }
        } else if (this.align == "left") {
            myX = this.x;
        }

        // Draw the background
        if (this.backgroundColor) {
            ctx.fillStyle = this.backgroundColor;
            if (this.align == "center") {
                ctx.fillRect(this.x - this.width / 2 - this.padding, this.y - this.fontSize * 0.8 - this.padding, 2 * this.padding + this.width, 2 * this.padding + this.fontSize);
            } else if (this.align == "left") {
                ctx.fillRect(this.x-this.padding, this.y - this.fontSize * 0.8 - this.padding, 2 * this.padding + this.width, 2 * this.padding + this.fontSize);
            }
        }

        // Draw the border
        if(this.borderColor) {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor;
            if (this.align == "center") {
                ctx.strokeRect(c.width / 2 - this.width / 2 - this.padding, this.y - this.fontSize * 0.8 - this.padding, 2 * this.padding + this.width, 2 * this.padding + this.fontSize);
            } else if (this.align == "left") {
                ctx.strokeRect(this.x-this.padding, this.y - this.fontSize * 0.8 - this.padding, 2 * this.padding + this.width, 2 * this.padding + this.fontSize);
            }
        }

        // Set text properties
        this.ctx.textAlign = this.align;
        this.ctx.font = this.fontSize + "px " + this.fontFace;
        this.ctx.fillStyle = this.color;

        // Correct different baselines of fonts
        var baselineCorrection = 0;
        if (this.fontFace == "PressStart2P") {
            baselineCorrection = this.fontSize*0.25;
        }

        // Draw the text
        // Display blinking underscore if input is possible and this is selected, none if maxLength is reached
        if (this.text.length == this.maxLength) {
            ctx.fillText(this.text, myX, this.y+baselineCorrection, this.width);
        } else {
            if (animFrames % 50 > 25 && selectedInput == this) {
                // Now you see me
                ctx.fillText(this.text + "_", myX, this.y+baselineCorrection, this.width);
            } else {
                // Now you don't
                ctx.fillText(this.text + " ", myX, this.y+baselineCorrection, this.width);
            }
        }
    };

    // Remove the last character from text
    this.pop = function() {
        if(this.text.length > 0) {
            this.text = this.text.substring(0, this.text.length-1);
        }
    };

    // Add character to text
    this.push = function(char) {
        if (this.text.length < this.maxLength) {
            this.text += char[0];
        }
    };

    // Remove this as selected input, return text and call the callback method (if given)
    this.submit = function(callback) {
        if (callback) {
            callback(this.text);
        }
        selectedInput = null;
        return this.text;
    }
};

var PingDisplay = function(ctx, x, y, ping, size, showText) {
    // Coordinate origin is bottom left (thanksmos)
    this.x = x;
    this.y = y;
    this.size = size; // height of the first bar in px (0.25*height of fourth bar)
    this.showText = showText || false; // Show ping in ms next to the bars?

    this.lineWidth = 2; // How thick is the outline (2 seems to be good)

    // Call this to draw me
    this.draw = function() {
        // Bar shadows
        ctx.fillStyle = "black";
        ctx.fillRect(this.x + 0 * this.size * 1.5 + 2, c.height - this.y - this.size - this.size * 0 + 2, this.size * 0.9, 1 * this.size);
        ctx.fillRect(this.x + 1 * this.size * 1.5 + 2, c.height - this.y - this.size - this.size * 1 + 2, this.size * 0.9, 2 * this.size);
        ctx.fillRect(this.x + 2 * this.size * 1.5 + 2, c.height - this.y - this.size - this.size * 2 + 2, this.size * 0.9, 3 * this.size);
        ctx.fillRect(this.x + 3 * this.size * 1.5 + 2, c.height - this.y - this.size - this.size * 3 + 2, this.size * 0.9, 4 * this.size);

        // Set the color based on the range the ping is in
        if (ping < settings.pingDisplay.ranges[2]) {
            this.color = settings.pingDisplay.colors[3];
        } else if (ping < settings.pingDisplay.ranges[1]) {
            this.color = settings.pingDisplay.colors[2];
        } else if (ping < settings.pingDisplay.ranges[0]) {
            this.color = settings.pingDisplay.colors[1];
        } else {
            this.color = settings.pingDisplay.colors[0];
        }

        // Setup font
        ctx.fillStyle = this.color;

        // We always fill the first bar
        ctx.fillRect(this.x + 0 * this.size * 1.5, c.height - this.y - this.size - this.size * 0, this.size * 0.9, 1 * this.size);

        /* Second bar */
        if (ping > settings.pingDisplay.ranges[0]) {
            ctx.fillStyle = "grey"; // This stops the bars drawing in color and makes them grey instead
        }
        ctx.fillRect(this.x + 1 * this.size * 1.5, c.height - this.y - this.size - this.size * 1, this.size * 0.9, 2 * this.size);

        /* Third bar */
        if (ping > settings.pingDisplay.ranges[1]) {
            ctx.fillStyle = "grey";
        }
        ctx.fillRect(this.x + 2 * this.size * 1.5, c.height - this.y - this.size - this.size * 2, this.size * 0.9, 3 * this.size);

        /* Last Bar */
        if (ping > settings.pingDisplay.ranges[2]) {
            ctx.fillStyle = "grey";
        }
        ctx.fillRect(this.x + 3 * this.size * 1.5, c.height - this.y - this.size - this.size * 3, this.size * 0.9, 4 * this.size);

        // Write ping in ms right to the bars
        if (this.showText) {
            // Setup font
            ctx.font = 4 * this.size + "px PressStart2P";
            ctx.textAlign = "left";

            // Text
            ctx.fillStyle = this.color;
            ctx.coolText(ping, this.x + 5 * this.size * 1.5, c.height - this.y);
        }
    }
};

// Frame counter to base animations on
var animFrames = 0;


// draw mouse cursor
var drawCursor = function () {
    ctx.strokeStyle = "#f0f";
    ctx.strokeRect(cursor[0] - 1, cursor[1] - 1, 2, 2);
    ctx.beginPath();
    ctx.moveTo(cursor[0] + 4, cursor[1] + 4);
    ctx.lineTo(cursor[0] - 4, cursor[1] - 4);
    ctx.moveTo(cursor[0] - 4, cursor[1] + 4);
    ctx.lineTo(cursor[0] + 4, cursor[1] - 4);
    ctx.stroke();
}

// draw Main menu screen
var drawMenu = function () {
    c.width = settings.client.mainMenuWidth;
    c.height = settings.client.mainMenuHeight;
    sprites.draw(ctx, "/assets/images/cover.jpg", 220, 30, 800, 416);
    sprites.draw(ctx, "/assets/images/entername.png", (c.width - sprites.get("/assets/images/entername.png").getWidth()) / 2, 480)

    // Create all inputs if they haven't been created yet.
    if (allInputs.length == 0) {
        // Input field for entering the playername
        // [].push() returns the length of the array, length-1 is the position of the last pushed element
        nameinput = allInputs[allInputs.push(new CanvasInput(ctx, "setName", c.width/2, 590, 500))-1];
        nameinput.maxLength = settings.playerConnection.maxNameLength;
        nameinput.align = "center";
        nameinput.fontFace = "PressStart2P";
        nameinput.fontSize = 40;
        nameinput.padding = 10;
        nameinput.color = "black";
        nameinput.borderWidth = 3;
        nameinput.borderColor = "black";

        if (profile && profile.username) nameinput.text = profile.username;

        // Set nameinput as selected (Autofocus)
         selectedInput = nameinput;
    }

    // Iterate through all inputs and draw them
    for (var i=0; i<allInputs.length; i++) {
        allInputs[i].draw();
    }
}

var drawMapBG = function (ctx, state) {
    c.width = map.size[0];
    c.height = map.size[1] + bottomHudHeight;

    for (var i = 0; i < map.rects.length; i++) {
        var r = map.rects[i];
        ctx.fillStyle = "black";
        ctx.fillRect(r[0], map.size[1] - r[1] - r[3], r[2], r[3])
    }

    if (map.backgroundImage) {
        sprites.draw(ctx,map.backgroundImage, 0,0);
    }
    
}

var drawMapFG = function (ctx, state) {
     if (map.foregroundImage) {
        sprites.draw(ctx,map.foregroundImage, 0,0);
    }   
}

var drawActors = function (ctx, state) {
    for (var i = 0; i < state.actors.length; i++) {
        var a = state.actors[i];
        if (a.type == "player") {
            var pSize = settings.player.hitBoxSize;
            // Draw Player
            // Edges by weapon color
            ctx.fillStyle = a.weaponColor;
            ctx.fillRect(a.pos[0] - pSize/2, map.size[1] - a.pos[1] - pSize/2, pSize, pSize)
            // Center by player color
            ctx.fillStyle = "rgb(" + a.color[0] + "," + a.color[1] + "," + a.color[2] + ")";
            ctx.fillRect(a.pos[0] - pSize/3, map.size[1] - a.pos[1] - pSize/3, 2*pSize/3, 2*pSize/3)

            ctx.textAlign = "center";
            ctx.font = "8px PressStart2P"
            ctx.fillStyle = "white";
            ctx.coolText(a.name, a.pos[0], map.size[1] - (a.pos[1] + 20), 1);
            ctx.fillStyle = "black";
            ctx.fillRect(a.pos[0] - 10, map.size[1] - (a.pos[1] + 15), 20, 5)
            ctx.fillStyle = "#00CC00";
            ctx.fillRect(a.pos[0] - 9, map.size[1] - (a.pos[1] + 14), 18 * (a.hp / 100), 3)
        } else if (a.type == "bullet") {
            // Draw Bullet
            ctx.fillStyle = a.weapon.bulletColor;
            ctx.fillRect(a.pos[0] - a.weapon.bulletSize / 2, map.size[1] - a.pos[1] - a.weapon.bulletSize / 2, a.weapon.bulletSize, a.weapon.bulletSize)

        } else if (a.type == "powerup") {
            // Draw powerup as rainbow colored block
            ctx.fillStyle = rainbow.getColor();
            ctx.fillRect(a.pos[0] - 10, map.size[1] - a.pos[1] - 10, 20, 20);

            // Then add letter describing what's in it
            ctx.textAlign = "left"
            ctx.fillStyle = "white"
            ctx.font = "16px PressStart2P"
            ctx.fontSize = 20;
            if (a.content == "flamethrower") {
                ctx.coolText("F", a.pos[0] - 8, map.size[1] - a.pos[1] + 8, 1);
            } else if (a.content == "grenades") {
                ctx.coolText("G", a.pos[0] - 8, map.size[1] - a.pos[1] + 8, 1);
            } else if (a.content == "laser") {
                ctx.coolText("L", a.pos[0] - 8, map.size[1] - a.pos[1] + 8, 1);
            } else if (a.content == "shotgun") {
                ctx.coolText("S", a.pos[0] - 8, map.size[1] - a.pos[1] + 8, 1);
            } else if (a.content == "medipack") {
                ctx.coolText("M", a.pos[0] - 8, map.size[1] - a.pos[1] + 8, 1);
            }



        } else if (a.type == "effect") {
            // Draw effect

            if (a.name == "laser") {
                // Laser is a blue line
                ctx.strokeStyle = "#2222FF";
                ctx.beginPath();
                ctx.moveTo(a.pos1[0], map.size[1] - a.pos1[1]);
                ctx.lineTo(a.pos2[0], map.size[1] - a.pos2[1]);
                ctx.stroke()

            } else if (a.name == "explosion") {
                // Explosion is an orange circle
                ctx.fillStyle = "rgba(255,127,0, 0.5)"
                ctx.beginPath();
                ctx.arc(a.pos1[0], map.size[1] - a.pos1[1], 60, 0, 2 * Math.PI);
                ctx.fill();
            }

        } else if (a.type == "jumper") {
            sprites.draw(ctx, "/assets/images/jumper.png", a.pos[0]-7,  map.size[1] - (10+a.pos[1]));
        }
    } // end for
} // end drawActors

// This draws a multi kill message (for one frame)
var drawMultiKill = function (name, count) {
    // Get displaying text from settings
    var text = settings.strings.multiKill;
    text = text.replace("{name}", name).replace("{number}", settings.strings.multiKillNumbers[count-1]); // Insert data into string
    // Draw it to the middle of the screen
    drawProminentMessage(text); // offset and color default 0 and white
};

// This draws a killing streak message (for one frame)
var drawKillStreak = function (name, count) {
    // Get displaying text from settings
    var text = (count <= settings.strings.killStreak.length) ? settings.strings.killStreak[count+1] : settings.strings.killStreak[settings.strings.killStreak.length-1];
    // Killing spree text is only available for some numbers
    if (text) {
        text = text.replace("{name}", name); // Insert data into string
        // Draw it to the middle of the screen (with another color and some offset)
        drawProminentMessage(text, settings.client.killStreakMessageColor, settings.client.prominentMessagesSpacing);
    }
};

// This draws a bigass message to the middle of the screen
var drawProminentMessage = function(text, color, yOffset) {
    color = color || "white";
    yOffset = yOffset || 0;
    /* Draw it to the big screen */
    ctx.font = "16px PressStart2P";
    ctx.textAlign = "center";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    var yPos = settings.client.prominentMessagesY;

    ctx.fillStyle = color;
    ctx.coolText(text, c.width / 2, yPos + yOffset)
};

var drawHUD = function (ctx, hud) {
    // Draw messages in messagelog
    for (var i = 0; i < messagelog.length; i++) {
        ctx.fillStyle = "lightgrey";
        ctx.font = "8px PressStart2P"
        ctx.textAlign = "start";
        ctx.coolText(messagelog[i], 10, 15 + 15 * i, 1);
    }

    ctx.font = "16px PressStart2P";
    ctx.textAlign = "center";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    // If there was a kill streak in the last (see settings) seconds, draw it
    if (lastKillStreak) {
        drawKillStreak(lastKillStreak.name, lastKillStreak.count);
    }

    // If there was a multikill in the last (see settings) seconds, draw it
    if (lastMultiKill) {
        drawMultiKill(lastMultiKill.name, lastMultiKill.count);
    }

    // Draw bottom bar
    ctx.fillStyle = "#444";
    ctx.fillRect(0, c.height - bottomHudHeight, c.width, bottomHudHeight)
    ctx.fillStyle = "black";
    ctx.fillRect(0, c.height - bottomHudHeight, c.width, 2)

    // Text for HP and Ping
    ctx.font = "16px PressStart2P"
    ctx.textAlign = "start";

    var mainPingDisplay = new PingDisplay(ctx, 10, 10, hud.ping, 4, true);
    mainPingDisplay.draw();

    //HP Bar
    ctx.fillStyle = hudHpColor2;
    ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-(hudBarHeight+1), hudBarWidth, hudBarHeight)
    var pct = hud.hp / 100;
    ctx.fillStyle = hudHpColor1;
    ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-(hudBarHeight+1), hudBarWidth * pct, hudBarHeight);

    ctx.fillStyle = hudBarTextColor;
    ctx.textAlign = "center";
    ctx.font = hudBarFont
    ctx.coolText(hud.hp +"/100", c.width/2, c.height, 1)

    // Weapon ammo display, if we have one
    if (hud.weapon) {
        // Ammo counter
        ctx.fillStyle = hudAmmoColor2
        ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-2*(hudBarHeight+1), hudBarWidth, hudBarHeight)
        var pct = hud.weapon.ammo / hud.weapon.maxAmmo;
        ctx.fillStyle = hudAmmoColor1;
        ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-2*(hudBarHeight+1), hudBarWidth * pct, hudBarHeight);

        ctx.fillStyle = hudBarTextColor;
        ctx.textAlign = "center";
        ctx.font = hudBarFont
        ctx.coolText(hud.weapon.ammo +"/"+hud.weapon.maxAmmo, c.width/2, c.height-(hudBarHeight+1))

        // Reload cooldown
        ctx.fillStyle = hudReloadColor2;
        if (hud.weapon.ammoRecharge == 1) {
            ctx.fillStyle = hudInactiveColor;
        }
        ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-3*(hudBarHeight+1), hudBarWidth, hudBarHeight)
        var pct = hud.weapon.ammoTicks / hud.weapon.ammoRecharge;
        ctx.fillStyle = hudReloadColor1;
        ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-3*(hudBarHeight+1), hudBarWidth * pct, hudBarHeight);

        if (hud.weapon.ammoRecharge != 1) {
            ctx.fillStyle = hudBarTextColor;
            ctx.textAlign = "center";
            ctx.font = hudBarFont
            ctx.coolText( ((hud.weapon.ammoRecharge-hud.weapon.ammoTicks)/33.33).toFixed(2)+"s" , c.width/2, c.height-2*(hudBarHeight+1))
        }  
    } else {
        ctx.fillStyle = hudInactiveColor
        ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-3*(hudBarHeight+1), hudBarWidth, hudBarHeight)
        ctx.fillRect(c.width/2 - hudBarWidth/2, c.height-2*(hudBarHeight+1), hudBarWidth, hudBarHeight)
    }

    // Green triangle over player when holding donw the alt key
    if (showLocationFinder) {
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        hud.playerY = map.size[1] - hud.playerY; // 80%
        // Something weird happened when I replaced this with coolText
        ctx.fillStyle = "black";
        ctx.fillText("▼", hud.playerX + 2, hud.playerY - 30 + 2);
        ctx.fillStyle = "#f0f";
        ctx.fillText("▼", hud.playerX, hud.playerY - 30);
    }

    // remaining Time until next round
    if (state.timeRemaining) {
        var t = state.timeRemaining;
        var mins = Math.floor(t/60000);
        t %= 60000;
        var s = Math.floor(t/1000);
        s = ("0"+s).substr(-2,2);
        t %= 1000;
        var m = Math.floor(t/100);
        ctx.fillStyle = "white";
        ctx.font = "16px PressStart2P";
        ctx.textAlign = "left"
        ctx.coolText("Time: "+mins+":"+s, c.width/2 + hudBarWidth/2 +2, c.height-(hudBarHeight+1));
    }

    // Input for the chat
    if (chatInput && chatActive) {
        chatInput.draw();
    }
}

// Draw text with border and shadow in a really cool looking way
CanvasRenderingContext2D.prototype.coolText = function(text, x, y, shadowSize) {
    shadowSize = shadowSize || 2; // default 2

    if (!text || !x || !y)
        throw new TypeError("Failed to execute 'coolText' on 'CanvasRenderingContext2D': 3 arguments required, but only "+arguments.length+ " present");

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    var color = ctx.fillStyle;

    // Border
    ctx.strokeText(text, x, y);

    // Shadow
    ctx.fillStyle = "black";
    ctx.fillText(text, x + shadowSize, y + shadowSize);

    // Text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
};

var drawDeathScreen = function (ctx, hud) {
    ctx.fillStyle = "white";
    ctx.textAlign = "center"
    ctx.font = "40px PressStart2P"
    ctx.coolText("You are dead.", c.width / 2, c.height / 2 -25);
    ctx.font = "24px PressStart2P"
    if (hud.respawn > 40) {
        ctx.coolText("Press any key to respawn.", c.width/2, c.height / 2 + 25);
    } else {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(c.width / 2, c.height / 2 + 25);
        ctx.arc(c.width / 2, c.height / 2 + 25, 30, 0, 2 * Math.PI * (hud.respawn / 40));
        ctx.lineTo(c.width / 2, c.height / 2 + 25);
        ctx.fillStyle = "rgb(" + 255 - Math.floor((255 * (hud.respawn / 40))) + "," + (255 * Math.floor(hud.respawn / 40)) + ",0)"
        ctx.fill();
    }
}

// 1 -> 1st, 2 -> 2nd and so on for all positive numbers
var ordinalString = function(number) {
    if (number%100 == 11 || number%100 == 12 || number%100 == 13)   // Number ends with ..
        return "th";
    if (number%10 == 1)
        return "st";
    if (number%10 == 2)
        return "nd";
    if (number%10 == 3)
        return "rd";
    return "th"
};

// Set a String to a specific length (only good with monospace fonts)
String.prototype.makeLength = function(length, fillChar, changeSide) {
    // Wow, error handling!
    if (!length)
        throw new TypeError("Failed to execute 'makeLength' on 'String': 1 argument required, but only "+arguments.length+ " present");

    // Let's go
    fillChar = fillChar || " "; // Set whitespace as default if no value is given
    changeSide = changeSide || "right"; // default: add trailing whitespace or cut the right side off

    if(this.toString().length >= length) {
        // String has to be cut off
        if (changeSide == "left") {
            return this.toString().substring(this.toString().length-length, this.toString().length);
        } else if (changeSide == "right") {
            return this.toString().substring(0, length);
        }
    } else {
        // We need the fillChar
        var retStr = this.toString();
        for (var i = this.toString().length; i < length; i++) {
            if (changeSide == "right") {
                retStr = retStr + fillChar;
            } else if (changeSide == "left") {
                retStr = fillChar + retStr;
            }
        }
        return retStr;
    }
};

var scoreboard;
var drawScoreboard = function (ctx, state) {
    var maxPlayers = settings.client.scoreBoardMaxPlayers;
    var scoreBoardWidth = settings.client.scoreBoardWidth;
    var scoreBoardHeight = settings.client.scoreBoardHeight;

    var scoreBoardX = map.size[0] / 2 - scoreBoardWidth / 2;
    var scoreBoardY = map.size[1] / 2 - scoreBoardHeight / 2;

    scoreboard = state.users.sort(function (a, b) {
        return (b.score - a.score)
    });

    // Draw background
    ctx.fillStyle = "rgba(40,40,40,0.8)";
    ctx.fillRect(scoreBoardX, scoreBoardY, scoreBoardWidth, scoreBoardHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(scoreBoardX, scoreBoardY, scoreBoardWidth, scoreBoardHeight);

    ctx.textAlign = "start";
    ctx.font = "15px PressStart2P";
    var unjoinedPlayers = 0;
    var hiddenPlayers = 0;

    var selfFound = false; // Has the player been written in the scoreboard yet?

    // Iterate through all players
    for (var i = 0; i < scoreboard.length; i++) {
        s = scoreboard[i];
        // Display top joined players + self (at the end if no place in list)
        if (!s.joined) {
            // Player has not joined yet
            unjoinedPlayers++;
            continue;
        } else {
            // Player has joined
            if (i-unjoinedPlayers+hiddenPlayers >= maxPlayers && selfFound) {
                // Player is displayed and all sb-slots are full
                break;
            } else if (hud.self != s.uID && !selfFound && i-unjoinedPlayers+hiddenPlayers+1 >= maxPlayers) {
                // There is only space for 1 more who has to be the player
                hiddenPlayers++;
                continue;
            } else {
                if (hud.self == s.uID) {
                    // It's a me
                    selfFound = true;
                }

                // Font for scoreboard entries
                ctx.font = "15px PressStart2P";
                ctx.fillStyle = "black";

                // 1st, 2nd, etc.
                var rank = ((i - unjoinedPlayers + 1) + ordinalString(i - unjoinedPlayers + 1)).makeLength(4, " ", "left");
                // ..., -01, 000, 001, ...
                var score = s.score >= 0 ? (s.score + "").makeLength(3, "0", "left") : "-" + ((-s.score + "").makeLength(2, "0", "left"));
                // PLAYERNAME--------------- (filled up with - to max length)
                var name = s.name.makeLength(settings.playerConnection.maxNameLength, "-");

                // Other color if self
                ctx.fillStyle = hud.self == s.uID ? settings.client.scoreBoardSelfColor : settings.client.scoreBoardTextColor;

                ctx.coolText(rank + " " + score + " " + name, scoreBoardX + 30, scoreBoardY + 27 + (i - unjoinedPlayers - hiddenPlayers) * 20);

                // Latency display in Scoreboard (No text)
                var playerPing = new PingDisplay(ctx, scoreBoardX + 550, c.height - (scoreBoardY + 24 + (i - unjoinedPlayers - hiddenPlayers) * 20), s.ping, 3);
                playerPing.draw();
            }
        }
    }
};

var drawEndscreen = function (ctx) {
    var roundOverHeight = 480;
    var roundOverWidth = 800;

    var cornerX = c.width/2 - roundOverWidth/2;
    var cornerY = c.height/2 - roundOverHeight/2;
    
    // Background Box
    ctx.fillStyle = "rgba(40,40,40,0.8)";
    ctx.strokeStyle = "#000";
    ctx.fillRect(c.width/2 - roundOverWidth/2, c.height/2 - roundOverHeight/2, roundOverWidth, roundOverHeight)
    ctx.lineWidth=4;
    ctx.strokeRect(c.width/2 - roundOverWidth/2, c.height/2 - roundOverHeight/2, roundOverWidth, roundOverHeight)
    ctx.lineWidth=1;

    // Scoreboard
    scoreboard = state.users.sort(function (a, b) {
        return (b.score - a.score)
    });

    ctx.font = "24px PressStart2P"
    ctx.textAlign = "left"
    ctx.fillStyle = "white";
    ctx.coolText("Scoreboard", cornerX+12, cornerY+38);

    ctx.font = "8px PressStart2P";
    var n=0;
    for (var i = 0; i < scoreboard.length; i++) {
        s = scoreboard[i];
        if (s.joined) {
            ctx.coolText((i-n + 1) + ". " + s.name + ": " + s.score + " points (" + s.ping + " ms)", cornerX+30, 40+cornerY + (1+i-n) * 20, 1);
        } else {
            n++;
        } 
    }

    // Map Winner
    ctx.font = "24px PressStart2P";
    ctx.textAlign = "center";
    ctx.coolText("Round winner", cornerX+roundOverWidth-195, cornerY+38);
    ctx.font = "16px PressStart2P";
    ctx.textAlign = "center";
    ctx.coolText(scoreboard[0].name, cornerX+roundOverWidth-195, cornerY+75)
    sprites.draw(ctx, "/assets/images/characters/filk.png", cornerX+roundOverWidth-195 - 16, cornerY+100-16, 32, 32);
    
    
    // Map Vote    
    ctx.font = "16px PressStart2P";
    ctx.textAlign = "left";
    ctx.coolText("Vote for the next map", cornerX+roundOverWidth-370, cornerY+200);
    ctx.fillStyle = "black";
    ctx.fillRect(cornerX+roundOverWidth-195-1, cornerY+220-1, 175+3, 100+3);
    ctx.fillRect(cornerX+roundOverWidth-375-1, cornerY+220-1, 175+3, 100+3);
    ctx.fillRect(cornerX+roundOverWidth-195-1, cornerY+325-1, 175+3, 100+3);
    ctx.fillRect(cornerX+roundOverWidth-375-1, cornerY+325-1, 175+3, 100+3);
    sprites.draw(ctx, "/assets/images/akirabg.png", cornerX+roundOverWidth-195, cornerY+220, 175, 100)
    sprites.draw(ctx, "/assets/images/akirabg.png", cornerX+roundOverWidth-375, cornerY+220, 175, 100)
    sprites.draw(ctx, "/assets/images/akirabg.png", cornerX+roundOverWidth-195, cornerY+325, 175, 100)
    sprites.draw(ctx, "/assets/images/akirabg.png", cornerX+roundOverWidth-375, cornerY+325, 175, 100)


    // Timer
    ctx.font = "16px PressStart2P"
    var s = Math.floor(state.timeRemaining/1000);
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.coolText("Next map in "+s+"...", cornerX+roundOverWidth-370, cornerY+roundOverHeight-20);
};

var chatActive = false;
// Show chat input and make it active
var showChat = function () {
    if (chatActive) return;
    chatActive = true;
    chatInput = allInputs[allInputs.push(new CanvasInput(ctx, "chat", 20, c.height-60,  c.width/2))-1];
    chatInput.maxLength = 140;
    chatInput.align = "left";
    chatInput.fontFace = "PressStart2P";
    chatInput.fontSize = 16;
    chatInput.padding = 10;
    chatInput.color = "black";
    chatInput.borderWidth = 1;
    chatInput.borderColor = "black";
    selectedInput = chatInput;
    chatInput.active = true;
}

// Listener for update socket events
// Redraws the game based on the last update, plays sounds and displays messages
var handleUpdate = function (s) {
    // This loop is taking over, end the other one
    clearInterval(titleScreenInterval)
    
    hud = s["hud"]
    state = s["game"];
    animFrames++;

    if (hud.screen == 2) {// We aren't in game yet, so draw the menu
        drawMenu();
        drawCursor();
        return;
    }

    // Play sounds in queue
    var q = s.sounds;
    for (var i = 0; i < q.length; i++) {
        sounds.play(q[i]);
    }

    // Add messages from message queue to our message log
    var q = s.messages;
    for (var i = 0; i < q.length; i++) {
        console.log(q[i]); // Always good to have messages in the console.
        messagelog.push(q[i]);
        setTimeout("messagelog.shift()", 10000); // Remove new message entry after 10 seconds
    }

    // And the many things that are about drawing...

    // draw the game
    drawMapBG(ctx, state);
    drawActors(ctx, state);
    drawMapFG(ctx,state);
    // draw the hud
    drawHUD(ctx, hud);

    // Draw the "You a dead" text if user is dead
    if (hud.screen == 1) drawDeathScreen(ctx, hud);

    // Draw the scoreboard if tab is held
    if (state.state == 2) {
        drawEndscreen(ctx);
    } else if (showScores) drawScoreboard(ctx, state);

    // draw the cursor
    drawCursor();
}

var loadMap = function (e) {
    map = e;
}

var connect = function () {
    var sessionID = localStorage.getItem("sessionID");
    if (!sessionID) {
        sessionID = Math.round( Math.random()*1000000 ) // Not the securest ever, I know
        localStorage.setItem("sessionID", sessionID);
    }
    connecting = false;
    if (sock) return; // Only connect once
    // Open the socket and add listeners
    sock = io(window.location.hostname+":"+settings.gameServer.port, {"query": "sessionID="+sessionID});
    sock.on("update", handleUpdate);
    sock.on("loadMap", loadMap);

    // Some message to display
    sock.on("message", function(data) {
        switch(data.type) {
            // Somebody is on a kill streak
            case "killstreak":
                if (killStreakMessageTimeout) clearTimeout(killStreakMessageTimeout);
                lastKillStreak = data.data;
                killStreakMessageTimeout = setTimeout("lastKillStreak = null", settings.client.killStreakMessageDisplayTime);
                break;
            // Somebody scored a multikill
            case "multikill":
                if (multiKillMessageTimeout) clearTimeout(multiKillMessageTimeout);
                lastMultiKill = data.data;
                multiKillMessageTimeout = setTimeout("lastMultiKill = null", settings.client.multiKillMessageDisplayTime);
                break;
            /* Probably want to add this later
            // A message was sent
            case "message":
                drawMessage(data.message);
                break;
            */
            // Something else
            default:
                console.log(data);
        }
    });

    // I had weird problems naming those "ping" and "pong", maybe socket.io internally uses those? they disappeared after I renamed them to that
    sock.on("pung", function (time) {
        sock.emit("pang", time);
    });

    sock.on("disconnect", function () {
        connected = false;
        sock.disconnect()
        sock = null;
        titleScreenInterval = setInterval(titleScreenRefresh, 33);
    });

    // Sync some settings from the serverside profile
    sock.on("login", function (p) {
        profile = p;
        if (nameinput && p.username) nameinput.text = p.username;
    });
}

// Add event listeners for inputs
// I'm sure I could get away with only updating the cursor when the mouse is clicked, but I didn't have any bandwidth issues yet...
c.onmousemove = function (e) {
    var y = c.height;
    if (map) y=map.size[1];

    if (sock) sock.emit("mousemove", [e.offsetX, y - e.offsetY])
    cursor = [e.offsetX, e.offsetY]
    stopEvent(e);
}

// Shoot!
c.onmousedown = function (e) {
    if (sock) {
        sock.emit("presskey", "space");
    } else {
        connecting = true;
    }
    stopEvent(e);
}

// Stop shooting
c.onmouseup = function (e) {
    if (sock) sock.emit("releasekey", "space");
    stopEvent(e);
}


// dont show context menu
c.oncontextmenu = function (e) {
    stopEvent(e);
}

// all kinds of keys
document.onkeydown = function (e) {
    // Do this if an input element is focused
    if (selectedInput) {
        // Valid characters for user input
        var allowedChars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

        // Special characters like äöü don't work with String.fromCharCode

        if (allowedChars.indexOf(String.fromCharCode(e.which)) != -1) {
            // UpperCase only for cool retro pixel feeling
            selectedInput.push(String.fromCharCode(e.which));
        } else if (e.keyCode == "32") {
            // Space is also allowed in input fields
            e.preventDefault();
            selectedInput.push(" ");
        }

        // Backspace
        if (e.keyCode == "8") {
            e.preventDefault(); // Backspace = Back
            selectedInput.pop();
        }

        // Return
        if (e.keyCode == "13") {
            // Do this action only if the selected input is the setName input
            if (selectedInput.name == "setName") {
                sock.emit("setName", selectedInput.submit());
            } else if (selectedInput.name =="chat") {
                sock.emit("chat", selectedInput.submit());
                chatActive = false;
                chatInput.active = false;
            }
        }
    } else {
        // Open the chat screen on enter/t
        if (e.keyCode == "84" || e.keyCode == "13") {
            if (hud.screen != 2 && hud.screen != undefined) showChat();
        }
    }

    if (sock) {
        if (e.keyCode == "38" || e.keyCode == "87") {
            sock.emit("presskey", "up");
        }
        if (e.keyCode == "40" || e.keyCode == "83") {
            sock.emit("presskey", "down");
        }
        if (e.keyCode == "37" || e.keyCode == "65") {
            sock.emit("presskey", "left");
        }
        if (e.keyCode == "39" || e.keyCode == "68") {
            sock.emit("presskey", "right");
        }
        if (e.keyCode == "32") {
            sock.emit("presskey", "up");
        }
    }

    if (e.keyCode == "9") {
        showScores = true;
        e.preventDefault()
    }

    // Disable Alt+Arrows and Alt+WASD browser shortcuts
    if (e.altKey && ([37, 38, 39, 40, 87, 83, 65, 68].indexOf(e.keyCode) != -1)) {
        e.preventDefault();
    }
};

document.onkeyup = function (e) {
    if (sock) {
        if (e.keyCode == "38" || e.keyCode == "87") {
            sock.emit("releasekey", "up");
        }
        if (e.keyCode == "40" || e.keyCode == "83") {
            sock.emit("releasekey", "down");
        }
        if (e.keyCode == "37" || e.keyCode == "65") {
            sock.emit("releasekey", "left");
        }
        if (e.keyCode == "39" || e.keyCode == "68") {
            sock.emit("releasekey", "right");
        }
        if (e.keyCode == "32") {
            sock.emit("releasekey", "up");
        }
    }
    if (e.keyCode == "9") {
        showScores = false;
    }

    // Do this onkeyup to prevent holding down the key toggling it on and off very fast
    if (e.keyCode == "18") {
        showLocationFinder = !showLocationFinder;
        e.preventDefault();
    }
};


// Draw pre-connect screen
var titleScreenRefresh = function () {

    animFrames++; // we're not running onUpdate, so increment them here
    c.width = settings.client.mainMenuWidth;
    c.height = settings.client.mainMenuHeight;
    ctx.clearRect(0,0,c.width, c.height);

    ctx.fillStyle = "black";
    ctx.fillRect(0,0,c.width,c.height);
    
    if (sprites.finished > 0) sprites.draw(ctx, "/assets/images/title.jpg", 0, 0, c.width, c.height);
    
    if (!sprites.loaded() && !sounds.loaded()) {
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#000"
        ctx.font = "40px PressStart2P";
        ctx.textAlign = "center";
        ctx.coolText("Loading GFX... "+Math.round(sprites.finished*100/sprites.spriteCount)+"%", c.width/2, 600);
        ctx.font = "24px PressStart2P";
        ctx.coolText(sprites.currentlyLoading, c.width/2, 650);
    }
    if (sprites.loaded() && !sounds.loaded()) {
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#000"
        ctx.font = "40px PressStart2P";
        ctx.textAlign = "center";
        ctx.coolText("Loading SFX... "+Math.round(sounds.finished*100/sounds.soundCount)+"%", c.width/2, 600);
        ctx.font = "24px PressStart2P";
        ctx.coolText(sounds.currentlyLoading, c.width/2, 650);
    }
    
    if (!sprites.loaded() || !sounds.loaded()) return;
    if (connecting) {
        connect();
    }

    if (animFrames % 50 < 25) {
        ctx.fillStyle = "#fff"
        ctx.strokeStyle = "#000"
        ctx.font = "40px PressStart2P";
        ctx.textAlign = "center";
        ctx.coolText("PRESS ANY KEY", c.width/2, 650);
    }

    ctx.strokeStyle = "#fff"
    drawCursor();
}

var titleScreenInterval = setInterval(titleScreenRefresh, 33)

// change/set color
colorclick.onclick = function (e) {
    if (sock) {
        sock.emit("setColor", [c1.value, c2.value, c3.value])
    }
    stopEvent(e);
}


// Preventdefault 2: Attack of the Events
function stopEvent(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}
