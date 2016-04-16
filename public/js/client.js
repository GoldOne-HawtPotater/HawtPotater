// connect to the socket
var socket = io();

$(function(){
    // Create an asset manager.
    var ASSET_MANAGER = new AssetManager();
    
    // Create the gameworld.
    var gameworld = new GameWorld();

    // Create a game engine for the client
    var gameEngine = new GameEngine();

    // Get the game field (I think this is the canvas?)
    var field = document.getElementById("field");

    // Get the context
    var ctx = $("#gameWorldCanvas")[0].getContext("2d");

    // Getting the roomId of the room from the url
    var roomId = Number(window.location.pathname.match(/\/game\/(\d+)$/)[1]);

    // The user player id
    var myPlayerId;

    /** Set up the sockets the client needs to listen to **/
    socket.on('sync_worlds', function (serverGameWorld) {
        gameEngine.gameworld.syncTheWorlds(serverGameWorld);
    });

    // on connection to server get the roomId of person's room
    socket.on('connect', function(){
        // This is called when the page loads.
        socket.emit('load', roomId);
    });

    // receive the names of all people in the game room
    socket.on('joingame', function(data){
        var queueDownloads = function() {
            ASSET_MANAGER.queueDownload("../img/unnamed.jpg");
            //... Add more asssets below.
        };

        if (gameworld.players.size < 4) {
            /** Download the assets **/
            queueDownloads();
            ASSET_MANAGER.downloadAll(function () {
                myPlayerId = data.playerId;
                gameEngine.init(ctx, gameworld);
                gameEngine.gameworld.syncTheWorlds(data.theWorld);
                gameEngine.gameworld.start();

                var sendData = {
                    theFunc: 'addPlayer',
                    playerId: myPlayerId,
                    roomId: roomId
                };

                // Add user to the game world.
                gameEngine.gameworld.callFunc(sendData);
                // Add the user to the game world on the server.
                socket.emit('login', sendData);
            });
        } else {
            // There's too many players. 
            // Show a message saying there is too many players
            // Possibly allow them to spectate the game.
        }
    });

    socket.on('addNewPlayer', function (data) {
        console.log('addNewPlayer from ' + data.playerId);
        if (data) {
            gameEngine.gameworld.addPlayer(data);
        }
    });

    socket.on('startGame', function(data){
        if(data.boolean && data.roomId == roomId) {
            console.log('The game is starting.');
            console.log('Current users in game: ' + data.users);
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

    socket.on('receive_player_update', function(data){
        if(data && data.theFunc) {
            gameEngine[data.theFunc](data);
        } else {
            console.log('receive_player_update failed. Data is null.');
            console.log(data);
        }
    });

    socket.on('receive_gameworld_update', function(data){
        if(data && data.theFunc) {
            gameEngine.gameworld.callFunc(data);
        } else {
            console.log('receive_gameworld_update failed. Data is null.');
            console.log(data);
        }
    });

    // socket.on('error', function (err) {
    //   if (err.description) throw err.description;
    //   else throw err; // Or whatever you want to do
    // });
});
