(function (exports, isClient) {
      ///////////////////////////////////////////////////
     /******************* Setup Code ******************/
    ///////////////////////////////////////////////////
    var Box2D = isClient ? window.Box2D : require('./box2d.js').Box2D;
    
    var Map = isClient ? window.Map : require('collections/map');

    var TileMaps = isClient ? exports.TileMaps : require('./mapdata.js').TileMaps;
    
    var EntityCollection = isClient ? window.EntityCollection : require('./entity').EntityCollection;
    
    var Entity = EntityCollection.Entity,
        HawtPlayer = EntityCollection.HawtPlayer,
        Background = EntityCollection.Background,
        Potato = EntityCollection.Potato,
        HawtDogge = EntityCollection.HawtDogge;


      /////////////////////////////////////////////////
     /*************** GameEngine Class **************/
    /////////////////////////////////////////////////
    var GameEngine = function () {
        this.players = new Map();
        this.playersB2d = new Map();
        this.entities = new Map();
        this.entitiesB2d = new Map();
        this.platformsB2d = [];
        this.surfaceWidth = 1280;
        this.surfaceHeight = 720;
        this.SCALE = 100;
        this.clockTick = 0;
        this.timer = new Timer();
        this.gameStates = {
            waiting: 0,
            playing: 1,
            nextlevel: 2,
            countdown: 3,
            settingup: 4
        };
        this.myGameState = this.gameStates.waiting;

        // Create a new box2d world
        this.b2dWorld = new Box2D.Dynamics.b2World(
            new Box2D.Common.Math.b2Vec2(0, 10)   // gravity
            , true                                // allow sleeping bodies
        ); 

        // Create the platforms
        this.createPlatforms({});
    };

    GameEngine.prototype.setGame = function (data) {
        console.log("Starting the game with map0" + data.mapNum);
        var that = this;
        // Set the game state as setting up
        that.myGameState = that.gameStates.settingup;
        // Reset players ready status and x,y positions
        this.resetPlayerPositions();
        // Create the platforms for the given map.
        this.createPlatforms({map: 'map0' + data.mapNum});
        // Wait until the current time is greater than the time given by the server.
        // This is basically a pause momet so we can drop the potato at the exact time
        // for everyone. 
        (function pauseLoop() {
            if (Date.now() < data.time) {
                setTimeout(pauseLoop, 1);
            } else {
                that.myGameState = that.gameStates.playing;
                that.addPotato(data);
            }
        })();
        // while(Date.now() < data.time);
        // Set the current game state
        // this.myGameState = this.gameStates.playing;
        // this.addPotato();
    };

    GameEngine.prototype.update = function () {
        this.clockTick = this.timer.tick();
        /** Update the b2dWorld **/
        if (this.myGameState != this.gameStates.settingup) {
            this.b2dWorld.Step(
                1 / 60      //frame-rate
                ,  10       //velocity iterations
                ,  10       //position iterations
            );
        }

        /** Random Entities Update **/
        var that = this;
        this.entities.forEach(function(entity) {
            var body = that.entitiesB2d.get(entity.id);
            entity.x = body.GetPosition().x * that.SCALE - entity.width / 2;
            entity.y = body.GetPosition().y * that.SCALE - entity.height / 2;
            entity.position = body.GetPosition();
        });

        /** Player Updates **/
        this.players.forEach(function(player) {
            var body = that.playersB2d.get(player.playerId);
            var vel = body.GetLinearVelocity();
            var desiredVel = 0;
            if (player.isMovingLeft) {
                desiredVel = -5;
                player.direction = -1;
            } 
            if (player.isMovingRight) {
                desiredVel = 5;
                player.direction = 1;
            } 
            var velChange = desiredVel - vel.x;
            var impulse = body.GetMass() * velChange
            body.ApplyImpulse(
                new Box2D.Common.Math.b2Vec2(impulse, 0), 
                body.GetWorldCenter()
            );

            player.x = body.GetPosition().x * that.SCALE - player.width / 2;
            player.y = body.GetPosition().y * that.SCALE - player.height / 2;

            // if (vel.y != 0 || vel.x != 0) console.log(Date.now() / 1000 / 60 + ' - The x,y is (' + player.x + ',' + player.y + ')');
        });
        // console.log('Clock tick = ' + that.clockTick);
    };


      /////////////////////////////////////////////////
     /**************** Creation Code ****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.createPlatforms = function(data) {
        var that = this;
        this.platformsB2d.forEach(function (plat, index, array) {
            // that.b2dWorld.DestroyBody(plat);
            plat.GetWorld().DestroyBody(plat);
        });
        this.platformsB2d = [];

        // If data does not exist. Draw the lobby map.
        if (!data.map) data.map = 'map01'; 

        // Check if the map exist.
        if (TileMaps[data.map]) {
            // Get the map
            var tileMap = TileMaps[data.map];

            // Find the collision layer
            var collisionLayer = null, tileLayer = null;
            for (var i = 0; i < tileMap.layers.length; i++) {
                if (tileMap.layers[i].name.indexOf('collisionLayer') == 0) {
                    collisionLayer = tileMap.layers[i];
                }
                if (tileMap.layers[i].name.indexOf('tileLayer') == 0) {
                    tileLayer = tileMap.layers[i];
                }
            }

            // Go through all the objects in the collision layer and create a box2d body for it.
            for (var i = 0 ; i < collisionLayer.objects.length; i++) {
                var colObj = collisionLayer.objects[i];
                var fixDef = new Box2D.Dynamics.b2FixtureDef;
                fixDef.density = 1.0;
                fixDef.friction = 0.5;
                fixDef.restitution = 0;
                // Create the ground
                var bodyDef = new Box2D.Dynamics.b2BodyDef;
                bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
                // position the center of the object
                bodyDef.position.x = (colObj.x + colObj.width / 2) / this.SCALE ;
                bodyDef.position.y = (colObj.y + colObj.height / 2) / this.SCALE;
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
                fixDef.shape.SetAsBox((colObj.width / this.SCALE) / 2, (colObj.height / this.SCALE) / 2);
                var platformBody = this.b2dWorld.CreateBody(bodyDef);
                platformBody.CreateFixture(fixDef);

                // Add the b2d platformBody to an array to destroy it in the future.
                this.platformsB2d.push(platformBody);
            }
        } else {
            console.log("TileMaps is undefined. + \nData: " + TileMaps);
        }
    };

    GameEngine.prototype.addPlayer = function (data) {
        // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.fixedRotation = true

        // var width, height;
        // if (dog) {
        //      width = 83; height = 52;
        // }

        // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 1;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixDef.shape.SetAsBox(
            83 / 2 / this.SCALE,
            52 / 2 / this.SCALE
            );
        fixDef.friction = 0;
        fixDef.restitution = 0;
        

        // create dynamic body
        if (data.x && data.y && data.width && data.height) {
            // If we're passing 
            bodyDef.position.x = data.x / this.SCALE + (data.width / this.SCALE / 2);
            bodyDef.position.y = data.y / this.SCALE + (data.height / this.SCALE / 2);
        } else {
            bodyDef.position.x = 400 / this.SCALE;
            bodyDef.position.y = 50 / this.SCALE;
        }
        var body = this.b2dWorld.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        // Add the fixture
        body.CreateFixture(fixDef); 

        // Add foot sensor fixture
        // ... implement the foot fixture & body
        // ...

        // Set the entity x, y values.
        data.x = body.GetPosition().x * this.SCALE;
        data.y = body.GetPosition().y * this.SCALE;

        // Keep track of the player box2d body object
        this.playersB2d.set(data.playerId, body);
        // keep track of the player entity
        this.players.set(data.playerId, new HawtDogge(data));
    };

    GameEngine.prototype.removePlayer = function (data) {
        // remove the player from the player map
        this.players.delete(data.playerId);

        // destory body from the world
        this.b2dWorld.DestroyBody(this.playersB2d.get(data.playerId));
        this.playersB2d.delete(data.playerId);
        // console.log('Player ' + data.playerId + ' has been removed.\n');
    };

    GameEngine.prototype.addPotato = function (data) {
         // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

                // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 0.5;
        fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(30 / 2 / this.SCALE);
        // fixDef.shape.SetAsBox(
        //     30 / 2 / this.SCALE,
        //     27 / 2 / this.SCALE
        //     );
        
        fixDef.friction = 1;
        fixDef.restitution = 0.7;

        bodyDef.position.x = 200 / this.SCALE;
        bodyDef.position.y = 50 / this.SCALE;

        var body = this.b2dWorld.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        body.CreateFixture(fixDef); 

        var potato = new Potato({
            x: 200,
            y: 50,
            id: data.time
        });
        this.entities.set(potato.id, potato);
        this.entitiesB2d.set(potato.id, body);
    };


      /////////////////////////////////////////////////
     /**************** Modifier Code ****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.attack = function (data) {};

    GameEngine.prototype.jumpPlayer = function (data) {
        // console.log(data.playerId + ' is attempting a jump.');
        if (data) {
            var player = this.players.get(data.playerId);
            var playerBody = this.playersB2d.get(data.playerId);
            //** Jump using impulse and velocity
            var impulse = playerBody.GetMass() * 5 * -1;
            playerBody.ApplyImpulse(
                new Box2D.Common.Math.b2Vec2(0, impulse),
                playerBody.GetWorldCenter()
            );

            //** Jump using velocity
            // var velocity = playerBody.GetLinearVelocity();
            // velocity.y = -10;
            // playerBody.SetLinearVelocity(velocity);
        }
    };

    GameEngine.prototype.dodge = function (data) {};

    GameEngine.prototype.movePlayer = function (data) {
        // console.log(data.playerId + ' is moving ' + data.direction + '.');
        if (data && data.direction) {
            var player = this.players.get(data.playerId);
            switch(data.direction) {
                case 37: //left
                    player.isMovingLeft = data.value;
                    break;
                case 39: //right
                    player.isMovingRight = data.value;
                    break;
            }
        }
    };

    GameEngine.prototype.toggleReady = function (data) {
        this.players.get(data.playerId).isReady ^= true;
        console.log('Player ' + data.playerId + ' is' + (this.players.get(data.playerId).isReady ? ' ' : ' not ') + 'ready.');
        // this.addPotato(data);
    };

    GameEngine.prototype.resetPlayerPositions = function () {
        // Set the x and y values of player2 and playersB2d
        var that = this;
        var index = 0;
        this.players.forEach(function(player) {
            player.isReady = false;
            var playerBody = that.playersB2d.get(player.playerId); 
            var position = new Box2D.Common.Math.b2Vec2(
                (400 + index * 2 * player.width) / that.SCALE, 
                500 / that.SCALE
                );
            playerBody.SetPosition(position);
            player.x = playerBody.GetPosition().x * that.SCALE;
            player.y = playerBody.GetPosition().y * that.SCALE;
            index++;
        });  
    };



      /////////////////////////////////////////////////
     /**************** Synchro Code *****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.syncTheGame = function (data) {
        // console.log('\nSyncing the worlds.');
        if (data) { 
            var GE = this;
            if (data.thePlayers) {
                data.thePlayers.forEach(function(player, index, array) {
                    player = player[1];
                    // console.log('Checking player: ' + player);
                    if (GE.players.get(player.playerId)) {
                        // console.log('Syncing a existing player.');
                        // Player exist, update the player data.
                        GE.players.get(player.playerId).syncEntity(player);
                        var position = new Box2D.Common.Math.b2Vec2(
                            player.x / GE.SCALE + (player.width / GE.SCALE / 2),
                            player.y / GE.SCALE + (player.height / GE.SCALE / 2)
                            );
                        GE.playersB2d.get(player.playerId).SetPosition(position);
                    } else {
                        // console.log('Sync a new player.');
                        // Player does not exist. 
                        GE.addPlayer(player);
                    }
                    // console.log('\n');
                });
            }
        }
        if (data.theEntities) {
            data.theEntities.forEach(function(entity, index, array) {
                var entity = entity[1];
                if (GE.entities.get(entity.id)) {
                    console.log("Updating potato");
                    GE.entities.get(entity.id).syncEntity(entity);
                    var position = new Box2D.Common.Math.b2Vec2(
                        entity.position.x,
                        entity.position.y
                        );
                    GE.entitiesB2d.get(entity.id).SetPosition(position);
                }
            });
        }
    };


      /////////////////////////////////////////////////
     /**************** Helper Code ******************/
    /////////////////////////////////////////////////
    GameEngine.prototype.callFunc = function (data) {
        if (data && data.theFunc) {
            this[data.theFunc](data);
        } else {
            console.log('data.theFunc is undefined.');
            console.log('GameEngine: ' + data + '\n');
        }
    };

    GameEngine.prototype.allIsReady = function() {
        var ready = true;
        this.players.forEach(function(player, index, array) {
            ready &= player.isReady;
        });
        return ready;
    };

    function Timer() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
        this.counter = 0;
    };

    Timer.prototype.tick = function () {
        this.counter++;
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;

        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    };

    exports.GameEngine = GameEngine;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");