// function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
//     this.spriteSheet = spriteSheet;
//     this.startX = startX;
//     this.startY = startY;
//     this.frameWidth = frameWidth;
//     this.frameDuration = frameDuration;
//     this.frameHeight = frameHeight;
//     this.frames = frames;
//     this.totalTime = frameDuration * frames;
//     this.elapsedTime = 0;
//     this.loop = loop;
//     this.reverse = reverse;
// }

// Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
//     var scaleBy = scaleBy || 1;
//     this.elapsedTime += tick;
//     if (this.loop) {
//         if (this.isDone()) {
//             this.elapsedTime = 0;
//         }
//     } else if (this.isDone()) {
//         return;
//     }
//     var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
//     var vindex = 0;
//     if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
//         index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
//         vindex++;
//     }
//     while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
//         index -= Math.floor(this.spriteSheet.width / this.frameWidth);
//         vindex++;
//     }

//     var locX = x;
//     var locY = y;
//     var offset = vindex === 0 ? this.startX : 0;
//     ctx.drawImage(this.spriteSheet,
//                   index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
//                   this.frameWidth, this.frameHeight,
//                   locX, locY,
//                   this.frameWidth * scaleBy,
//                   this.frameHeight * scaleBy);
// }

// Animation.prototype.currentFrame = function () {
//     return Math.floor(this.elapsedTime / this.frameDuration);
// }

// Animation.prototype.isDone = function () {
//     return (this.elapsedTime >= this.totalTime);
// }

/** Use this Animation when we switch sprites. (Look inside assetmgr.js for more Animation/Asset code and examples.)

**/

function Animation(spriteSheetName, frames, frameDuration, loop, reverse) {
    this.spriteSheetName = spriteSheetName;
    this.frameDuration = frameDuration / 1000;
    this.frames = frames;
    this.totalTime = this.frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, flipH, flipV) {
    var scaleH = flipH ? flipH : 1, // Set horizontal scale to -1 if flip horizontal
        scaleV = flipV ? flipV : 1; // Set verical scale to -1 if flip vertical
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.reset();
        }
    } else if (this.isDone()) {
        return;
    }

    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var image = ASSET_MANAGER.getAsset(this.spriteSheetName + '_' + index + '.png');

    if (scaleH < 0) x += image.width;
    if (scaleV < 0) y += image.height;

    //ctx.scale(scaleH, scaleV);
    ctx.save();
    ctx.scale(scaleH, scaleV);
    ctx.drawImage(image, x * scaleH, y * scaleV);
    ctx.restore();
}

Animation.prototype.drawImage = function (ctx, x, y, flipH, flipV) {
    var scaleH = flipH ? flipH : 1, // Set horizontal scale to -1 if flip horizontal
        scaleV = flipV ? flipV : 1; // Set verical scale to -1 if flip vertical

    if (scaleH < 0) x += image.width;
    if (scaleV < 0) y += image.height;
    
    ctx.scale(scaleH, scaleV);
    ctx.drawImage(ASSET_MANAGER.getAsset(this.spriteSheetName + '.png'), x, y);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
}

Animation.prototype.reset = function () {
    this.elapsedTime = 0;
}