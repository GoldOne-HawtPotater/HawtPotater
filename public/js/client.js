$(function(){
    // connect to the socket
    var socket = io();
    
    var gameworld = new GameWorld();

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
        // Disable scroll keys
        var keys = {37: 1, 38: 1, 39: 1, 40: 1};
        document.onkeydown  = function(e) {
            if (keys[e.keyCode]) {
                e = e || window.event;
                if (e.preventDefault) e.preventDefault();
                e.returnValue = false;  
                return false;
            }
        }


        /** Set up the key listeners **/
        var gamescreen = $('#gameWorldCanvas')
                        .attr("tabindex", "0");

        gamescreen.keydown(function(e) {
           var key = e.which;
           var data;
           switch(key) {
                case 49: // {1} key
                    data = {
                        theFunc: 'toggleReady',
                        playerId: myPlayerId
                    };
                    socket.emit('server_update', data)
                    break;
                case 32: // spacebar (jump)
                    data = {
                        theFunc: 'jumpPlayer',
                        playerId: myPlayerId,
                        value: true
                    };
                    if (gameworld.gameEngine.playersB2d.get(myPlayerId).GetLinearVelocity().y == 0) {
                        socket.emit('server_update', data)
                        // gameworld.gameEngine.jumpPlayer(data);
                    }
                    break;
                case 37: //left
                case 39: //right
                    data = {
                        theFunc: 'movePlayer',
                        playerId: myPlayerId,
                        direction: key,
                        value: true
                    };
                    if (!gameworld.gameEngine.players.get(myPlayerId).isMoving) {
                        socket.emit('server_update', data)
                        // gameworld.gameEngine.movePlayer(data);
                    }
                    break;
                case 38: //up
                    break;
                case 40: //down
                    break;
           }
        });

        gamescreen.keyup(function(e) {
            e.preventDefault();
           var key = e.which; 
           switch(key) {
                case 37: //left
                case 39: //right
                    var data = {
                        theFunc: 'movePlayer',
                        playerId: myPlayerId,
                        direction: key,
                        value: false
                    };
                    socket.emit('server_update', data);
                    // gameworld.gameEngine.movePlayer(data);
                    break;
                case 38: //up
                    break;
                    break;
                case 40: //down
                    break;
           }
        });

        console.log('Input started');
    }

  

    // on connection to server get the roomId of person's room
    socket.on('connect', function(){
        var queueDownloads = function() {
            ASSET_MANAGER.queueDownload("../img/stolen_corgi_walk.png");
            ASSET_MANAGER.queueDownload("../img/potato.png");
            //... Add more asssets below.
        };

        /** Download the assets **/
        queueDownloads();
        ASSET_MANAGER.downloadAll(function () {
            startInput();
            gameworld.init(ctx);
            gameworld.start();
            myPlayerId = Date.now();
            // This is called when the page loads.
            var data = {
                theFunc: 'addPlayer',
                roomId: roomId,
                playerId: myPlayerId
            };
            socket.emit('joingameroom', data);
            // Add the player to our own gameworld
            gameworld.gameEngine.addPlayer(data);
            // gameworld.syncThePlayers(data.thePlayers);
            // gameworld.start();
            console.log('This browser id is ' + data.playerId);
        });
    });

    socket.on('client_update', function(data){
        if(data && data.theFunc) {
            gameworld.gameEngine.callFunc(data);
        } else {
            console.log('receive_gameworld_update failed. Data is ' + data + '\n');
        }
    });
});

