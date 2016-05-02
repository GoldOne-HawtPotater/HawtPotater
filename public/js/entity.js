(function (exports, isClient) { 
    var EntityCollection = {};

    var Entity = function(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
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

    /** Platforms **/
    function Platform(platformObj) {
        this.data = platformObj.data;
        this.height = platformObj.height;
        this.width = platformObj.width;
        this.x = platformObj.x;
        this.y = platformObj.y;
    }

    Platform.prototype = new Entity();
    Platform.prototype.constructor = Background;

    Platform.prototype.update = function () {
    }

    Platform.prototype.draw = function (ctx) {
    }

    /** Hawt Potater Player Class **/
    var HawtPlayer = function(playerObj, width, height) {
        // this.moveSpeed = 200;
        this.isJumping = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.direction = 1;
        this.width = playerObj.width;
        this.height = playerObj.height;
        this.isReady = (playerObj && playerObj.isReady) ? playerObj.isReady : false;
        this.playerId = playerObj.playerId;
        Entity.call(this, playerObj.x, playerObj.y, playerObj.playerId);
    }

    HawtPlayer.prototype = new Entity();
    HawtPlayer.prototype.constructor = HawtPlayer;

    HawtPlayer.prototype.update = function () {}
    HawtPlayer.prototype.draw = function (ctx, clockTick) {}

    HawtPlayer.prototype.toggleReady = function() {
        this.isReady = !this.isReady;
        console.log('Ready toggled.');
    }

    HawtPlayer.prototype.syncEntity = function(entity) {
        if (entity.playerId == this.playerId) {
            this.isReady = entity.isReady;
            this.isJumping = entity.isJumping;
            this.isMovingLeft = entity.isMovingLeft;
            this.isMovingRight = entity.isMovingRight;
            this.direction = entity.direction;
            Entity.prototype.syncEntity.call(this, entity);
        }
    }

    var HawtDogge = function(playerObj) {
        if (isClient) {
            this.standingAnimation = new Animation(('../img/animals/dog/stand'), 15, 120, true);
            this.walkingAnimation = new Animation(('../img/animals/dog/move'), 6, 120, true);
        }
        playerObj.width = 83;
        playerObj.height = 52;
        HawtPlayer.call(this, playerObj);
    }

    HawtDogge.prototype = new HawtPlayer({
        width: 83,
        height: 52
    });

    HawtDogge.prototype.constructor = HawtDogge;

    HawtDogge.prototype.draw = function (ctx, clockTick) {
        // Reset the animations if they're not running. 
        if (!this.isMovingLeft && !this.isMovingRight) this.walkingAnimation.reset();

        // Play the correct animation
        // Image is originally left we need to multiply by -1. (-1 = left, 1 = right). 
        // var direction = 1;
        // if (this.isMovingLeft) direction = -1;
        // if (this.isMovingRight) direction = 1;
        if (this.isMovingLeft || this.isMovingRight) {
            this.walkingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        } else {
            this.standingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        }
        // HawtPlayer.prototype.draw.call(this, ctx, clockTick);
    }

    var Potato = function(potatoData) {
        if (isClient) {
            this.sprite = new Animation(('../img/potato'), 1);
        }
        this.width = 30;
        this.height = 27;
        this.rotation = 0;
        this.velocity = null;
        Entity.call(this, potatoData.x, potatoData.y, potatoData.id);
    }

    Potato.prototype = new Entity();
    Potato.prototype.constructor = Potato;

    Potato.prototype.update = function() {
        Entity.prototype.update.call(this);
    }

    Potato.prototype.draw = function(ctx, clockTick) {
        // ctx, x, y, flipH, flipV
        this.sprite.drawImage(ctx, this.x, this.y);
    }

    Potato.prototype.syncEntity = function(entity) {
        Entity.prototype.syncEntity.call(this, entity);
        this.rotation = entity.rotation;
        this.velocity = entity.velocity;
    }

    // Add entities to the collection.
    EntityCollection.Entity = Entity;
    EntityCollection.HawtPlayer = HawtPlayer;
    EntityCollection.Background = Background;
    EntityCollection.Potato = Potato;
    EntityCollection.HawtDogge = HawtDogge;

    // Set the entity collection for our clients/server.
    exports.EntityCollection = EntityCollection;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");