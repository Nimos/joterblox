// Get rendering context
var ctx = c.getContext("2d")

// this will hold the current game state
var state;

// cursor coordinates
var cursor = [0, 0];

// Messages that are displayed
var messagelog = [];

// Are we holding tab right now?
var showScores = false;

// Are we holding alt right now?
var showLocationFinder = false;

// Information about the UI
var hud = {"hp": 0, "ping": 0, "showscreen": 2}


// Load resources
var sounds = {
    "powerup": new Audio("/assets/sounds/powerup.wav"),
    "laser": new Audio("/assets/sounds/laser.wav"),
    "explosion": new Audio("/assets/sounds/explosion.wav"),
    "normalshot": new Audio("/assets/sounds/normalshot.wav"),
    "flame": new Audio("/assets/sounds/flame.wav"),
    "death": new Audio("/assets/sounds/death.wav"),
    "shotgun": new Audio("/assets/sounds/shotgun.wav"),
};

var sprites = {}
sprites.cover = new Image()
sprites.cover.src = "/assets/images/cover.jpg"

sprites.covertext = new Image()
sprites.covertext.src = "/assets/images/entername.png"

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

// Frame counter to base animations on
var animFrames = 0;


// draw mouse cursor
var drawCursor = function () {
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
    c.width = 640;
    c.height = 480;
    ctx.drawImage(sprites.cover, 0, 0, 640, 330)
    if (animFrames % 50 > 25) {
        ctx.drawImage(sprites.covertext, (c.width - sprites.covertext.width) / 2, 350)
    }
}

var drawMap = function (ctx, state) {
    c.width = state.map.size[0];
    c.height = state.map.size[1] + 40;

    for (var i = 0; i < state.map.rects.length; i++) {
        var r = state.map.rects[i];
        ctx.fillStyle = "black";
        ctx.fillRect(r[0], state.map.size[1] - r[1] - r[3], r[2], r[3])
    }
}

var drawActors = function (ctx, state) {
    for (var i = 0; i < state.actors.length; i++) {
        var a = state.actors[i];
        if (a.type == "player") {
            // Draw Player
            // Edges by weapon color
            ctx.fillStyle = a.weapon.weaponColor;
            ctx.fillRect(a.pos[0] - 5, state.map.size[1] - a.pos[1] - 5, 10, 10)
            // Center by player color
            ctx.fillStyle = "rgb(" + a.color[0] + "," + a.color[1] + "," + a.color[2] + ")";
            ctx.fillRect(a.pos[0] - 3, state.map.size[1] - a.pos[1] - 3, 6, 6)

            ctx.textAlign = "center";
            ctx.font = "10px sans-serif"
            ctx.fillStyle = "black";
            ctx.fillText(a.name, a.pos[0], state.map.size[1] - (a.pos[1] + 20));
            ctx.fillRect(a.pos[0] - 10, state.map.size[1] - (a.pos[1] + 15), 20, 5)
            ctx.fillStyle = "#00CC00";
            ctx.fillRect(a.pos[0] - 9, state.map.size[1] - (a.pos[1] + 14), 18 * (a.hp / 100), 3)
        } else if (a.type == "bullet") {
            // Draw Bullet
            ctx.fillStyle = a.weapon.bulletColor;
            ctx.fillRect(a.pos[0] - a.weapon.bulletSize / 2, state.map.size[1] - a.pos[1] - a.weapon.bulletSize / 2, a.weapon.bulletSize, a.weapon.bulletSize)

        } else if (a.type == "powerup") {
            // Draw powerup as rainbow colored block
            ctx.fillStyle = rainbow.getColor();
            ctx.fillRect(a.pos[0] - 10, state.map.size[1] - a.pos[1] - 10, 20, 20);

            // Then add letter describing what's in it
            ctx.textAlign = "left"
            ctx.fillStyle = "black"
            ctx.font = "20px sans-serif"
            ctx.fontSize = 20;
            if (a.content == "flamethrower") {
                ctx.fillText("F", a.pos[0] - 10, state.map.size[1] - a.pos[1] + 8);
            } else if (a.content == "grenades") {
                ctx.fillText("G", a.pos[0] - 10, state.map.size[1] - a.pos[1] + 8);
            } else if (a.content == "laser") {
                ctx.fillText("L", a.pos[0] - 10, state.map.size[1] - a.pos[1] + 8);
            } else if (a.content == "shotgun") {
                ctx.fillText("S", a.pos[0] - 10, state.map.size[1] - a.pos[1] + 8);
            }


        } else if (a.type == "effect") {
            // Draw effect

            if (a.name == "laser") {
                // Laser is a blue line
                ctx.strokeStyle = "#2222FF";
                ctx.beginPath();
                ctx.moveTo(a.pos1[0], state.map.size[1] - a.pos1[1]);
                ctx.lineTo(a.pos2[0], state.map.size[1] - a.pos2[1]);
                ctx.stroke()

            } else if (a.name == "explosion") {
                // Explosion is an orange circle
                ctx.fillStyle = "rgba(255,127,0, 0.5)"
                ctx.beginPath();
                ctx.arc(a.pos1[0], state.map.size[1] - a.pos1[1], 60, 0, 2 * Math.PI);
                ctx.fill();
            }

        }
    } // end for
} // end drawActors

