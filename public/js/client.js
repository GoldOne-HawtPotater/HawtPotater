$(function(){
    // connect to the socket
    var socket = io();
    
    // Create the gameworld.
    var gameworld = new GameWorld();

    // Create a game engine for the client
    // var gameEngine = new GameEngine();

    // Get the game field (I think this is the canvas?)
    var field = document.getElementById("field");

    // Get the context
    var ctx = $("#gameWorldCanvas")[0].getContext("2d");

    // Getting the roomId of the room from the url
    var roomId = Number(window.location.pathname.match(/\/game\/(\d+)$/)[1]);

    // The user player id
    var myPlayerId;

    function startInput() {
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

        /** Set up the key listeners **/
        var gamescreen = $('#gameWorldCanvas')
                        .attr("tabindex", "0");

        gamescreen.keydown(function(e) {
           var key = e.which;
           switch(key) {
                case 37: //left
                case 38: //up
                case 39: //right
                case 40: //down
                    var data = {
                        theFunc: 'move',
                        playerId: myPlayerId,
                        direction: key
                    };
                    socket.emit('update_gameworld', data);
                    gameworld.move(data);
                    break;
                case 49: // {1 key}
                    var data = {
                        theFunc: 'toggleReady',
                        playerId: myPlayerId
                    };
                    socket.emit('update_gameworld', data)
                    gameworld.toggleReady(data);
                    break;
           }
        });

        gamescreen.keyup(function(e) {
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

    /** Set up the sockets the client needs to listen to **/
    socket.on('sync_worlds', function (serverGameWorld) {
        gameworld.syncTheWorlds(serverGameWorld);
    });

    // on connection to server get the roomId of person's room
    socket.on('connect', function(){
        var queueDownloads = function() {
            ASSET_MANAGER.queueDownload("../img/stolen_corgi_walk.png");
            //... Add more asssets below.
        };

        /** Download the assets **/
        queueDownloads();
        ASSET_MANAGER.downloadAll(function () {
            // This is called when the page loads.
            socket.emit('load', roomId);
        });
    });

    // receive the names of all people in the game room
    socket.on('joingame', function(data){
        if (gameworld.players.size < 4) {
            /** Register our key inputs. **/
            startInput();
            myPlayerId = data.playerId;
            gameworld.init(ctx);
            gameworld.syncTheWorlds(data.theWorld);
            gameworld.start();

            var bg = new EntityCollection.Background();
            gameworld.addEntity(bg);

            var sendData = {
                theFunc: 'addPlayer',
                playerId: myPlayerId,
                roomId: roomId
            };

            // Add user to the game world.
            gameworld.callFunc(sendData);
            // Add the user to the game world on the server.
            socket.emit('login', sendData);
        } else {
            // There's too many players. 
            // Show a message saying there is too many players
            // Possibly allow them to spectate the game.
        }
    });

    socket.on('leave',function(data){
        if(data.boolean && roomId==data.room){

        }
    });

    socket.on('tooMany', function(data){
        // then spectate? We can let the client watch the game server.
        if(data.boolean && name.length === 0) {

        }
    });

    // socket.on('receive_player_update', function(data){
    //     if(data && data.theFunc) {
    //         gameEngine[data.theFunc](data);
    //     } else {
    //         console.log('receive_player_update failed. Data is null.');
    //         console.log(data);
    //     }
    // });

    socket.on('receive_gameworld_update', function(data){
        if(data && data.theFunc) {
            gameworld.callFunc(data);
        } else {
            console.log('receive_gameworld_update failed. Data is ' + data + '\n');
        }
    });
});
