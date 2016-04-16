(function (exports, isClient) {
    // all physics in here
    // no client code

    // var Entity;
    // var Map;
    var Entity = isClient ? window.Entity : require('./entity').Entity;
    var Map = isClient ? window.Map : require('collections/map');
    if (isClient) {
        // exports.Entity = window.Entity;
        // exports.Map = window.Map;
        window.requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function (/* function */ callback, /* DOMElement */ element) {
                        window.setTimeout(callback, 1000 / 60);
                    };
        })();
    } else {
        // Entity = require('./entity').Entity;
        // Map = require('collections/map');
    }

    var GameWorld = function () {
        this.players = new Map();
        this.entities = [];
        this.gameStarted = false;
    }

    GameWorld.prototype.attack = function (playerObj) {}

    GameWorld.prototype.jump = function (playerObj) {}

    GameWorld.prototype.dodge = function (playerObj) {}

    GameWorld.prototype.move = function (playerObj) {
        console.log(playerObj.playerId + ' is moving ' + playerObj.direction + '.');
    }

    GameWorld.prototype.toggleReady = function (data) {
        this.players.get(data.playerId).isReady ^= true;
        console.log('Player ' + data.playerId + ' is' + (this.players.get(data.playerId).isReady ? ' ' : ' not ') + 'ready.');
    }

    GameWorld.prototype.playersAreReady = function() {
        var ready = true;
        this.players.values().forEach(function (player, index, arr) {
            ready &= player.isReady;
        });
        return ready;
    }

    GameWorld.prototype.callFunc = function (data) {
        if (data && data.theFunc) {
            this[data.theFunc](data);
        } else {
            console.log('data.theFunc is undefined.');
            console.log('GameWorld: ' + data + '\n');
        }
    }

    GameWorld.prototype.addPlayer = function (data) {
        this.players.set(data.playerId, new Entity(50, 50, data.playerId));
        var currplayers = '';
        this.players.forEach(function(ele, index, array){
            currplayers += ele.playerId + ', ';
        });
        console.log('Current players: ' + currplayers + '\n');
    }

    GameWorld.prototype.removePlayer = function (data) {
        this.players.remove(data.playerId);
        console.log('Player ' + data.playerId + ' has been removed.\n');
    }

   // Things to start the game.
    GameWorld.prototype.start = function () {
        console.log("start the game engine loop");
        var that = this;
        (function gameLoop() {
            if(that.gameStarted) {
                // Initialize vars for looping the game.
            } else {
                // Initialize vars for looping lobby?
            }
            that.loop();
            requestAnimFrame(gameLoop, that.ctx.canvas);
        })();
    }

    GameWorld.prototype.addEntity = function (entity) {
        console.log('added entity');
        this.entities.push(entity);
    }

    GameWorld.prototype.draw = function (drawCallback) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(this.ctx);
        }
        if (drawCallback) {
            drawCallback(this);
        }
        this.ctx.restore();
    }

    GameWorld.prototype.update = function () {
        var entitiesCount = this.entities.length;

        for (var i = 0; i < entitiesCount; i++) {
            var entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }

        for (var i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    }

    GameWorld.prototype.loop = function () {
        this.update();
        if (isClient) {
            this.draw();
            this.click = null;
            this.wheel = null;
        }
    }

   GameWorld.prototype.syncTheWorlds = function (serverGameWorld) {
        // console.log('\nSyncing the worlds.')
        if (serverGameWorld.players.length != 0) { 
            var gw = this;
            serverGameWorld.players.forEach(function(player, index, array) {
                if (!player.x) player = player[1];
                // console.log('Checking player: ' + player);
                if (gw.players.get(player.playerId)) {
                    // console.log('Syncing a existing player.');
                    // Player exist, update the player data.
                    gw.players.get(player.playerId).syncEntity(player);
                } else {
                    // console.log('Sync a new player.');
                    // Player does not exist. 
                    gw.players.set(player.playerId, new Entity(player.x, player.y, player.playerId, player));
                }
                console.log('\n');
            });
        }
   }

    exports.GameWorld = GameWorld;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");