var drawHUD = function (ctx, hud) {
    // Draw messages in messagelog
    for (var i = 0; i < messagelog.length; i++) {
        ctx.fillStyle = "black";
        ctx.font = "10px sans-serif"
        ctx.textAlign = "start";
        ctx.fillText(messagelog[i], 10, 15 + 15 * i);
    }

    // Draw buttom bar
    ctx.fillStyle = "black";
    ctx.fillRect(0, c.height - 40, c.width, 2)

    // Text for HP and Ping
    ctx.font = "35px Comic Sans MS"
    ctx.textAlign = "start";

    ctx.fillText("HP: " + hud.hp, 2, c.height - 3);
    ctx.fillText("PING: " + hud.ping, 150, c.height - 3);

    // Weapon ammo display, if we have one
    if (hud.weapon) {
        // Ammo counter
        ctx.fillRect(c.width - 10, c.height - 39, 5, 38)
        steps = 38 / hud.weapon.maxAmmo;
        steps2 = hud.weapon.maxAmmo - hud.weapon.ammo;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(c.width - 10, c.height - 38 + steps2 * steps, 5, 38 - steps2 * steps);

        // Reload cooldown
        ctx.fillStyle = "#000"
        ctx.fillRect(c.width - 16, c.height - 39, 5, 38)
        steps = 38 / hud.weapon.ammoRecharge;
        steps2 = hud.weapon.ammoRecharge - hud.weapon.ammoTicks;
        ctx.fillStyle = "#FF8800";
        ctx.fillRect(c.width - 16, c.height - 38 + steps2 * steps, 5, 38 - steps2 * steps);
    }

    // Green triangle over player when holding donw the alt key
    if (showLocationFinder) {
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle="#00CC00";
        hud.playerY = state.map.size[1]-hud.playerY; // 80%
        ctx.fillText("▼", hud.playerX, hud.playerY-30);
        ctx.strokeText("▼", hud.playerX, hud.playerY-30);
    }
}

var drawDeathScreen = function (ctx, hud) {
    ctx.fillStyle = "black"
    ctx.strokeStyle = "white"
    ctx.textAlign = "center"
    ctx.font = "50px Comic Sans MS"
    ctx.fillText("You are dead.", c.width / 2, c.height / 2 - 25);
    ctx.strokeText("You are dead.", c.width / 2, c.height / 2 - 25);
    if (hud.respawn > 40) {
        ctx.fillText("Press any key to respawn.", c.width / 2, c.height / 2 + 25)
        ctx.strokeText("Press any key to respawn.", c.width / 2, c.height / 2 + 25)
    } else {
        ctx.beginPath();
        ctx.moveTo(c.width / 2, c.height / 2 + 25);
        ctx.arc(c.width / 2, c.height / 2 + 25, 30, 0, 2 * Math.PI * (hud.respawn / 40));
        ctx.lineTo(c.width / 2, c.height / 2 + 25);
        ctx.fillStyle = "rgb(" + 255 - Math.floor((255 * (hud.respawn / 40))) + "," + (255 * Math.floor(hud.respawn / 40)) + ",0)"
        ctx.fill();
    }
}

