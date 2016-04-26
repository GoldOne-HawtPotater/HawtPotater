

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
    

    function Timer() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
        this.counter = 0;
    }

    Timer.prototype.tick = function () {
        this.counter++;
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;

        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    }

    /** Gameworld Class **/

    var GameWorld = function () {
        this.gameEngine = new GameEngine();
        this.surfaceWidth = 1280;
        this.surfaceHeight = 720;
        this.gameStarted = false;
        this.ctx = null;

        this.debug = true;
    }
    window.GameWorld = GameWorld;

    GameWorld.prototype.init = function (ctx) {
        this.ctx = ctx;

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

        this.timer = new Timer();
    }

    GameWorld.prototype.startTheGame = function (data) {
        this.gameStarted = !this.gameStarted;
        while(Date.now() < data.time);
    }


    GameWorld.prototype.start = function () {
        console.log("start the game world loop");
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

        // b2d debug
        this.gameEngine.b2dWorld.DrawDebugData();
        this.gameEngine.b2dWorld.ClearForces();

        /** Draw random entities **/
        this.gameEngine.entities.forEach(function(entity) {
            entity.draw(that.ctx, that.clockTick);
        });
        /** Draw Players **/
        this.gameEngine.players.forEach(function(player) {
            player.draw(that.ctx, that.clockTick);
        });
        if (drawCallback) {
            drawCallback(this);
        }

        this.ctx.restore();
    }

    GameWorld.prototype.loop = function () {
        this.clockTick = this.timer.tick();
        this.gameEngine.update();
        this.draw();
    }
});