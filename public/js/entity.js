(function (exports, isClient) { 
    var EntityCollection = {};

    var Entity = function(x, y) {
        this.x = x;
        this.y = y;
        this.removeFromWorld = false;
    }

    Entity.prototype.syncEntity = function(entity) {
        this.x = entity.x;
        this.y = entity.y;
        this.removeFromWorld = entity.removeFromWorld;
    }

    Entity.prototype.update = function () {}

    Entity.prototype.draw = function (ctx) {}

    Entity.prototype.rotateAndCache = function (image, angle) {
        var offscreenCanvas = document.createElement('canvas');
        var size = Math.max(image.width, image.height);
        offscreenCanvas.width = size;
        offscreenCanvas.height = size;
        var offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.save();
        offscreenCtx.translate(size / 2, size / 2);
        offscreenCtx.rotate(angle);
        offscreenCtx.translate(0, 0);
        offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
        offscreenCtx.restore();
        //offscreenCtx.strokeStyle = "red";
        //offscreenCtx.strokeRect(0,0,size,size);
        return offscreenCanvas;
    }

    /** Background Test **/
    function Background() {
        Entity.call(this, 0, 0);
        this.radius = 200;
    }

    Background.prototype = new Entity();
    Background.prototype.constructor = Background;

    Background.prototype.update = function () {
    }

    Background.prototype.draw = function (ctx) {
        ctx.fillStyle = "SaddleBrown";
        ctx.fillRect(0,300,800,300);
        Entity.prototype.draw.call(this);
    }

    /** Hawt Potater Player Class **/
    var HawtPlayer = function(playerObj) {
        // this.animation = new Animation(ASSET_MANAGER.getAsset("./img/RobotUnicorn.png"), 0, 0, 206, 110, 0.02, 30, true, true);
        // this.jumpAnimation = new Animation(ASSET_MANAGER.getAsset("./img/RobotUnicorn.png"), 618, 334, 174, 138, 0.02, 40, false, true);
        if (isClient) {
            this.walkingAnimation = new Animation(ASSET_MANAGER.getAsset('../img/stolen_corgi_walk.png'), 185, 0, 185, 164, 0.225, 2, true, false);
        }
        this.jumping = false;
        this.moving = false;
        this.isReady = (playerObj && playerObj.isReady) ? playerObj.isReady : false;
        this.playerId = playerObj.playerId;
        Entity.call(this, playerObj.playerId * 185, playerObj.playerId * 164);
        // Entity.call(this, 0, 0);
    }

    HawtPlayer.prototype = new Entity();
    HawtPlayer.prototype.constructor = HawtPlayer;

    HawtPlayer.prototype.update = function () {

        Entity.prototype.update.call(this);
    }

    HawtPlayer.prototype.draw = function (ctx, clockTick) {
        this.walkingAnimation.drawFrame(clockTick, ctx, this.x, this.y);
        Entity.prototype.draw.call(this);
    }

    HawtPlayer.prototype.toggleReady = function() {
        this.isReady = !this.isReady;
        console.log('Ready toggled.');
    }

    HawtPlayer.prototype.syncEntity = function(entity) {
        if (entity.playerId == this.playerId) {
            this.isReady = entity.isReady;
            Entity.prototype.syncEntity.call(this, entity);
        }
    }

    // Add entities to the collection.
    EntityCollection.Entity = Entity;
    EntityCollection.HawtPlayer = HawtPlayer;
    EntityCollection.Background = Background;

    // Set the entity collection for our clients/server.
    exports.EntityCollection = EntityCollection;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");