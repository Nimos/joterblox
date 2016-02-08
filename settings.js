var settings = {
    "player": {
        "maxHP": 100, // max health
        "speedCap": 10, // max speed to go left/right
        "hacceleration": 5, // how much to accelerate horizontally by every tick while moving
        "hdeceleration": 5, // how much to slow down horizontally by every tick while not moving
        "jumpSpeed": 20, // how much upwards speed to add when jump is pressed
        "gravity": 2, // how much to accellerate downwards every tick
        "hitBoxSize": 10 // size of player hitbox
    },

    "gameServer": {
        "randomMapList": ["akirajungle"], // map to be selected in the random rotation,
        "roundTimer": 120, // how long one round lasts in seconds
        "waitTime": 10, // How many seconds between each round
        "maxPowerups": 3, // how many powerups to spawn randomly
        "port": 3000, // Port on which the game server runs
    },

    "playerConnection": {
        "pingInterval": 100, // how often to ping (and also when to time out inactive connections) in ticks (30 = roughly 1 second)
        "defaultName": "Unnamed Block", // Placeholder name if user didnt select one
        "maxNameLength": 24, // maximum number of characters in name
        "respawnDelay": 40, // wait time after death to respawn, in ticks
    },

    "map": {
        "fallbackMap": "3lines" // which map to load as a fallback if the requested map can't be loaded
    },

    "powerup": {
        "types": ["laser", "grenades", "flamethrower","shotgun"], // which powerup types to randomly spawn
    },

    "client": {
        // Options for the bottom HUD
        "bottomHudHeight": 54,
        "hudBarWidth": 300,
        "hudBarHeight": 16,
        "hudAmmoColor1": "rgb(229, 103, 21)",
        "hudAmmoColor2": "rgb(164, 84, 11)",
        "hudReloadColor1": "rgb(70, 165, 215)",
        "hudReloadColor2": "rgb(55, 128, 161)",
        "hudInactiveColor": "rgb(50,50,50)",
        "hudHpColor1":  "rgb(18, 170, 83)",
        "hudHpColor2": "rgb(50,50,50)",
        "hudBarTextColor": "#fff",
        "hudBarFont": "16px PressStart2P",

        // Title Screen
        "mainMenuHeight": 720,
        "mainMenuWidth": 1280,

    },

    "pingDisplay": {
        // Options for ping displaying bars
        "colors": ["rgb(255, 0, 0)", "rgb(255, 128, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0"], // Colors in which to display individual ranges (High to low, 4 only)
        "ranges": [250, 120, 50] // High to low, ranges are infinite-first, ..., last-0 (only 4 ranges possible)
    }
}

module.exports = settings;