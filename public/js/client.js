
$(function(){
    // Create an asset manager.
    var ASSET_MANAGER = new AssetManager();
    
    // Create the gameworld.
    var gameworld = new GameWorld();

    // connect to the socket
    var socket = io();

    // Get the game field (I think this is the canvas?)
    var field = document.getElementById("field");

    // Get the context
    var ctx = $("#gameWorld")[0].getContext("2d");

    // Getting the id of the room from the url
    var id = Number(window.location.pathname.match(/\/game\/(\d+)$/)[1]);

    // Create a game engine for the client
    var gameEngine = new GameEngine();

    // Set up variables
    var player_num;


    /** Set up the sockets the client needs to listen to **/

    socket.on('sync', function (data) {
        gameEngine.gameworld = data;
    });

    // on connection to server get the id of person's room
    socket.on('connect', function(){
        // This is called when the page loads.
        socket.emit('load', id);
    });

    // receive the names of all people in the game room
    socket.on('joingame', function(data){
        if (data.player_id < 4) {
            player_num = data.player_id + 1;
            socket.emit('login', {
                player_num: player_num,
                id: id
            });
        } else {
            // There's too many players. 
            // Show a message saying there is too many players
            // Possibly allow them to spectate the game.
        }
    });

    socket.on('startGame', function(data){
        if(data.boolean && data.id == id) {
            console.log('The game is starting.');
            console.log('Current users in game: ' + data.users);
        }
    });

    socket.on('leave',function(data){
        if(data.boolean && id==data.room){

        }
    });

    socket.on('tooMany', function(data){
        // then spectate? We can let the client watch the game server.
        if(data.boolean && name.length === 0) {

        }
    });

    socket.on('receive_player_update', function(data){
        if(data) {
            gameworld.move(data);
        }
    });


    /** Download the assets **/

    // ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
    // ASSET_MANAGER.queueDownload("./img/black.png");
    ASSET_MANAGER.queueDownload("../img/unnamed.jpg");

    ASSET_MANAGER.downloadAll(function () {
        gameEngine.init(ctx, gameworld);
        gameEngine.start();
    });
});
