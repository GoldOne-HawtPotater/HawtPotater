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
        // this.surfaceWidth = 1280;
        // this.surfaceHeight = 720;
        this.startTime = null;
        this.roomMasterWorld = false;
        this.ctx = null;
        this.camxpos = {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
        this.camypos = {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};

        this.debug = true;
    }
    window.GameWorld = GameWorld;

    GameWorld.prototype.init = function (ctx) {
        this.ctx = ctx;
        this.camera = new Camera(ctx);

        // Add the maps to gameMaps array
        // this.lobbyMap = new MapCreator(ASSET_MANAGER.getAsset("../img/platforms/map_spritesheet_01.png"), TileMaps['map01']);
        this.gameMaps = [];
        for (key in TileMaps) {
            this.gameMaps.push(new MapCreator(ASSET_MANAGER.getAsset("../img/platforms/map_spritesheet_01.png"), TileMaps[key]));
        }


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
                    console.log('Map number chosen = ' + that.mapNum);

                    var setStartTime = Date.now() + 5000;
                    var setEndTime = Date.now() + 35000;
                    that.startTime = setStartTime;
                    //var setEndTime = Date.now() + 300000;

                    var data = {
                        theFunc: 'setGame',
                        mapNum: that.mapNum,
                        time: setStartTime,
                        endTime: setEndTime
                    };


                    socket.emit('server_update', data);
                    // that.gameEngine.setGame(data);
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
        this.camera.begin();
        // this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        // this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // this.ctx.save();
                                          
        if (this.camxpos.min && this.camxpos.max && this.camypos.min && this.camypos.max) {
            var minPosition = {x: this.camxpos.min, y: this.camypos.min};
            var maxPosition = {x: this.camxpos.max, y: this.camypos.max};

            var centerPosition = {
                x: (minPosition.x + maxPosition.x) / 2,
                y: (minPosition.y + maxPosition.y) / 2
            };

            this.camera.moveTo(centerPosition.x, centerPosition.y);
            // 1000 is the default zoom. 
            this.camera.zoomTo(1000 * (1 + (maxPosition.x - minPosition.x)/this.ctx.canvas.width) + (maxPosition.y - minPosition.y)/this.ctx.canvas.height);
            

            // Reset the positions
            this.camxpos = {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
            this.camypos = {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
        }

        if (this.debug) {
            // b2d debug
            this.gameEngine.b2dWorld.DrawDebugData();
            this.gameEngine.b2dWorld.ClearForces();    
        }

        if (this.gameEngine.myGameState != this.gameEngine.gameStates.waiting) {
            /** Draw map **/
            this.gameMaps[this.mapNum-1].drawMap(that.ctx);
            this.gameEngine.movingPlatforms.forEach(function (platform) {
                platform.draw(that.ctx, that.gameEngine.clockTick);
            });
        } else {
            /** Draw lobby **/
            this.gameMaps[0].drawMap(that.ctx);
            this.ctx.font = "20px Comic Sans MS";
            this.ctx.fillStyle = "#ff0000";
            var position = this.camera.screenToWorld(400, 50);
            this.ctx.fillText("Lobby Mode", position.x, position.y);
            this.ctx.font = "14px Comic Sans MS"
            position = this.camera.screenToWorld(400, 100);
            this.ctx.fillText("Waiting for all Players to be Ready", position.x, position.y);
        }

        this.ctx.font = "20px Comic Sans MS";
        this.ctx.fillStyle = "#ff0000";        
        var position = this.camera.screenToWorld(1100, 50);
        this.ctx.fillText("Scoreboard: ", position.x, position.y);

        /** Draw random entities **/
        this.gameEngine.entities.forEach(function(entity) {
            entity.draw(that.ctx, that.gameEngine.clockTick);
            // Use a offset so the movement isn't so gittery since potato entitiey changes very quickly.
            var offset = 250;
            // that.camxpos.min = that.camxpos.min < entity.x + offset ? that.camxpos.min : entity.x + offset;
            // that.camxpos.max = that.camxpos.max > entity.x - offset ? that.camxpos.max : entity.x - offset;
            // that.camypos.min = that.camypos.min < entity.y + offset? that.camypos.min : entity.y + offset;
            // that.camypos.max = that.camypos.max > entity.y - offset? that.camypos.max : entity.y - offset;
        });

        /** Draw Players **/
        this.gameEngine.players.forEach(function(player) {
            player.draw(that.ctx, that.gameEngine.clockTick);
            if (player.isReady) {
                that.ctx.fillStyle = "#00ff00";
            } else {
                that.ctx.fillStyle = "#ff0000";
            }

            // Draw player scoring information
            var position = that.camera.screenToWorld(1100, 50 * (player.playerNum + 1));
            that.ctx.fillText("Player " + player.playerNum + ": " + player.score, position.x, position.y);

            // Draw player name
            that.ctx.fillText("Player " + player.playerNum, player.x, player.y - 50);

            // Draw Multi Jump Power Up Status
            if (player.multiJumpCounter > 0) {
                that.ctx.font = "12px Comic Sans MS";
                that.ctx.fillStyle = "#0000ff";
                that.ctx.fillText("Multi-Jumps: " + player.multiJumpCounter, player.x, player.y - 25);
            }
            that.camxpos.min = that.camxpos.min < player.x ? that.camxpos.min : player.x;
            that.camxpos.max = that.camxpos.max > player.x ? that.camxpos.max : player.x;
            that.camypos.min = that.camypos.min < player.y ? that.camypos.min : player.y;
            that.camypos.max = that.camypos.max > player.y ? that.camypos.max : player.y;
        });

        /** Draw Timers (if necessary) **/

        // Timer for game start countdown and match timer
        if (this.gameEngine.myGameState == this.gameEngine.gameStates.settingup) {
                that.ctx.font = "30px Comic Sans MS";
                that.ctx.fillStyle = "#ff0000";
                var position = that.camera.screenToWorld(350, 50); 
                that.ctx.fillText("Game Starts In: " + (Math.ceil((this.startTime - Date.now()) / 1000)) + " seconds", position.x, position.y);
        } else if (this.gameEngine.myGameState == this.gameEngine.gameStates.playing) {
        	    that.ctx.font = "25px Comic Sans MS";
                that.ctx.fillStyle = "#000000";
                var position = that.camera.screenToWorld(540, 25);
                that.ctx.fillText("Time Left: " + (Math.ceil((this.gameEngine.endGameTime - Date.now()) / 1000)) + " seconds", position.x, position.y);
        }


        // Timer for the dropping of a new "main" potato (potato not spawned by a power up) 
        if (this.gameEngine.potatoCreationQueue.length > 0) {
            // We do not need to check for null array elements for the time being since we flush the creationQueue 
            // on every update and if the queue is larger than 0 we are guaranteed an element in position 0. 
            var position = that.camera.screenToWorld(250, 70);
            that.ctx.fillText("New Potato In: " + (Math.ceil((this.gameEngine.potatoCreationQueue[0].timeToDrop - Date.now()) / 1000)) + " seconds", position.x, position.y);
        }

        if (drawCallback) {
            drawCallback(this);
        }

        // this.ctx.restore();     
        this.camera.end();   
    }

    GameWorld.prototype.loop = function () {
        this.gameEngine.update();
        this.draw();
    }
});