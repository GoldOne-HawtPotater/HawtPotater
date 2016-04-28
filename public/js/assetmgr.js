// function AssetManager() {
//     this.successCount = 0;
//     this.errorCount = 0;
//     this.cache = new Map();
//     this.downloadQueue = [];
// }

// AssetManager.prototype.queueDownload = function (path) {
//     //console.log(path.toString());
//     this.downloadQueue.push(path);
// }

// AssetManager.prototype.isDone = function () {
//     return (this.downloadQueue.length == this.successCount + this.errorCount);
// }
// AssetManager.prototype.downloadAll = function (callback) {
//     for (var i = 0; i < this.downloadQueue.length; i++) {
//         var path = this.downloadQueue[i];
//         var img = new Image();
//         var that = this;
//         img.addEventListener("load", function () {
//             //console.log("dun: " + this.src.toString());
//             that.successCount += 1;
//             if (that.isDone()) { callback(); }
//         });
//         img.addEventListener("error", function () {
//             that.errorCount += 1;
//             if (that.isDone()) { callback(); }
//         });
//         img.src = path;
//         // this.cache[path] = img;
//         this.cache.set(path, img);
//     }
// }

// AssetManager.prototype.getAsset = function(path){
//     //console.log(path.toString());
//     // return this.cache[path];
//     return this.cache.get(path);
// }


/** Use this asset manager when we switch sprites.
**/
function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    if (this.downloadQueue.length === 0) window.setTimeout(callback, 100);
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path){
    //console.log(path.toString());
    return this.cache[path];
}

/** Example of how to add assets to our asset manager.
// Add the assets
var numberOfFrames = 28;
for (var i = 0; i < numberOfFrames; i++) {
    ASSET_MANAGER.queueDownload('./images/pinkbean/attack1.info.areaWarning_' + i + '.png');
}
numberOfFrames = 27;
for (var i = 0; i < numberOfFrames; i++) {
    ASSET_MANAGER.queueDownload('./images/pinkbean/attack1_' + i + '.png');
}
numberOfFrames = 8;
for (var i = 0; i < numberOfFrames; i++) {
    ASSET_MANAGER.queueDownload('./images/pinkbean/move_' + i + '.png');
}
numberOfFrames = 6;
for (var i = 0; i < numberOfFrames; i++) {
    ASSET_MANAGER.queueDownload('./images/pinkbean/stand_' + i + '.png');
}numberOfFrames = 58;
for (var i = 0; i < numberOfFrames; i++) {
    ASSET_MANAGER.queueDownload('./images/pinkbean/die1_' + i + '.png');
}
ASSET_MANAGER.queueDownload('./images/back_3.png');
ASSET_MANAGER.queueDownload('./images/pinkbean/hit1_0.png');
**/

/** Example of an entity 
    // Create the pink bean
    var pinkEntity = new Entity(gameboard, 400, 600);
    pinkEntity.standing = true;
    pinkEntity.movingLeft = false;
    pinkEntity.movingRight = false;
    pinkEntity.attacking = false;
    pinkEntity.dead = false;
    pinkEntity.hurt = false;
    pinkEntity.runningTime = 0;
    pinkEntity.lastDirection = 1; // 1 for left, -1 for right.
    pinkEntity.standingAnimation = new Animation(('./images/pinkbean/stand'), 6, 120/1000, true);
    pinkEntity.moveAnimation = new Animation(('./images/pinkbean/move'), 8, 120/1000, true);
    pinkEntity.attack1Animation = new Animation(('./images/pinkbean/attack1'), 27, 120/1000, true);
    pinkEntity.attack1AnimationEffects = new Animation(('./images/pinkbean/attack1.info.areaWarning'), 28, 120/1000, true);
    pinkEntity.dieAnimation = new Animation(('./images/pinkbean/die1'), 58, 150/1000, true);
    pinkEntity.damageAnimation = new Animation(('./images/pinkbean/hit1_0'), 1);
    pinkEntity.draw = function (ctx, clockTick) {
        // Reset the animations if they're not running. 
        if (!this.standing) this.standingAnimation.reset();
        if (!this.movingLeft && !this.movingRight) this.moveAnimation.reset();
        if (!this.attacking) { 
            this.attack1Animation.reset();
            this.attack1AnimationEffects.reset();
        }

        // Play the current animation
        if (this.standing) {
            this.standingAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.lastDirection);
        } else if (this.movingLeft) {
            this.moveAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.lastDirection);
        } else if (this.movingRight) {
            this.moveAnimation.drawFrame(clockTick, ctx, this.x, this.y, this.lastDirection);
        } else if (this.attacking) {
            this.attack1AnimationEffects.drawFrame(clockTick, ctx, 0, -90);
            this.attack1Animation.drawFrame(clockTick, ctx, 548, 485, this.lastDirection);
        } else if (this.hurt) {
            this.damageAnimation.drawImage(ctx, this.x, this.y);
        } else if (this.dead) {
            this.dieAnimation.drawFrame(clockTick, ctx, this.x, this.y);
        }
    };
    pinkEntity.update = function (clockTick) {
        this.runningTime += clockTick;
        if (this.runningTime < 2) {
            this.standing = true;
            this.hurt = this.dead = this.movingRight = this.movingLeft = this.attacking = false;
        } else if (this.runningTime < 4) {
            this.lastDirection = 1;
            this.movingLeft = true;
            this.hurt = this.dead = this.movingRight = this.standing = this.attacking = false;
            this.x -= 2;
        } else if (this.runningTime < 5) {
            this.standing = true;
            this.hurt = this.dead = this.movingRight = this.movingLeft = this.attacking = false;
        } else if (this.runningTime < 7) {
            this.lastDirection = -1;
            this.movingRight = true;
            this.hurt = this.dead = this.movingLeft = this.standing = this.attacking = false;
            this.x += 2;
        } else if (this.runningTime < 10) {
            this.attacking = true;
            this.hurt = this.dead = this.movingLeft = this.standing = this.movingRight = false;
        } else if (this.runningTime < 11) {
            this.hurt = true;
            this.dead = this.attacking = this.movingLeft = this.standing = this.movingRight = false;
        } else if (this.runningTime < 19.7) {
            this.dead = true;
            this.hurt = this.attacking = this.movingLeft = this.standing = this.movingRight = false;
        } else {
            this.runningTime = 0;
        }
    };
**/