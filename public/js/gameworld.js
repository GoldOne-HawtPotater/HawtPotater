(function (exports) {
    // all physics in here
    // no client code
    var GameWorld = function () {
        
    }

    GameWorld.prototype.toggleReady = function (playerObj) {
        this.players[playerId].toggleReady();
        console.log('Player ' + data.playerId + ' is ready.');
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

    GameWorld.prototype.playersAreReady = function() {
        var ready = true;
        for (var i = 0; i < this.players.length; i++) {
            var entity = this.players[i];
            ready &= entity.isReady;
        }
        return ready;
    }

    exports.GameWorld = GameWorld;
})(typeof global === "undefined" ? window : exports);