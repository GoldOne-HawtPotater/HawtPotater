(function (exports) {
    // all physics in here
    // no client code

    var Entity;
    var Map;
    if (typeof global === "undefined") {
        Entity = window.Entity;
        Map = window.Map;
    } else {
        Entity = require('./entity').Entity;
        Map = require('collections/map');
    }

    var GameWorld = function () {
        this.players = new Map();
        this.gameStarted = false;
    }

    GameWorld.prototype.attack = function (playerObj) {}

    GameWorld.prototype.jump = function (playerObj) {}

    GameWorld.prototype.dodge = function (playerObj) {}

    GameWorld.prototype.move = function (playerObj) {
        console.log(playerObj.playerId + ' is moving ' + playerObj.direction + '.');
    }

    GameWorld.prototype.callFunc = function (data) {
        if (data && data.theFunc) {
            this[data.theFunc](data);
        } else {
            console.log('data.theFunc is undefined.');
            console.log('GameWorld: ' + data);
        }
    }

    GameWorld.prototype.addPlayer = function (data) {
        this.players.set(data.playerId, new Entity(50, 50, data.playerId));
        var currplayers = '';
        this.players.forEach(function(ele, index, array){
            currplayers += ele.playerId + ', ';
        });
        console.log('Current players: ' + currplayers);
    }

    GameWorld.prototype.removePlayer = function (data) {
        this.players.remove(data.playerId);
        console.log('Player ' + data.playerId + ' has been removed.');
    }

    GameWorld.prototype.playersAreReady = function() {
        var ready = true;
        // for (var i = 0; i < this.players.size; i++) {   
        //     var entity = [i];
        //     ready &= entity.isReady;
        // }
        this.players.values().forEach(function (player, index, arr) {
            ready &= player.isReady;
        });
        return ready;
    }

    GameWorld.prototype.toggleReady = function (data) {
        this.players.get(data.playerId).isReady ^= true;
        console.log('Player ' + data.playerId + ' is' + (this.players.get(data.playerId).isReady ? ' ' : ' not ') + 'ready.');
    }

   GameWorld.prototype.syncTheWorlds = function (serverGameWorld) {
        console.log('\nSyncing the worlds.')
        if (serverGameWorld.players.length != 0) { 
            var gw = this;
            serverGameWorld.players.forEach(function(player, index, array) {
                if (!player.x) player = player[1];
                if (gw.players.get(player.playerId)) {
                    console.log('Syncing a existing player.');
                    // Player exist, update the player data.
                    gw.players.get(player.playerId).syncEntity(player);
                } else {
                    console.log('Sync a new player.');
                    // Player does not exist. 
                    gw.players.set(player.playerId, new Entity(player.x, player.y, player.playerId, player));
                }
                console.log('\n');
            });
        }
   }

    exports.GameWorld = GameWorld;
})(typeof global === "undefined" ? window : exports);