(function (exports, isClient) {
      ///////////////////////////////////////////////////
     /******************* Setup Code ******************/
    ///////////////////////////////////////////////////
    var Box2D = isClient ? window.Box2D : require('./box2d.js').Box2D;
    
    var Map = isClient ? window.Map : require('collections/map');
    
    var EntityCollection = isClient ? window.EntityCollection : require('./entity').EntityCollection;
    
    var Entity = EntityCollection.Entity,
        HawtPlayer = EntityCollection.HawtPlayer,
        Background = EntityCollection.Background,
        Potato = EntityCollection.Potato,
        HawtDogge = EntityCollection.HawtDogge,
        MultiJumpPowerUp = EntityCollection.MultiJumpPowerUp;


      /////////////////////////////////////////////////
     /*************** GameEngine Class **************/
    /////////////////////////////////////////////////
    var GameEngine = function () {
        this.players = new Map();
        this.playersB2d = new Map();
        this.entities = new Map();
        this.entitiesB2d = new Map();
        this.surfaceWidth = 1280;
        this.surfaceHeight = 720;
        this.SCALE = 30;
        this.clockTick = 0;
        this.timer = new Timer();

        // Create a new box2d world
        this.b2dWorld = new Box2D.Dynamics.b2World(
            new Box2D.Common.Math.b2Vec2(0, 10)   // gravity
            , true                                // allow sleeping bodies
        ); 
        // Create the platforms
        this.createPlatforms();
    };

    GameEngine.prototype.update = function () {
        this.clockTick = this.timer.tick();
        /** Update the b2dWorld **/
        this.b2dWorld.Step(
            1 / 60      //frame-rate
            ,  10       //velocity iterations
            ,  10       //position iterations
        );

        /** Random Entities Update **/
        var that = this;
        this.entities.forEach(function(entity) {
            var body = that.entitiesB2d.get(entity.id);
            entity.x = body.GetPosition().x * that.SCALE - entity.width / 2;
            entity.y = body.GetPosition().y * that.SCALE - entity.height / 2;
            // console.log('The x,y is (' + player.x + ',' + player.y + ')');
        });

        /** Player Updates **/
        this.players.forEach(function(player) {
            var body = that.playersB2d.get(player.playerId);
            var vel = body.GetLinearVelocity();
            var desiredVel = 0;
            if (player.isMoving) {
                if (player.direction < 0) desiredVel = -10;
                if (player.direction > 0) desiredVel = 10;
            }
            var velChange = desiredVel - vel.x;
            var impulse = body.GetMass() * velChange
            body.ApplyImpulse(
                new Box2D.Common.Math.b2Vec2(impulse, 0), 
                body.GetWorldCenter()
            );
            // var pos = body.GetPosition();
            // body.SetPosition(new Box2D.Common.Math.b2Vec2(pos.x + desiredVel, pos.y));
            player.x = body.GetPosition().x * that.SCALE - player.width / 2;
            player.y = body.GetPosition().y * that.SCALE - player.height / 2;

            // if (player.isMoving)
            //     console.log('=====================================\n'
            //                 + 'PlayerID ' + player.playerId + '\n'
            //                 + 'vel = (' + vel.x + ', ' + vel.y + ')\n' 
            //                 + 'desiredVel = ' + desiredVel + '\n' 
            //                 + 'velChange = ' + velChange + '\n' 
            //                 + 'impulse = ' + impulse + '\n' 
            //                 + 'mass = ' + body.GetMass() + '\n' 
            //                 + 'player.x = ' + player.x + '\n' 
            //                 + 'player.y = ' + player.y + '\n' 
            //                 + '====================================='
            //                 );
            // if (vel.y != 0 || vel.x != 0) console.log(Date.now() / 1000 / 60 + ' - The x,y is (' + player.x + ',' + player.y + ')');
        });
        // console.log('Clock tick = ' + that.clockTick);
    };


      /////////////////////////////////////////////////
     /**************** Creation Code ****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.createPlatforms = function() {
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0;
        // Create the ground
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_staticBody;
        // position the center of the object
        bodyDef.position.x = this.surfaceWidth / 2 / this.SCALE;
        bodyDef.position.y = (this.surfaceHeight / this.SCALE) - 1;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixDef.shape.SetAsBox((this.surfaceWidth / this.SCALE) / 2, 0.5 / 2);
        this.b2dWorld.CreateBody(bodyDef).CreateFixture(fixDef);
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
            bodyDef.position.x = 200 / this.SCALE;
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
        fixDef.restitution = 0.9875;

        bodyDef.position.x = 450 / this.SCALE;
        bodyDef.position.y = 50 / this.SCALE;

        var body = this.b2dWorld.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        body.CreateFixture(fixDef);

        //data.x = body.GetPosition().x * this.SCALE;
        //data.y = body.GetPosition().y * this.SCALE;

        var powerUp = new MultiJumpPowerUp({
            x: 450,
            y: 50
        });
        this.entities.set(powerUp.id, powerUp);
        this.entitiesB2d.set(powerUp.id, body);
    }

    GameEngine.prototype.addPotato = function (data) {
         // Specify a player body definition
        var bodyDef = new Box2D.Dynamics.b2BodyDef;
        bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

                // fixture definition and shape definition for fixture
        var fixDef = new Box2D.Dynamics.b2FixtureDef;
        fixDef.density = 0.5;
        fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fixDef.shape.SetAsBox(
            30 / 2 / this.SCALE,
            27 / 2 / this.SCALE
            );
        fixDef.friction = 1;
        fixDef.restitution = 0.9575;

        bodyDef.position.x = 200 / this.SCALE;
        bodyDef.position.y = 50 / this.SCALE;

        var body = this.b2dWorld.CreateBody(bodyDef);
        body.SetSleepingAllowed(false);

        body.CreateFixture(fixDef); 

        //data.x = body.GetPosition().x * this.SCALE;
        //data.y = body.GetPosition().y * this.SCALE;

        var potato = new Potato({
            x: 200,
            y: 50
        });
        this.entities.set(potato.id, potato);
        this.entitiesB2d.set(potato.id, body);
    };


      /////////////////////////////////////////////////
     /**************** Modifier Code ****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.attack = function (data) {};

    GameEngine.prototype.jumpPlayer = function (data) {
        console.log(data.playerId + ' is attempting a jump.');
        if (data) {
            var player = this.players.get(data.playerId);
            var playerBody = this.playersB2d.get(data.playerId);
            //** Jump using impulse and velocity
            var impulse = playerBody.GetMass() * 10* -1;
            playerBody.ApplyImpulse(
                new Box2D.Common.Math.b2Vec2(0, impulse),
                playerBody.GetWorldCenter());

            //** Jump using velocity
            // var velocity = playerBody.GetLinearVelocity();
            // velocity.y = -10;
            // playerBody.SetLinearVelocity(velocity);
        }
    };

    GameEngine.prototype.dodge = function (data) {};

    GameEngine.prototype.movePlayer = function (data) {
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
            // var playerBody = this.playersB2d.get(data.playerId);
        }
    };

    GameEngine.prototype.toggleReady = function (data) {
        this.players.get(data.playerId).isReady ^= true;
        console.log('Player ' + data.playerId + ' is' + (this.players.get(data.playerId).isReady ? ' ' : ' not ') + 'ready.');
        this.addPotato(data);
    };

      /////////////////////////////////////////////////
     /**************** Synchro Code *****************/
    /////////////////////////////////////////////////
    GameEngine.prototype.syncThePlayers = function (data) {
        // console.log('\nSyncing the worlds.');
        if (data && data.length != 0) { 
            var GE = this;
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

    function Timer() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
        this.counter = 0;
    }

    Timer.prototype.tick = function () {
        this.counter++;
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;

        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    }

    exports.GameEngine = GameEngine;
})(typeof global === "undefined" ? window : exports, typeof global === "undefined");