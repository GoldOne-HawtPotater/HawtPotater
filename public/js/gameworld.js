

$(function(){
    // Get asset manager.
    window.ASSET_MANAGER = new AssetManager();
    /** Set up the functions that we need for the server. **/
    window.requestAnimFrame = (function () {
            return  window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function (/* function */ callback, /* DOMElement */ element) {
                        setTimeout(callback, 1000 / 60);
                    };
        })();

    var socket = io();
    

    /** Gameworld Class **/

    var GameWorld = function () {
        this.gameEngine = new GameEngine();
        this.surfaceWidth = 1280;
        this.surfaceHeight = 720;
        this.gameStarted = false;
        this.startTime = null;
        this.displayStartTimer = false;
        this.roomMasterWorld = false;
        this.ctx = null;

        this.debug = true;
    }
    window.GameWorld = GameWorld;

    GameWorld.prototype.init = function (ctx) {
        this.ctx = ctx;

        // Add the maps to gameMaps array
        // this.lobbyMap = new MapCreator(ASSET_MANAGER.getAsset("../img/platforms/map_spritesheet_01.png"), TileMaps['map01']);
        this.gameMaps = [];
        this.gameMaps.push(new MapCreator(ASSET_MANAGER.getAsset("../img/platforms/map_spritesheet_01.png"), TileMaps['map01']));
        this.gameMaps.push(new MapCreator(ASSET_MANAGER.getAsset("../img/platforms/map_spritesheet_01.png"), TileMaps['map02']));

        if (this.debug) {
            //setup debug draw
            var debugDraw = new Box2D.Dynamics.b2DebugDraw();
            debugDraw.SetSprite(this.ctx);
            debugDraw.SetDrawScale(this.gameEngine.SCALE);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
            this.gameEngine.b2dWorld.SetDebugDraw(debugDraw);
        }
    }

    GameWorld.prototype.start = function () {
        var that = this;
        if (that.roomMasterWorld) {
            var readyCheck = setInterval(function () {
                // Temporarily set required players to 1 for testing purposes
                if (that.gameEngine.myGameState == that.gameEngine.gameStates.waiting && that.gameEngine.players.size >= 1 && that.gameEngine.allIsReady()) {
                    // Randomly choose a map.
                    // Get a random number between 1 and the TileMaps.length - 1
                    that.mapNum = Math.ceil(Math.random() * (Object.getOwnPropertyNames(TileMaps).length - 1) + 1); //Math.floor(Math.random() * (Object.getOwnPropertyNames(TileMaps).length - 1)) + 1;
                    var setStartTime = Date.now() + 5000;
                    that.startTime = setStartTime;
                    var data = {
                        mapNum: that.mapNum,
                        time: setStartTime
                    };
                    that.gameStarted = true;
                    that.gameEngine.setGame(data);
                }
            }, 2000);
        }
        (function gameLoop() {
            if (that.roomMasterWorld) {
                that.loop();
                window.requestAnimFrame(gameLoop);
            }
        })();
    }

    GameWorld.prototype.draw = function (drawCallback) {
        var that = this;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();

        if (this.debug) {
            // b2d debug
            this.gameEngine.b2dWorld.DrawDebugData();
            this.gameEngine.b2dWorld.ClearForces();    
        }

        if (this.gameEngine.myGameState != this.gameEngine.gameStates.waiting) {
            /** Draw map **/
            this.gameMaps[this.mapNum-1].drawMap(that.ctx);
        } else {
            /** Draw lobby **/
            this.gameMaps[0].drawMap(that.ctx);
            this.ctx.font = "20px Comic Sans MS";
            this.ctx.fillStyle = "#ff0000";
            this.ctx.fillText("Lobby Mode", 400, 50);
            this.ctx.font = "14px Comic Sans MS"
            this.ctx.fillText("Waiting for all Players to be Ready", 400, 100);
        }

        /** Draw random entities **/
        this.gameEngine.entities.forEach(function(entity) {
            entity.draw(that.ctx, that.gameEngine.clockTick);
        });

        this.ctx.font = "20px Comic Sans MS";
        this.ctx.fillStyle = "#ff0000";        
        this.ctx.fillText("Scoreboard: ", 1100, 50);

        /** Draw Players **/
        this.gameEngine.players.forEach(function(player) {
            player.draw(that.ctx, that.gameEngine.clockTick);

            if (player.isReady) {
                that.ctx.fillStyle = "#00ff00";
            }

            // Draw player scoring information
            that.ctx.fillText("Player " + player.playerNum + ": " + player.score, 1100, 50 * (player.playerNum + 1));

            // Draw player name
            that.ctx.fillText("Player " + player.playerNum, player.x, player.y - 50);

            // Draw Multi Jump Power Up Status
            if (player.multiJumpCounter > 0) {
                that.ctx.font = "12px Comic Sans MS";
                that.ctx.fillStyle = "#0000ff";
                that.ctx.fillText("Multi-Jumps: " + player.multiJumpCounter, player.x, player.y - 25);
            }
        });

        /** Draw Timers (if necessary) **/

        // Timer for game start countdown
        if (this.gameStarted && this.startTime > Date.now()) {
            that.ctx.font = "30px Comic Sans MS";
            that.ctx.fillStyle = "#ff0000";
            that.ctx.fillText("Game Starts In: " + (Math.ceil((this.startTime - Date.now()) / 1000)) + " seconds", 250, 50);
        }

        // Timer for the dropping of a new "main" potato (potato not spawned by a power up) 
        if (this.gameEngine.potatoCreationQueue.length > 0) {
            // We do not need to check for null array elements for the time being since we flush the creationQueue 
            // on every update and if the queue is larger than 0 we are guaranteed an element in position 0. 
            that.ctx.fillText("New Potato In: " + (Math.ceil((this.gameEngine.potatoCreationQueue[0].timeToDrop - Date.now()) / 1000)) + " seconds", 250, 50);
        }

        if (drawCallback) {
            drawCallback(this);
        }

        this.ctx.restore();
    }

    GameWorld.prototype.loop = function () {
        this.gameEngine.update();
        this.draw();
    }
});