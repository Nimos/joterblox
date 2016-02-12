// Load settings
var settings = require("../settings")

// Load DB and interface
var mongo = require("mongodb")
var monk = require("monk")

// Load module for hashing things
var crypto = require("crypto")

// Connect to DB
var db = monk(settings.database.url)


var Profile = function (obj) {
    var template = obj || {}

    // Basic Information
    this.username = template.username;
    this.password = template.password;
    this.experience = template.experience || 0;
    this.color = template.color || [0,0,0];
    this.registered = template.registered || (new Date()).getTime();

    // Statistics
    this.statistics = {}
    if (!template.statistics) template.statistics = {};

    // Game statistics
    this.statistics.gamesPlayed     = template.statistics.gamesPlayed || 0;
    this.statistics.gamesWon        = template.statistics.gamesWon || 0;
    this.statistics.timePlayed      = template.statistics.timePlayed || 0;
    
    // Kills
    this.statistics.flameKills      = template.statistics.flameKills || 0;
    this.statistics.shotgunKills    = template.statistics.shotgunKills || 0;
    this.statistics.gunKills        = template.statistics.gunKills || 0;
    this.statistics.laserKills      = template.statistics.laserKills || 0;
    this.statistics.grenadeKills    = template.statistics.grenadeKills || 0;
    this.statistics.totalKills      = template.statistics.totalKills || 0;

    // Deaths
    this.statistics.flameDeaths     = template.statistics.flameDeaths || 0;
    this.statistics.shotgunDeaths   = template.statistics.shotgunDeaths || 0;
    this.statistics.gunDeaths       = template.statistics.gunDeaths || 0;
    this.statistics.laserDeaths     = template.statistics.laserDeaths || 0;
    this.statistics.grenadeDeaths   = template.statistics.grenadeDeaths || 0;
    this.statistics.totalDeaths     = template.statistics.totalDeaths || 0;
    this.statistics.totalSuicides   = template.statistics.totalSuicides || 0;

    // Multikills
    this.statistics.multiKills      = template.statistics.multiKills || [0,0,0,0,0,0,0,0,0,0];
    this.statistics.maxKillstreak   = template.statistics.maxKillstreak || 0;

    // HitRate
    this.statistics.flameHits       = template.statistics.flameHits || 0;
    this.statistics.flameShots      = template.statistics.flameShots || 0;
    this.statistics.laserShots      = template.statistics.laserShots || 0;
    this.statistics.laserHits       = template.statistics.laserHits || 0;
    this.statistics.shotgunShots    = template.statistics.shotgunShots || 0;
    this.statistics.shotgunHits     = template.statistics.shotgunHits || 0;
    this.statistics.gunShots        = template.statistics.gunShots || 0;
    this.statistics.gunHits         = template.statistics.gunHits || 0;
    this.statistics.grenadeShots    = template.statistics.grenadeShots || 0;
    this.statistics.grenadeHits     = template.statistics.grenadeHits || 0;

    // And some database stuff
    this.databaseID = template._id || null;
    this.currentSession = template.currentSession || null;
}

Profile.get = function (query, callback) {
    var collection = db.get('profiles');
    collection.find(query, {}, function (err,r) {
        console.log(r);
        if (r[0]) {
            callback(new Profile(r[0]));
        } else {
            callback(null);
        }
    });
} 

Profile.prototype.save = function () {
    var collection = db.get('profiles');

    if (this.databaseID) {
        collection.update({"_id": this.databaseID}, this);
    } else {
        collection.insert(this);
    }
}



var quickHash = function (str) {
    var hash = crypto.createHash("sha256")
    hash.update(str);
    return hash.digest("hex");
}


module.exports = Profile