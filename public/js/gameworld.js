(function (exports, isClient) {
    // all physics in here
    // no client code

    /** Set up the functions that we need for the server. **/
    var EntityCollection = isClient ? window.EntityCollection : require('./entity').EntityCollection;
    var Box2D = isClient ? window.Box2D : require('./box2d.js').Box2D;
    var Map = isClient ? window.Map : require('collections/map');
    exports.requestAnimFrame = (function () {
            return isClient ? (window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame) :
                    function (/* function */ callback, /* DOMElement */ element) {
                        setTimeout(callback, 1000 / 60);
                    };
        })();
    if (isClient) {
        

        window.ASSET_MANAGER = new AssetManager();
    }

    function Timer() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
    }

    Timer.prototype.tick = function () {
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;

        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    }

    /** Gameworld Class **/

    var GameWorld = function () {
        this.players = new Map();
        this.playersB2d = new Map();
        this.gameStarted = false;
        this.entities = [];
        this.ctx = null;
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.surfaceWidth = null;
        this.surfaceHeight = null;
        this.SCALE = 150; // 30 pixels to 1 meter
    }

    GameWorld.prototype.init = function (ctx) {
        this.ctx = ctx;
        this.surfaceWidth = 1280;
        this.surfaceHeight = 800;

        // Create a new box2d world
        this.b2dWorld = new Box2D.Dynamics.b2World(
            new Box2D.Common.Math.b2Vec2(0, 10)   // gravity
            , true                                // allow sleeping bodies
        ); 
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;
        // Create the ground
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
        // position the center of the object
        bodyDef.position.x = this.surfaceWidth / 2 / this.SCALE;
        bodyDef.position.y = (this.surfaceHeight / this.SCALE) - 1;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixDef.shape.SetAsBox((this.surfaceWidth / this.SCALE) / 2, 0.5 / 2);
        this.b2dWorld.CreateBody(bodyDef).CreateFixture(fixDef);

        // for (var i = 0; i < 10; i++) {
        //     // Specify a dynamic circle
        //     bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        //     fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(
        //         Math.random() + 0.1 // radius
        //         );
        //     bodyDef.position.x = Math.random() * 25;
        //     bodyDef.position.y = Math.random() * 10;
        //     this.b2dWorld.CreateBody(bodyDef).CreateFixture(fixDef);

        //     // Specify a dynamic rectangle
        //     bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        //     fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        //     fixDef.shape.SetAsBox(
        //           Math.random() + 0.1 // half width
        //         , Math.random() + 0.1 // half height
        //         );
        //     bodyDef.position.x = Math.random() * 25;
        //     bodyDef.position.y = Math.random() * 10;
        //     this.b2dWorld.CreateBody(bodyDef).CreateFixture(fixDef);            
        // }

        if (isClient) {
            //setup debug draw
            var debugDraw = new Box2D.Dynamics.b2DebugDraw();
            debugDraw.SetSprite(this.ctx);
            debugDraw.SetDrawScale(this.SCALE);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
            this.b2dWorld.SetDebugDraw(debugDraw);
        }



        this.timer = new Timer();

        console.log('game world initialized\n');
    }

    GameWorld.prototype.attack = function (playerObj) {}

    GameWorld.prototype.jumpPlayer = function (data) {
        console.log(data.playerId + ' is jumping.');
        if (data) {
            var player = this.players.get(data.playerId);
            var playerBody = this.playersB2d.get(data.playerId);
            // Need to set the airborn flag to true/false to use the correct animation
            // Method 1
            var velocity = playerBody.GetLinearVelocity();
            velocity.y = 20;
            playerBody.SetLinearVelocity(velocity);
            // Method 2 (failed)
            // var jumpForce = new Box2D.Common.Math.b2Vec2(0, 1000);
            // playerBody.ApplyForce(jumpForce, playerBody.GetPosition());
            // Method 3
            // playerBody.SetLinearVelocity(new Box2D.Common.Math.b2Vec2(0, 100 / this.SCALE));
            // Method 4
            // var jumpImpulse = new Box2D.Common.Math.b2Vec2(0, playerBody.GetMass() * 20);
            // playerBody.ApplyImpulse(jumpImpulse, playerBody.GetPosition());
        }
    }

    GameWorld.prototype.dodge = function (playerObj) {}

    GameWorld.prototype.movePlayer = function (data) {
        console.log(data.playerId + ' is moving ' + data.direction + '.');
        if (data && data.direction) {
            var player = this.players.get(data.playerId);
            player.isMoving = data.value;
            switch(data.direction) {
                case 37: //left
                    player.direction = -1;
                    break;
                case 39: //right
                    player.direction = 1;
                    break;
            }
            var playerBody = this.playersB2d.get(data.playerId);
            // playerBody.SetAwake(true);
            // playerBody.ApplyForce(new Box2D.Common.Math.b2Vec2((player.moveSpeed / this.SCALE)), playerBody.GetPosition());
            // playerBody.SetLinearVelocity(new Box2D.Common.Math.b2Vec2((xForce / this.SCALE), playerBody.GetLinearVelocity().y));
        }
    }

    GameWorld.prototype.toggleReady = function (data) {
        this.players.get(data.playerId).isReady ^= true;
        console.log('Player ' + data.playerId + ' is' + (this.players.get(data.playerId).isReady ? ' ' : ' not ') + 'ready.');
    }

    GameWorld.prototype.playersAreReady = function() {
        var ready = true;
        this.players.values().forEach(function (player, index, arr) {
            ready &= player.isReady;
        });
        return ready;
    }

    GameWorld.prototype.callFunc = function (data) {
        if (data && data.theFunc) {
            this[data.theFunc](data);
        } else {
            console.log('data.theFunc is undefined.');
            console.log('GameWorld: ' + data + '\n');
        }
    }

    GameWorld.prototype.addPotato = function (data) {
        // addPotato to game world here
    }

    GameWorld.prototype.addPlayer = function (data) {
        // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.fixedRotation = true

        // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 1;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixDef.shape.SetAsBox(
            185 / 2 / this.SCALE,
            164 / 2 / this.SCALE
            );
        fixDef.friction = 1;
        fixDef.restitution = 0.2;
        

        // create dynamic body
        if (data.x && data.y && data.width && data.height) {
            // If we're passing 
            bodyDef.position.x = data.x / this.SCALE + (data.width / this.SCALE / 2);
            bodyDef.position.y = data.y / this.SCALE + (data.height / this.SCALE / 2);
        } else {
            bodyDef.position.x = 200 / this.SCALE;
            bodyDef.position.y = 50 / this.SCALE;
        }
        var body = this.b2dWorld.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        // Add the fixture
        body.CreateFixture(fixDef); 

        // Add foot sensor fixture



        // data.x = body.GetPosition().x * this.SCALE - data.width / 2;
        // data.y = body.GetPosition().y * this.SCALE - data.height / 2;

        data.x = body.GetPosition().x * this.SCALE;
        data.y = body.GetPosition().y * this.SCALE;

        this.playersB2d.set(data.playerId, body);
        this.players.set(data.playerId, new EntityCollection.HawtPlayer(data));
        // var currplayers = '';
        // this.players.forEach(function(ele, index, array){
        //     currplayers += ele.playerId + ', ';
        // });
        // console.log('Current players: ' + currplayers + '\n');
    }

    GameWorld.prototype.removePlayer = function (data) {
        // remove the player from the player map
        this.players.delete(data.playerId);

        // destory body from the world
        this.b2dWorld.DestroyBody(this.playersB2d.get(data.playerId)); // this line causing the disconnects.
        this.playersB2d.delete(data.playerId);
        // console.log('Player ' + data.playerId + ' has been removed.\n');
    }

   // Things to start the game.
    GameWorld.prototype.start = function () {
        console.log("start the game world loop");
        var that = this;
        (function gameLoop() {
            if(that.gameStarted) {
                // Initialize vars for looping the game.
            } else {
                // Initialize vars for looping lobby?
            }
            that.loop();
            exports.requestAnimFrame(gameLoop);
        })();
    }

    GameWorld.prototype.addEntity = function (entity) {
        // console.log('added entity');
        this.entities.push(entity);
    }

    GameWorld.prototype.update = function () {
        /** Update the b2dWorld **/
        this.b2dWorld.Step(
            1 / 60   //frame-rate
            ,  10       //velocity iterations
            ,  10       //position iterations
        );

        /** Random Entities Update **/
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

        /** Player Updates **/
        var that = this;
        this.players.forEach(function(player) {0
            var body = that.playersB2d.get(player.playerId);
            if (player.isMoving) {
                body.SetLinearVelocity(new Box2D.Common.Math.b2Vec2((player.moveSpeed / that.SCALE * player.direction), body.GetLinearVelocity().y));
            }
            player.x = body.GetPosition().x * that.SCALE - player.width / 2;
            player.y = body.GetPosition().y * that.SCALE - player.height / 2;
            // console.log('The x,y is (' + player.x + ',' + player.y + ')');
        });
    }

    GameWorld.prototype.draw = function (drawCallback) {
        var that = this;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();

        // b2d debug
        this.b2dWorld.DrawDebugData();
        this.b2dWorld.ClearForces();

        /** Draw random entities **/
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(this.ctx);
        }
        /** Draw Players **/
        this.players.forEach(function(player) {
            player.draw(that.ctx, that.clockTick);
        });
        if (drawCallback) {
            drawCallback(this);
        }

        this.ctx.restore();
    }

    GameWorld.prototype.loop = function () {
        this.clockTick = this.timer.tick();
        this.update();
        if (isClient) {
            this.draw();
            this.click = null;
            this.wheel = null;
        }
    }

   GameWorld.prototype.syncThePlayers = function (serverPlayerData) {
        // console.log('\nSyncing the worlds.');
        if (serverPlayerData && serverPlayerData.length != 0) { 
            var gw = this;
            serverPlayerData.forEach(function(player, index, array) {
                player = player[1];
                // console.log('Checking player: ' + player);
                if (gw.players.get(player.playerId)) {
                    // console.log('Syncing a existing player.');
                    // Player exist, update the player data.
                    gw.players.get(player.playerId).syncEntity(player);
                } else {
                    // console.log('Sync a new player.');
                    // Player does not exist. 
                    gw.addPlayer(player);
                    // gw.players.set(player.playerId, new EntityCollection.HawtPlayer(player));
                }
                // console.log('\n');
            });
        }
   }

    exports.GameWorld = GameWorld;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");