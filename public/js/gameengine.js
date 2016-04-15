// The game engine code.
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function GameEngine() {
    this.entities = [];
    this.players = [];
    this.ctx = null;
    this.gameworld = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.playerId = null;
    this.gameIsPlaying = null;
}

GameEngine.prototype.init = function (ctx, gw, playerId) {
    this.ctx = ctx;
    this.gameworld = gw;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.playerId = playerId;
    this.gameIsPlaying = false;

    console.log('game engine initialized');
}

GameEngine.prototype.start = function () {
    console.log("start the game engine loop");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startTheGame = function() {
    this.gameIsPlaying = true;
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
    }, false);

    /** Set up the key listeners **/

    // Listen to the window (should change to canvas?)
    // Move to game engine.
    $(window).keydown(function(e) {
       var key = e.which;
       switch(key) {
            case 37: //left
            case 38: //up
            case 39: //right
            case 40: //down
                var data = {
                    theFunc: 'move',
                    playerId: that.playerId,
                    direction: key
                };
                socket.emit('update_gameworld', data);
                that.gameworld.move(data);
                break;
            case 13: // {ENTER}
                gameworld.toggleReady(that.playerId);
                break;
       }
    });

    $(window).keyup(function(e) {
       var key = e.which; 
       switch(key) {
            case 37: //left
                break;
            case 38: //up
                break;
            case 39: //right
                break;
            case 40: //down
                break;
       }
    });

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.addPlayer = function (data) {
    this.players[data.playerId] = new Entity(this, 50, 50, data.playerId);
    console.log('Player ' + data.playerId + ' has been added.');
}

GameEngine.prototype.removePlayer = function (data) {
    this.players.pop(data.playerId);
    console.log('Player ' + data.playerId + ' has been removed.');
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.update();
    this.draw();
    this.click = null;
    this.wheel = null;
}