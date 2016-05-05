

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
        (function gameLoop() {
            that.loop();
            window.requestAnimFrame(gameLoop);
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
        }

        /** Draw random entities **/
        this.gameEngine.entities.forEach(function(entity) {
            entity.draw(that.ctx, that.gameEngine.clockTick);
        });
        /** Draw Players **/
        this.gameEngine.players.forEach(function(player) {
            player.draw(that.ctx, that.gameEngine.clockTick);

            // Draw scoring information
            that.ctx.font = "20px Georgia";
            that.ctx.fillStyle = "#ff0000";
            that.ctx.fillText("Score: " + player.score, 1100, 50);
        });

        if (drawCallback) {
            drawCallback(this);
        }

        this.ctx.restore();
    }

    GameWorld.prototype.loop = function () {
        if (this.roomMasterWorld) socket.emit('update_gameengine');
        this.gameEngine.update();
        this.draw();
    }
});