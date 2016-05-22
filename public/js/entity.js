(function (exports, isClient) { 
    var EntityCollection = {};
    EntityCollection.GameCharacters = {
            HawtDogge: 0,
            HawtSheep: 1,
            HawtChicken: 2,
            HawtPig: 3
        };

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

    Entity.prototype.update = function() {
    }

    Entity.prototype.draw = function() {
    }

    Entity.prototype.rotateAndCache = function(image, angle) {
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
    
    /** Background **/
    function Background() {
        Entity.call(this, -800, -700);
    }

    Background.prototype = new Entity();
    Background.prototype.constructor = Background;

    Background.prototype.update = function () {
    }

    Background.prototype.draw = function(ctx) {
        ctx.drawImage(ASSET_MANAGER.getAsset("../img/clouds_highres.png"), -500, -400/*-1100*/);
    }

    // Moving platforms
    function MovingPlatform(x, y, data) {
        this.tileset = data.tileset;
        this.tiles = data.tiles;
        var type = [];
        if (data.type.indexOf('-') >= 0) {
            type = data.type.split('-');
            this.directionValue = -1;
        } else {
            type = data.type.split('+');
            this.directionValue = 1;
        }
        this.direction = type[0];
        this.offsetReset = type[1];
        this.offset = type[1];
        this.speed = (type.length > 3) ? type[2] : 1;
        this.delay = (type.length > 4) ? type[3] : 0;
        this.tileHeight = this.tileset.tileheight;
        this.tileWidth = this.tileset.tilewidth;

        Entity.call(this, x, y);
    }

    MovingPlatform.prototype = new Entity();
    MovingPlatform.prototype.constructor = MovingPlatform;

    MovingPlatform.prototype.update = function () {

    }

    MovingPlatform.prototype.draw = function (ctx) {
        var spriteSheet = ASSET_MANAGER.getAsset(this.tileset.image);
        var tileHeight = this.tileHeight;
        var tileWidth = this.tileWidth;
        var tileset = this.tileset;

        for (var i = 0; i < this.tiles.length; i++) {
            var xindex = (this.tiles[i]-1) % tileset.columns;
            var yindex = Math.floor((this.tiles[i]-1) / tileset.columns);
            ctx.drawImage(spriteSheet,
                          xindex * tileWidth, yindex * tileHeight,  // source from sheet
                          tileWidth, tileHeight,
                          this.x + i * tileWidth - tileWidth*1.5, this.y - tileHeight/2,
                          tileWidth, tileHeight
                          );
        }
    }

    /** Power Up Class **/
    var PowerUp = function(x, y) {
        this.rotation = 0;
        Entity.call(this, x, y, Date.now());
    }

    PowerUp.prototype = new Entity();
    PowerUp.prototype.constructor = MultiJumpPowerUp;

    PowerUp.prototype.update = function () {
        Entity.prototype.update.call(this);
    }

    PowerUp.prototype.draw = function(ctx, clockTick) {
        // ctx, x, y, flipH, flipV
        this.sprite.drawImage(ctx, this.x, this.y);
    }

    PowerUp.prototype.processCollision = function(data) {
        // Power Up has collided with a Player
        // Add this Power Up to the graveyard for deletion and grant the Player the Power
        if (data.objectCollided.type == "PLAYER") {
            data.gameEngine.graveyard.push({ entityId: this.id });
            this.givePower({ gameEngine: data.gameEngine, playerId: data.objectCollided.id });
        }
    }

    PowerUp.prototype.givePower = function () {

    }

    PowerUp.prototype.syncEntity = function (entity) {
        Entity.prototype.syncEntity.call(entity);
        this.rotation = entity.rotation;
    }


    /** Multi-Jump Power Up Class **/
    var MultiJumpPowerUp = function(powerUpData) {
        if (isClient) {
            this.sprite = new Animation(('../img/powerups/jump'), 1);
        }
        this.width = 64;
        this.height = 64;
        PowerUp.call(this, powerUpData.x, powerUpData.y);
    }

    MultiJumpPowerUp.prototype = new PowerUp();
    MultiJumpPowerUp.prototype.constructor = MultiJumpPowerUp;

    MultiJumpPowerUp.prototype.update = function() {
        Entity.prototype.update.call(this);
    }

    MultiJumpPowerUp.prototype.draw = function(ctx, clockTick) {
        // ctx, x, y, flipH, flipV
        this.sprite.drawImage(ctx, this.x, this.y);
    }

    MultiJumpPowerUp.prototype.givePower = function(data) {
        data.gameEngine.players.get(data.playerId).multiJumpCounter += 10;
        PowerUp.prototype.givePower.call(this);
    }

    MultiJumpPowerUp.prototype.syncEntity = function(entity) {
        Entity.prototype.syncEntity.call(entity);
        this.rotation = entity.rotation;
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

    Platform.prototype.update = function() {
    }

    Platform.prototype.draw = function(ctx) {
    }

    /** Hawt Potater Player Class **/
    var HawtPlayer = function(playerObj, width, height) {
        // this.moveSpeed = 200;
        this.character = playerObj.character;
        this.isJumping = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.direction = (playerObj && playerObj.direction) ? playerObj.direction : 1;
        this.score = 0;
        this.multiJumpCounter = playerObj.multiJumpCounter ? playerObj.multiJumpCounter : 0;
        this.attackSteps = 0;
        this.dodgeDuration = 1000;
        this.canDodge = true;
        this.dodgeResetTimer;
        this.dodgeCooldownTimer;
        this.dodgeCooldown = 3000;
        // this.moveSpeed = 200;
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

    HawtPlayer.prototype.processCollision = function(data) {
  
    }

    HawtPlayer.prototype.toggleReady = function() {
        this.isReady = !this.isReady;
        console.log('Ready toggled.');
    }

    HawtPlayer.prototype.switchCharacter = function() {
        this.character = (this.character + 1) % 4;
        console.log("Character switched to: " + this.character);
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
            this.jumpingAnimation = new Animation(('../img/animals/dog/jump'), 4, 50, false);
        }
        // playerObj.width = 83;
        // playerObj.height = 52;

        this.body = playerObj.body;

        playerObj.character = EntityCollection.GameCharacters['HawtDogge'];
        HawtPlayer.call(this, playerObj);
    }

    HawtDogge.prototype = new HawtPlayer({width: 83, height: 52, character: EntityCollection.GameCharacters['HawtDogge']});
    HawtDogge.prototype.constructor = HawtDogge;
    
    HawtDogge.prototype.draw = function(ctx, clockTick) {
        // Reset the animations if they're not running. 
        if (!this.isMovingLeft && !this.isMovingRight) this.walkingAnimation.reset();

        // Play the correct animation
        // Image is originally left we need to multiply by -1. (-1 = left, 1 = right). 
        // var direction = 1;
        // if (this.isMovingLeft) direction = -1;
        // if (this.isMovingRight) direction = 1;
        if (this.isJumping) {
            this.jumpingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction * -1);
        } else if (this.isMovingLeft || this.isMovingRight) {
            this.walkingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        } else {
            this.standingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        }
        // HawtPlayer.prototype.draw.call(this, ctx, clockTick);
    }

    var HawtSheep = function(playerObj) {
        if (isClient) {
            this.standingAnimation = new Animation(('../img/animals/sheep/stand'), 4, 180, true);
            this.walkingAnimation = new Animation(('../img/animals/sheep/move'), 3, 180, true);
            this.jumpingAnimation = new Animation(('../img/animals/sheep/jump'), 3, 80, false);
        }
        // playerObj.width = 91;
        // playerObj.height = 60;
        playerObj.character = EntityCollection.GameCharacters['HawtSheep'];
        HawtPlayer.call(this, playerObj);
    }

    HawtSheep.prototype = new HawtPlayer({width: 91, height: 60, character: EntityCollection.GameCharacters['HawtSheep']});

    HawtSheep.prototype.constructor = HawtSheep;

    HawtSheep.prototype.draw = function (ctx, clockTick) {
        // Reset the animations if they're not running. 
        if (!this.isMovingLeft && !this.isMovingRight) this.walkingAnimation.reset();

        // Play the correct animation
        if (this.isJumping) {
            this.jumpingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction * -1);
        } else if (this.isMovingLeft || this.isMovingRight) {
            this.walkingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        } else {
            this.standingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        }
    }

    var HawtChicken = function(playerObj) {
        if (isClient) {
            this.standingAnimation = new Animation(('../img/animals/chicken/stand'), 4, 150, true);
            this.walkingAnimation = new Animation(('../img/animals/chicken/move'), 3, 150, true);
            this.jumpingAnimation = new Animation(('../img/animals/chicken/jump'), 3, 80, false);
        }
        playerObj.character = EntityCollection.GameCharacters['HawtChicken'];
        HawtPlayer.call(this, playerObj);
    }

    HawtChicken.prototype = new HawtPlayer({width: 73, height: 77, character: EntityCollection.GameCharacters['HawtChicken']});

    HawtChicken.prototype.constructor = HawtChicken;

    HawtChicken.prototype.draw = function (ctx, clockTick) {
        // Reset the animations if they're not running. 
        if (!this.isMovingLeft && !this.isMovingRight) this.walkingAnimation.reset();

        // Play the correct animation
        if (this.isJumping) {
            this.jumpingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction * -1);
        } else if (this.isMovingLeft || this.isMovingRight) {
            this.walkingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        } else {
            this.standingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        }
    }

    var HawtPig = function(playerObj) {
        if (isClient) {
            this.standingAnimation = new Animation(('../img/animals/pig/stand'), 3, 150, true);
            this.walkingAnimation = new Animation(('../img/animals/pig/move'), 2, 100, true);
            this.jumpingAnimation = new Animation(('../img/animals/pig/jump'), 3, 80, false);
        }
        playerObj.character = EntityCollection.GameCharacters['HawtPig'];
        HawtPlayer.call(this, playerObj);
    }

    HawtPig.prototype = new HawtPlayer({width: 67, height: 61, character: EntityCollection.GameCharacters['HawtPig']});

    HawtPig.prototype.constructor = HawtPig;

    HawtPig.prototype.draw = function (ctx, clockTick) {
        // Reset the animations if they're not running. 
        if (!this.isMovingLeft && !this.isMovingRight) this.walkingAnimation.reset();

        // Play the correct animation
        if (this.isJumping) {
            this.jumpingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction * -1);
        } else if (this.isMovingLeft || this.isMovingRight) {
            this.walkingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        } else {
            this.standingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.direction*-1);
        }
    }



    function Potato(potatoData) {
        if (isClient) {
            this.sprite = new Animation(('../img/new_potato'), 1);
        }
        this.width = 60;
        this.height = 50;
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

    Potato.prototype.processCollision = function(data) {
        if (data.objectCollided.type == "PLAYER") {
            data.gameEngine.players.get(data.objectCollided.id).score += 1;
        } else if (data.objectCollided.type == "PLATFORM" && this.y >= 100) {
            data.gameEngine.graveyard.push({ entityId: this.id });

            // Uncomment the following line to spawn a new potato in a random spot on respawn
            // data.gameEngine.potatoCreationQueue.push({ x: Math.random() * (1100 - 200) + 200, y: 25, time: Date.now(), timeToDrop: Date.now() + 3000 });

            data.gameEngine.potatoCreationQueue.push({ x: 550, y: 25, time: Date.now(), timeToDrop: Date.now() + 3000 });
        }
    }

    // Add entities to the collection.
    EntityCollection.Entity = Entity;
    EntityCollection.MultiJumpPowerUp = MultiJumpPowerUp;
    EntityCollection.HawtPlayer = HawtPlayer;
    EntityCollection.Background = Background;
    EntityCollection.Potato = Potato;
    EntityCollection.HawtDogge = HawtDogge;
    EntityCollection.MovingPlatform = MovingPlatform;
    EntityCollection.HawtSheep = HawtSheep;
    EntityCollection.HawtChicken = HawtChicken;
    EntityCollection.HawtPig = HawtPig;

    // Set the entity collection for our clients/server.
    exports.EntityCollection = EntityCollection;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");