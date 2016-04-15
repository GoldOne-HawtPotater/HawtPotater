(function (exports) {
    var Entity = function(gameworld, x, y, playerId) {
        this.gameworld = gameworld;
        this.x = x;
        this.y = y;
        this.removeFromWorld = false;
        this.isReady = false;
        this.playerId = playerId;
    }

    Entity.prototype.toggleReady = function() {
        this.isReady = !this.isReady;
    }

    Entity.prototype.update = function () {
    }

    Entity.prototype.draw = function (ctx) {
        if (this.gameworld.showOutlines && this.radius) {
            ctx.beginPath();
            ctx.strokeStyle = "green";
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.stroke();
            ctx.closePath();
        }
    }

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
    exports.Entity = Entity;
})(typeof global === "undefined" ? window : exports);