var drawScoreboard = function (ctx, state) {
    scoreboard = state.users.sort(function (a, b) {
        return (b.score - a.score)
    });
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(100, 100, c.width - 200, c.height - 200);
    ctx.strokeStyle = "#000"
    ctx.strokeRect(100, 100, c.width - 200, c.height - 200);
    ctx.fillStyle = "black";
    ctx.textAlign = "start";
    ctx.font = "15px sans-serif";
    for (var i = 0; i < scoreboard.length; i++) {
        s = scoreboard[i];
        ctx.fillText((i + 1) + ". " + s.name + ": " + s.score + " points (" + s.ping + " ms)", 105, 115 + i * 20);
    }
}

// Listener for update socket events
// Redraws the game based on the last update, plays sounds and displays messages
var handleUpdate = function (s) {
    state = s;
    animFrames++;

    if (hud.screen == 2) {// We aren't in game yet, so draw the menu
        drawMenu();
        drawCursor();
        return;
    }

    // The few things that aren't about drawing...
    // Play sounds in queue
    for (var i = 0; i < state.sounds.length; i++) {
        sounds[state.sounds[i]].play();
    }

    // Add messages from message queue to our message log
    for (var i = 0; i < state.messages.length; i++) {
        console.log(state.messages[i]); // Always good to have messages in the console.
        messagelog.push(state.messages[i]);
        setTimeout("messagelog.shift()", 10000); // Remove new message entry after 10 seconds
    }

    // And the many things that are about drawing...

    // draw the game
    drawMap(ctx, state);
    drawActors(ctx, state);

    // draw the hud
    drawHUD(ctx, hud);

    // Draw the "You a dead" text if user is dead
    if (hud.screen == 1) drawDeathScreen(ctx, hud);

    // Draw the scoreboard if tab is held
    if (showScores) drawScoreboard(ctx, state);

    // draw the cursor
    drawCursor();
}

// Listener for the hud update event, just updates the global hud variable
var updateHud = function (data) {
    hud = data;
}

// Open the socket and add listeners
var sock = io(window.location.hostname+":3000");
sock.on("update", handleUpdate);
sock.on("hud", updateHud);

// I had weird problems naming those "ping" and "pong", maybe socket.io internally uses those? they disappeared after I renamed them to that
sock.on("pung", function (time) {
    sock.emit("pang", time);
});

// Add event listeners for inputs
// I'm sure I could get away with only updating the cursor when the mouse is clicked, but I didn't have any bandwidth issues yet...
c.onmousemove = function (e) {
    sock.emit("mousemove", [e.offsetX, state.map.size[1] - e.offsetY])
    cursor = [e.offsetX, e.offsetY]
    stopEvent(e);
}

// Shoot!
c.onmousedown = function (e) {
    sock.emit("presskey", "space");
    stopEvent(e);
}

// Stop shooting
c.onmouseup = function (e) {
    sock.emit("releasekey", "space");
    stopEvent(e);
}

// all kinds of keys
document.onkeydown = function (e) {
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

    if (e.keyCode == "9") {
        showScores = true;
        e.preventDefault()
    }

    if (e.keyCode == "18") {
        showLocationFinder = true;
        e.preventDefault();
    }

    // Disable Alt+Arrows and Alt+WASD browser shortcuts
    if (e.altKey && ([37, 38, 39, 40, 87, 83, 65, 68].indexOf(e.keyCode) != -1)) {
        e.preventDefault();
    }
};

document.onkeyup = function (e) {
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
    if (e.keyCode == "9") {
        showScores = false;
    }
    if (e.keyCode == "18") {
        showLocationFinder = false;
    }
};

// change/set name
nameclick.onclick = function (e) {
    sock.emit("setName", nameinput.value)
    stopEvent(e);
};

// change/set color
colorclick.onclick = function (e) {
    sock.emit("setColor", [c1.value, c2.value, c3.value])
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