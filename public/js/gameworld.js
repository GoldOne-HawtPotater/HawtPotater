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
                if (that.gameEngine.players.size > 1 && that.gameEngine.allIsReady()) {
                    // Randomly choose a map.
                    // Get a random number between 1 and the TileMaps.length - 1
                    that.mapNum = Math.ceil(Math.random() * (Object.getOwnPropertyNames(TileMaps).length - 1) + 1); //Math.floor(Math.random() * (Object.getOwnPropertyNames(TileMaps).length - 1)) + 1;
                    var data = {
                        mapNum: that.mapNum,
                        time: Date.now() + 5000
                    };
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
        } else {
            /** Draw lobby **/
            this.gameMaps[0].drawMap(that.ctx);
        }

        /** Draw random entities **/
        this.gameEngine.entities.forEach(function(entity) {
            entity.draw(that.ctx, that.gameEngine.clockTick);
            // Use a offset so the movement isn't so gittery since potato entitiey changes very quickly.
            var offset = 250;
            that.camxpos.min = that.camxpos.min < entity.x + offset ? that.camxpos.min : entity.x + offset;
            that.camxpos.max = that.camxpos.max > entity.x - offset ? that.camxpos.max : entity.x - offset;
            that.camypos.min = that.camypos.min < entity.y + offset? that.camypos.min : entity.y + offset;
            that.camypos.max = that.camypos.max > entity.y - offset? that.camypos.max : entity.y - offset;
        });


        /** Draw Players **/
        this.gameEngine.players.forEach(function(player) {
            player.draw(that.ctx, that.gameEngine.clockTick);
            that.camxpos.min = that.camxpos.min < player.x ? that.camxpos.min : player.x;
            that.camxpos.max = that.camxpos.max > player.x ? that.camxpos.max : player.x;
            that.camypos.min = that.camypos.min < player.y ? that.camypos.min : player.y;
            that.camypos.max = that.camypos.max > player.y ? that.camypos.max : player.y;
            // Draw scoring information
            that.ctx.font = "20px Georgia";
            that.ctx.fillStyle = "#ff0000";
            that.ctx.fillText("Score: " + player.score, 1100, 50);
        });

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