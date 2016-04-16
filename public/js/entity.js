(function (exports) {
    var Entity = function(x, y, playerId, player) {
        this.x = x;
        this.y = y;
        this.removeFromWorld = player ? player.removeFromWorld : false;
        this.isReady = player ? player.isReady : false;
        this.playerId = playerId;
    }

    Entity.prototype.syncEntity = function(entity) {
        if (entity.playerId == this.playerId) {
            this.x = entity.x;
            this.y = entity.y;
            this.removeFromWorld = entity.removeFromWorld;
            this.isReady = entity.isReady;
        }
    }

    Entity.prototype.toggleReady = function() {
        this.isReady = !this.isReady;
        console.log('Ready toggled.');
    }

    Entity.prototype.update = function () {
    }

    Entity.prototype.draw = function (ctx) {

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