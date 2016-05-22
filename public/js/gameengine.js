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
        HawtDogge = EntityCollection.HawtDogge,
        MultiJumpPowerUp = EntityCollection.MultiJumpPowerUp,
        MovingPlatform = EntityCollection.MovingPlatform,
        HawtSheep = EntityCollection.HawtSheep,
        HawtChicken = EntityCollection.HawtChicken,
        HawtPig = EntityCollection.HawtPig;


      /////////////////////////////////////////////////
     /*************** GameEngine Class **************/
    /////////////////////////////////////////////////
    var GameEngine = function () {
        this.background = new Background();

        this.players = new Map();
        this.playersB2d = new Map();
        this.entities = new Map();
        this.entitiesB2d = new Map();
        this.platformsB2d = [];
        this.graveyard = [];
        this.potatoCreationQueue = [];
        this.powerUpNextDrop = null;
        this.powerUpDelay = 10000;
        this.platformPositionData = null;
        this.endGameTime = null;
        this.movingPlatforms = [];
        this.movingPlatformsB2d = [];
        // this.surfaceWidth = 1280;
        // this.surfaceHeight = 720;
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
        this.collisionProfiles = {
            platform: 0x001,
            potato: 0x002,
            player: 0x004,
            powerup: 0x008
        };
        this.myGameState = this.gameStates.waiting;

        // Create a new box2d world
        this.b2dWorld = new Box2D.Dynamics.b2World(
            new Box2D.Common.Math.b2Vec2(0, 10)   // gravity
            , true                                // allow sleeping bodies
        ); 

        // Create the platforms
        this.createPlatforms({});
        // Create the Listener for collisions
        this.createListener(this.b2dWorld);
    };

    GameEngine.prototype.setGame = function (data) {
        console.log("Starting the game with map0" + data.mapNum);
        var that = this;
        // Set the game state as setting up
        that.myGameState = that.gameStates.settingup;
        // Reset players ready status and x,y positions
        this.resetPlayerPositions();

        // reset player scores
        this.players.forEach(function(player) {
            player.score = 0;
        });    

        // Create the platforms for the given map.
        this.createPlatforms({map: 'map0' + data.mapNum});

        this.endGameTime = data.endTime;
        this.powerUpNextDrop = data.time + this.powerUpDelay;
        // Wait until the current time is greater than the time given by the server.
        // This is basically a pause momet so we can drop the potato at the exact time
        // for everyone. 
        (function pauseLoop() {
            if (Date.now() < data.time) {
                setTimeout(pauseLoop, 1);
            } else {
                that.myGameState = that.gameStates.playing;
                if (that.platformPositionData){
                    that.potatoCreationQueue.push({ 
                            x: (that.platformPositionData.minX + that.platformPositionData.maxX)/2, 
                            y: 25, 
                            time: data.time, 
                            timeToDrop: Date.now() + 5000 
                        });
                } else {
                    console.log("Error creating game room.");
                    that.myGameState = that.gameStates.waiting;
                    that.endGameTime = Date.now();
                }
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
        this.b2dWorld.Step(
            1 / 60      //frame-rate
            ,  10       //velocity iterations
            ,  10       //position iterations
        );

        /** Removes Entities from the world that need to be removed **/
        for (var x = 0; x < this.graveyard.length; x++) {
            this.removeEntity({entityId: this.graveyard[x].entityId});
        }
        this.graveyard = [];

        /** Adds Potatos to the world that need to be added **/
        var potatosNotReady = [];

        for (var x = 0; x < this.potatoCreationQueue.length; x++) {
            if (this.potatoCreationQueue[x].timeToDrop <= Date.now()) {
                // If we're ready to drop, add the Potato
                this.addPotato({ x: this.potatoCreationQueue[x].x, y: this.potatoCreationQueue[x].y, time: this.potatoCreationQueue[x].time });
            } else {
                // If not re-add it to the creationQueue
                potatosNotReady.push(this.potatoCreationQueue[x]);
            }
        }
        
        // We "reset" the queue so that we never have any null elements while checking the time in gameWorld
        this.potatoCreationQueue = potatosNotReady;

        var that = this;
        /** Update the moving platforms **/
        if (this.myGameState == this.gameStates['playing']){
            for (var i = 0; i < that.movingPlatforms.length; i++) {
                var platform = that.movingPlatforms[i];
                var b2dPlatform = that.movingPlatformsB2d[i];

                if (platform.offset <= 0) {
                    platform.offset = platform.offsetReset; // reset the offset
                    platform.directionValue *= -1; // flip the direciton value
                }

                var vel = b2dPlatform.GetLinearVelocity();
                if (platform.direction.indexOf('vertical') >= 0) {
                    vel.y = platform.speed * platform.directionValue;
                } else {
                    vel.x = platform.speed * platform.directionValue;
                }
                b2dPlatform.SetLinearVelocity(vel);
                platform.x = b2dPlatform.GetPosition().x * that.SCALE;
                platform.y = b2dPlatform.GetPosition().y * that.SCALE;
                platform.offset -= platform.speed;
            }
        }

        /** Power Up Addition Check **/
        if (this.powerUpNextDrop != null && Date.now() > this.powerUpNextDrop) {
            this.addPowerUps({});
            this.powerUpNextDrop = Date.now() + this.powerUpDelay;
        }

        /** Random Entities Update **/
        this.entities.forEach(function(entity) {
            var body = that.entitiesB2d.get(entity.id);
            entity.x = body.GetPosition().x * that.SCALE - entity.width / 2;
            entity.y = body.GetPosition().y * that.SCALE - entity.height / 2;
            entity.position = body.GetPosition();

            if (body.type = "POTATO" && entity) {
                var velocity = body.GetLinearVelocity();
                // Cap the velocity at 5
                if (velocity.x > 5) {
                    velocity.x = 5;
                }
                if (velocity.y > 5) {
                    velocity.y = 5;
                }
            }
        });


        /** Player Updates **/
        this.players.forEach(function(player) {
            var body = that.playersB2d.get(player.playerId);
            var vel = body.GetLinearVelocity();

            // movement
            var desiredVel = vel.x * 0.90;
            if (player.isMovingLeft) {
                if (Math.abs(desiredVel) < 5) desiredVel += -1;
                player.direction = -1;
            } 
            if (player.isMovingRight) {
                if (Math.abs(desiredVel) < 5) desiredVel += 1;
                player.direction = 1;
            }

            // jump
            if (vel.y !== 0) {
                player.isJumping = true;
            } else {
                player.isJumping = false;
                player.jumpingAnimation.reset();
            }
            
            var velChange = desiredVel - vel.x;
            var impulse = body.GetMass() * velChange
            body.ApplyImpulse(
                new Box2D.Common.Math.b2Vec2(impulse, 0), 
                body.GetWorldCenter()
            );

            // Reset the players dodge collision if the dodge duration is up
            if (player.dodgeResetTimer != null && Date.now() > player.dodgeResetTimer) {
                var playerBody = that.playersB2d.get(player.playerId);
                var fixtureList = playerBody.GetFixtureList();
                var filter = fixtureList.GetFilterData();
                // We add the player back into the maskBits to say that we can collide with players again
                filter.maskBits = that.collisionProfiles.platform | that.collisionProfiles.potato | that.collisionProfiles.powerup |
                                  that.collisionProfiles.player;
                fixtureList.SetFilterData(filter);

                // We reset the dodgeTimer to null
                player.dodgeResetTimer = null;
            }

            // Reset the players ability to dodge if the cooldown is over
            if (player.dodgeCooldownTimer != null && Date.now() > player.dodgeCooldownTimer) {
                player.canDodge = true;
                player.dodgeCooldownTimer = null;
            }

            // Update player x y values based on box2d position
            player.x = body.GetPosition().x * that.SCALE - player.width / 2;
            player.y = body.GetPosition().y * that.SCALE - player.height / 2;

            // if (vel.y != 0 || vel.x != 0) console.log(Date.now() / 1000 / 60 + ' - The x,y is (' + player.x + ',' + player.y + ')');
        });

        // If this games end time is < Date.now(), we need to end the game
        if (this.endGameTime != null && this.endGameTime < Date.now()) {
            this.myGameState = this.gameStates.waiting;
            this.endGameTime = null;
            this.powerUpNextDrop = null;
            var entityIds = this.entities.keys();
            var nextEntity = entityIds.next();
            while (!nextEntity.done) {
                this.removeEntity({ entityId: nextEntity.value});
                nextEntity = entityIds.next();
            }
            this.potatoCreationQueue = [];
            this.resetPlayerPositions(); 
            this.players.forEach(function(player) {
                player.isReady = false;
                player.multiJumpCounter = 0;
            }); 
            that.platformPositionData = null;
            this.createPlatforms({});
            // clear the room  
        }

        // console.log('Clock tick = ' + that.clockTick);
    };


      /////////////////////////////////////////////////
     /**************** Creation Code ****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.createPlatforms = function(data) {
        var that = this;
        this.platformPositionData = {};

        this.platformsB2d.forEach(function (plat, index, array) {
            // that.b2dWorld.DestroyBody(plat);
            plat.GetWorld().DestroyBody(plat);
        });
        this.platformsB2d = [];

        this.movingPlatformsB2d.forEach(function (plat, index, array) {
            // that.b2dWorld.DestroyBody(plat);
            plat.GetWorld().DestroyBody(plat);
        });
        this.movingPlatformsB2d = [];
        this.movingPlatforms = [];

        // If data does not exist. Draw the lobby map.
        if (!data.map) data.map = 'map01'; 

        // Check if the map exist.
        if (TileMaps[data.map]) {
            // Get the map
            var tileMap = TileMaps[data.map];

            // Find the collision layer
            var collisionLayer = null, tileLayer = null;
            var movingTiles = new Map();
            var movingObjects = new Map();
            for (var i = 0; i < tileMap.layers.length; i++) {
                if (tileMap.layers[i].name.indexOf('collisionLayer') == 0) {
                    collisionLayer = tileMap.layers[i];
                } else if (tileMap.layers[i].name.indexOf('tileLayer') == 0) {
                    tileLayer = tileMap.layers[i];
                } else if (tileMap.layers[i].name.indexOf('movingTile') == 0) {
                    movingTiles.set(tileMap.layers[i].name, tileMap.layers[i]);
                } else if (tileMap.layers[i].name.indexOf('movingObject') == 0) {
                    movingObjects.set(tileMap.layers[i].name, tileMap.layers[i]);
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
                // I am a... 
                fixDef.filter.categoryBits = this.collisionProfiles.platform;
                // I only collide with...
                fixDef.filter.maskBits = this.collisionProfiles.player | this.collisionProfiles.platform | this.collisionProfiles.potato
                                         | this.collisionProfiles.powerup;
                var platformBody = this.b2dWorld.CreateBody(bodyDef);
                platformBody.CreateFixture(fixDef);
				if (colObj.name == "platform") {
					platformBody.SetUserData({
						type: "PLATFORM"
					});

                    // Get min x and max x
                    this.platformPositionData.minX = colObj.x;
                    this.platformPositionData.maxX = colObj.width;
				}

				//platformBody.SetUserData({
				//    type: "PLATFORM"
				//});

                // Add the b2d platformBody to an array to destroy it in the future.
                this.platformsB2d.push(platformBody);
            }

            movingTiles.forEach(function(tile) {
                var colObj = movingObjects.get('movingObject' + tile.name.split('movingTile')[1]).objects[0];

                // Fixture def
                var fixDef = new Box2D.Dynamics.b2FixtureDef;
                fixDef.density = 100.0;
                fixDef.friction = 1;
                fixDef.restitution = 0;

                // Create the body
                var bodyDef = new Box2D.Dynamics.b2BodyDef;
                bodyDef.type = Box2D.Dynamics.b2Body.b2_kinematicBody;

                // position the center of the object
                bodyDef.position.x = (colObj.x + colObj.width / 2) / that.SCALE;
                bodyDef.position.y = (colObj.y + colObj.height / 2) / that.SCALE;
                fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
                fixDef.shape.SetAsBox((colObj.width / that.SCALE) / 2, (colObj.height / that.SCALE) / 2);
                var platformBody = that.b2dWorld.CreateBody(bodyDef);
                platformBody.CreateFixture(fixDef);
                platformBody.SetUserData({
                    type: "MOVING_PLATFORM"
                });

                that.movingPlatformsB2d.push(platformBody);

                var data = {
                    tileset: tileMap.tilesets[0],
                    tiles: tile.data.filter(function(value) { return value > 0; }),
                    type: colObj.type
                }
                that.movingPlatforms.push(new MovingPlatform(
                    colObj.x + colObj.width / 2, 
                    colObj.y + colObj.height / 2,
                    data
                    ));
            }); 

        } else {
            console.log("TileMaps is undefined. + \nData: " + TileMaps);
        }
    };

    GameEngine.prototype.createListener = function (world) {
        // We lose scope inside of the listener so we need a reference to the game engine
        // to access its functions/methods
        var that = this;

        var listener = new Box2D.Dynamics.b2ContactListener;
        // BeginContact is called only when two objects collide with one another. 
        listener.BeginContact = function(contact) {
            console.log(contact.GetFixtureA().GetBody().GetUserData());
            console.log(contact.GetFixtureB().GetBody().GetUserData());

            var firstObjectCollided = contact.GetFixtureA().GetBody().GetUserData();
            var secondObjectCollided = contact.GetFixtureB().GetBody().GetUserData();

            // Tests cases to detect what objects have collided and how our players and entities should
            // be updated. The processCollision method determines the behavior for THAT specific object.
            // It also determines what the behavior of that object should be by passing it the other object 
            // it has collided with. 
            //
            // For example: A Player shouldn't have to "do" anything when collided with a Power Up.
            // The Power Up should be responsible for that.

            // If the second object collided is null the first object doesn't care about the second object. 
            if (secondObjectCollided != null) {
                if (firstObjectCollided != null && firstObjectCollided.type == "PLAYER") {
                    that.players.get(firstObjectCollided.id).processCollision({ objectCollided: secondObjectCollided });
                }

                if (firstObjectCollided && that.entities.get(firstObjectCollided.id)) {
                    if (firstObjectCollided != null && firstObjectCollided.type == "POWER_UP") {
                        that.entities.get(firstObjectCollided.id).processCollision({objectCollided: secondObjectCollided, gameEngine: that});
                    }

                    if (firstObjectCollided != null && firstObjectCollided.type == "POTATO") {
                        that.entities.get(firstObjectCollided.id).processCollision({objectCollided: secondObjectCollided, gameEngine: that });
                    }
                }
            }

            // If the first object collided is null the second object doesn't care about the first object. 
            if (firstObjectCollided != null) {
                if (secondObjectCollided != null && secondObjectCollided.type == "PLAYER") {
                    that.players.get(secondObjectCollided.id).processCollision({ objectCollided: firstObjectCollided });
                }

                if (secondObjectCollided && that.entities.get(secondObjectCollided.id)) {
                    if (secondObjectCollided != null && secondObjectCollided.type == "POWER_UP") {
                        that.entities.get(secondObjectCollided.id).processCollision({objectCollided: firstObjectCollided, gameEngine: that });
                    }

                    if (secondObjectCollided != null && secondObjectCollided.type == "POTATO") {
                        that.entities.get(secondObjectCollided.id).processCollision({objectCollided: firstObjectCollided, gameEngine: that });
                    }
                }
            }
        }
        
        // Add the listener to the game world
        world.SetContactListener(listener);
    }

    GameEngine.prototype.addPlayer = function(data) {
        // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.fixedRotation = true

        // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 1;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        if (!data.character || data.character == EntityCollection.GameCharacters['HawtDogge']) {
            data.width = 83;
            data.height = 52;
        } else if (data.character == EntityCollection.GameCharacters['HawtSheep']) {
            data.width = 91;
            data.height = 60;
        } else if (data.character == EntityCollection.GameCharacters['HawtChicken']) {
            data.width = 73;
            data.height = 77;
        } else if (data.character == EntityCollection.GameCharacters['HawtPig']) {
            data.width = 67;
            data.height = 61;
        }
        fixDef.shape.SetAsBox(
            data.width / 2 / this.SCALE,
            data.height / 2 / this.SCALE
            );
        fixDef.friction = 0;
        fixDef.restitution = 0.2;
        // I am a... 
        fixDef.filter.categoryBits = this.collisionProfiles.player;
        // I only collide with...
        fixDef.filter.maskBits = this.collisionProfiles.player | this.collisionProfiles.platform | this.collisionProfiles.potato
                                 | this.collisionProfiles.powerup;
        

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

        // Set the data to be stored by the object for collisions 
        body.SetUserData({
            type: "PLAYER",
            id: data.playerId
        });

        // Add foot sensor fixture
        // ... implement the foot fixture & body
        // ...

        // Set the entity x, y values.
        data.x = body.GetPosition().x * this.SCALE;
        data.y = body.GetPosition().y * this.SCALE;

        // Keep track of the player box2d body object
        this.playersB2d.set(data.playerId, body);
        // keep track of the player entity

        data.gameCharacters = this.gameCharacters;
        if (!data.character || data.character == EntityCollection.GameCharacters['HawtDogge']) {
            this.players.set(data.playerId, new HawtDogge(data));
        } else if (data.character == EntityCollection.GameCharacters['HawtSheep']) {
            this.players.set(data.playerId, new HawtSheep(data));
        } else if (data.character == EntityCollection.GameCharacters['HawtChicken']) {
            this.players.set(data.playerId, new HawtChicken(data));
        } else if (data.character == EntityCollection.GameCharacters['HawtPig']) {
            this.players.set(data.playerId, new HawtPig(data));
        }
        // this.players.set(data.playerId, new HawtDogge(data));
        if (data.playerNum != null && data.playerNum != undefined) {
            this.players.get(data.playerId).playerNum = data.playerNum;
        } else {
            this.players.get(data.playerId).playerNum = this.players.size;
        }
    };

    GameEngine.prototype.switchCharacter = function (data) {
        if (data) {
            var player = this.players.get(data.playerId);
            var playerBody = this.playersB2d.get(data.playerId);
            this.b2dWorld.DestroyBody(playerBody);
            player.switchCharacter();
            this.addPlayer(player);
        }
    };

    GameEngine.prototype.removePlayer = function (data) {
        // remove the player from the player map
        this.players.delete(data.playerId);

        // destory body from the world
        this.b2dWorld.DestroyBody(this.playersB2d.get(data.playerId));
        this.playersB2d.delete(data.playerId);
        // console.log('Player ' + data.playerId + ' has been removed.\n');
    };

    GameEngine.prototype.removeEntity = function (data) {
        // remove the entity from the entity map
        this.entities.delete(data.entityId);

        // destory body from the world
        var body = this.entitiesB2d.get(data.entityId);
        if (body) {
            this.b2dWorld.DestroyBody(this.entitiesB2d.get(data.entityId));
            console.log("Attempted to remove entity with ID: " + data.entityId);
            this.entitiesB2d.delete(data.entityId);
        }
    }

    GameEngine.prototype.addPowerUps = function (data) {
        // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
        bodyDef.fixedRotation = true;

        // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 0.5;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixDef.shape.SetAsBox(
            64 / 2 / this.SCALE,
            64 / 2 / this.SCALE
            );
        fixDef.friction = 1;
        fixDef.restitution = 0;
        // I am a... 
        fixDef.filter.categoryBits = this.collisionProfiles.powerup;
        // I only collide with...
        // players, platforms and other powerups since I don't want the potato to collide with me
        fixDef.filter.maskBits = this.collisionProfiles.player | this.collisionProfiles.platform | this.collisionProfiles.powerup;


        // bodyDef.position.x = (Math.floor(Math.random() * (650 - 450 + 1) + 450)) / this.SCALE;
        bodyDef.position.x = (this.platformPositionData.minX + (Math.floor(Math.random() * this.platformPositionData.maxX))) / this.SCALE;
        bodyDef.position.y = 50 / this.SCALE;

        var body = this.b2dWorld.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        body.CreateFixture(fixDef);

        //data.x = body.GetPosition().x * this.SCALE;
        //data.y = body.GetPosition().y * this.SCALE;

        var powerUp = new MultiJumpPowerUp({
            x: bodyDef.position.x,
            y: bodyDef.position.y
        });

        // Set the data to be stored by the object for collisions
        body.SetUserData({
            type: "POWER_UP",
            id: powerUp.id
        });

        console.log("Power Up ID: " + powerUp.id);
        this.entities.set(powerUp.id, powerUp);
        this.entitiesB2d.set(powerUp.id, body);
    }

    GameEngine.prototype.addPotato = function (data) {
         // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

                // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 0.01;
        fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(65 / 2 / this.SCALE);
        // fixDef.shape.SetAsBox(
        //     30 / 2 / this.SCALE,
        //     27 / 2 / this.SCALE
        //     );
        
        fixDef.friction = 1;
        fixDef.restitution = 0.9575;
        // I am a... 
        fixDef.filter.categoryBits = this.collisionProfiles.potato;
        // I only collide with...
        fixDef.filter.maskBits = this.collisionProfiles.player | this.collisionProfiles.platform | this.collisionProfiles.potato
                                 | this.collisionProfiles.powerup;

        bodyDef.position.x = data.x / this.SCALE;
        bodyDef.position.y = data.y / this.SCALE;

        var body = this.b2dWorld.CreateBody(bodyDef);

        body.SetSleepingAllowed(false);

        body.CreateFixture(fixDef);

        var potato = new Potato({
            x: data.x,
            y: data.y,
            id: data.time
        });

        body.SetUserData({
            type: "POTATO",
            id: potato.id
        });

        this.entities.set(potato.id, potato);
        this.entitiesB2d.set(potato.id, body);
    };


      /////////////////////////////////////////////////
     /**************** Modifier Code ****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.attack = function(data) {
        if (data) {
            var player = this.players.get(data.playerId);
            var playerBody = this.playersB2d.get(data.playerId);
            var vel = playerBody.GetLinearVelocity();
            vel.x = 15 * player.direction;
            playerBody.SetLinearVelocity(vel);
        }
    };

    GameEngine.prototype.dodge = function (data) {
        if (data) {
            var player = this.players.get(data.playerId);
            if (player.canDodge) {
                var playerBody = this.playersB2d.get(data.playerId);
                var fixtureList = playerBody.GetFixtureList();
                var filter = fixtureList.GetFilterData();
                filter.maskBits = this.collisionProfiles.platform | this.collisionProfiles.potato | this.collisionProfiles.powerup;
                fixtureList.SetFilterData(filter);

                player.dodgeResetTimer = Date.now() + player.dodgeDuration;
                player.dodgeCooldownTimer = Date.now() + player.dodgeCooldown;
                player.canDodge = false;
            }
        }
    };

    GameEngine.prototype.jumpPlayer = function (data) {
        // console.log(data.playerId + ' is attempting a jump.');
        if (data) {
            var player = this.players.get(data.playerId);
            var playerBody = this.playersB2d.get(data.playerId);

            player.isJumping = playerBody.GetLinearVelocity().y === 0;
            var isMultiJumping = (player.multiJumpCounter > 0 && playerBody.GetLinearVelocity().y != 0);

            // If we can double jump and our current y velocity is not 0 we are attempting a double jump
            //if (player.multiJumpCounter > 0 && playerBody.GetLinearVelocity().y != 0) {
            //    console.log("Detected double jump");
            //    player.multiJumpCounter--;
            //    player.jumpingAnimation.reset();
            //}

            if (playerBody.GetLinearVelocity().y == 0 || isMultiJumping) {
                // Jump using impulse and velocity
                var impulse = playerBody.GetMass() * 5 * -1;
                playerBody.ApplyImpulse(
                    new Box2D.Common.Math.b2Vec2(0, impulse),
                    playerBody.GetWorldCenter()
                );

                if (isMultiJumping) {
                    player.multiJumpCounter--;
                    player.jumpingAnimation.reset();
                }
            }
            // Jump using velocity
            // var velocity = playerBody.GetLinearVelocity();
            // velocity.y = -10;
            // playerBody.SetLinearVelocity(velocity);
        }
    };

    GameEngine.prototype.movePlayer = function(data) {
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
        if (this.myGameState === this.gameStates.waiting) {
            this.players.get(data.playerId).isReady ^= true;
        }
        console.log('Player ' + data.playerId + ' is' + (this.players.get(data.playerId).isReady ? ' ' : ' not ') + 'ready.');
        // this.addPotato(data);
    };

    GameEngine.prototype.resetPlayerPositions = function () {
        // Set the x and y values of player2 and playersB2d
        var that = this;
        var index = 0;
        this.players.forEach(function(player) {
            player.isReady = true;
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