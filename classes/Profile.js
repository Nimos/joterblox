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
    this.gamesPlayed = template.gamesPlayed || 0;
    this.gamesWon = template.gamesWon || 0;
    this.flameKills = template.flameKills || 0;
    this.shotgunKills = template.shotgunKills || 0;
    this.gunKills = template.gunKills || 0;
    this.laserKills = template.laserKills || 0;
    this.grenadeKills = template.grenadeKills || 0;
    this.timePlayed = template.timePlayed || 0;

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