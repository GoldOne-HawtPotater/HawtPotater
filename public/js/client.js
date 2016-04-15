// connect to the socket
var socket = io();

$(function(){
    // Create an asset manager.
    var ASSET_MANAGER = new AssetManager();
    
    // Create the gameworld.
    var gameworld = new GameWorld();

    // Get the game field (I think this is the canvas?)
    var field = document.getElementById("field");

    // Get the context
    var ctx = $("#gameWorld")[0].getContext("2d");

    // Getting the roomId of the room from the url
    var roomId = Number(window.location.pathname.match(/\/game\/(\d+)$/)[1]);

    // Create a game engine for the client
    var gameEngine = new GameEngine();

    /** Set up the sockets the client needs to listen to **/
    socket.on('sync', function (data) {
        gameEngine.gameworld = data;
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

        if (data.playerId < 4) {
            /** Download the assets **/
            queueDownloads();
            ASSET_MANAGER.downloadAll(function () {
                gameEngine.init(ctx, gameworld, data.playerId);
                gameEngine.start();

                var sendData = {
                    theFunc: 'addPlayer',
                    playerId: data.playerId,
                    roomId: roomId
                };

                socket.emit('login', sendData);
                socket.emit('player_update', sendData);
                gameEngine.addPlayer(sendData);
                // gameEngine.gameworld.addPlayer(sendData);
            });
        } else {
            // There's too many players. 
            // Show a message saying there is too many players
            // Possibly allow them to spectate the game.
        }
    });

    socket.on('addNewPlayer', function (data) {
        if (data) {
            gameEngine.addPlayer(data);
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
            console.log('Calling the function.');
            gameEngine.gameworld.callFunc(data);
        } else {
            console.log('Receive Player Update failed. Data is null.');
            console.log(data);
        }
    });
});
