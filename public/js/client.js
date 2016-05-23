$(function(){
    // Taken from stackoverflow. Thanks philipvr and Michael Zaporozhets!
    function mobilecheck() {
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    }

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

    // A flag to see if you are the room master
    var roomMaster = false;

    var that = this;


    function startInput() {
        console.log('Starting input');
        /** Set up the key listeners **/
        $('#gameWorldCanvas').attr("tabindex", "0").focus();
        var gamescreen = $(window);

        // Disable scroll keys
        var keys = {37: 1, 38: 1, 39: 1, 40: 1, 32: 1};
        gamescreen.keydown(function(e) {
            if (keys[e.keyCode]) {
                e = e || window.event;
                if (e.preventDefault) e.preventDefault();
                e.returnValue = false;  
                return false;
            }
        });

        gamescreen.keydown(function(e) {
           var key = e.which;
           var data;
           switch(key) {
                case 82: // {r} key
                    //if (!gameworld.gameStarted) {
                        data = {
                            theFunc: 'toggleReady',
                            playerId: myPlayerId
                        };
                        socket.emit('server_update', data);
                    //}
                    break;
                //case 50: // {2} key, testing code to spawn powerUp
                //   data = {
                //       theFunc: 'addPowerUps'
                //   };
                //   socket.emit('server_update', data);
                //   break;
                case 32: // spacebar (jump)
                    data = {
                        theFunc: 'jumpPlayer',
                        playerId: myPlayerId,
                        value: true
                    };
                    var player = gameworld.gameEngine.playersB2d.get(myPlayerId);
                    var playerEnt = gameworld.gameEngine.players.get(myPlayerId);
                    if (player.GetLinearVelocity().y == 0 || (player.GetLinearVelocity().y != 0 && playerEnt.multiJumpCounter > 0)) {
                        socket.emit('server_update', data);
                    }
                    break;
                case 37: //left
                    data = {
                        theFunc: 'movePlayer',
                        playerId: myPlayerId,
                        direction: key,
                        value: true
                    };
                    if (!gameworld.gameEngine.players.get(myPlayerId).isMovingLeft) {
                        socket.emit('server_update', data);
                        // gameworld.gameEngine.movePlayer(data);
                    }
                    break;
                case 39: //right
                    data = {
                        theFunc: 'movePlayer',
                        playerId: myPlayerId,
                        direction: key,
                        value: true
                    };
                    if (!gameworld.gameEngine.players.get(myPlayerId).isMovingRight) {
                        socket.emit('server_update', data);
                        // gameworld.gameEngine.movePlayer(data);
                    }
                    break;
                case 88: // x key
                    data = {
                        theFunc: 'dodge',
                        playerId: myPlayerId
                    };
                    socket.emit('server_update', data);
                    break;
                case 38: //up
                    break;
                case 40: //down
                    break;
                case 90: // z
                    data = {
                        theFunc: 'attack',
                        playerId: myPlayerId
                    };
                    socket.emit('server_update', data);
                    break
                case 81: // q
                    data = {
                        theFunc: 'switchCharacter',
                        playerId: myPlayerId
                    }
                    if (!gameworld.gameEngine.players.get(myPlayerId).isReady) {
                        socket.emit('server_update', data);
                    }
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
        var queueDownloads = function () {
            // ASSET_MANAGER.queueDownload("../img/background_3.jpg");
            ASSET_MANAGER.queueDownload("../img/clouds_highres.png");
            ASSET_MANAGER.queueDownload("../img/new_potato.png");
            //ASSET_MANAGER.queueDownload("../img/arrow.png");
            ASSET_MANAGER.queueDownload("../img/powerups/jump.png");
            ASSET_MANAGER.queueDownload("../img/platforms/map_spritesheet_01.png");
            ASSET_MANAGER.queueDownload("../img/platforms/tilesheet_complete.png");

            // Dog
            var numberOfFrames = 15;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/dog/stand_' + i + '.png');
            }
            numberOfFrames = 6;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/dog/move_' + i + '.png');
            }
            numberOfFrames = 4;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/dog/jump_' + i + '.png');
            }

            //ASSET_MANAGER.queueDownload('../img/animals/dog/jump_0.png');

            // Sheep
            numberOfFrames = 3;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/sheep/move_' + i + '.png');
            }
            numberOfFrames = 4;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/sheep/stand_' + i + '.png');
            }
            numberOfFrames = 3;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/sheep/jump_' + i + '.png');
            }

            //ASSET_MANAGER.queueDownload('../img/animals/sheep/jump_0.png');

            // Pig
            numberOfFrames = 2;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/pig/move_' + i + '.png');
            }
            numberOfFrames = 3;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/pig/stand_' + i + '.png');
            }
            numberOfFrames = 3;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/pig/jump_' + i + '.png');
            }
            //ASSET_MANAGER.queueDownload('../img/animals/pig/jump_0.png');

            // Chicken
            numberOfFrames = 3;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/chicken/move_' + i + '.png');
            }
            numberOfFrames = 4;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/chicken/stand_' + i + '.png');
            }
            numberOfFrames = 3;
            for (var i = 0; i < numberOfFrames; i++) {
                ASSET_MANAGER.queueDownload('../img/animals/chicken/jump_' + i + '.png');
            }
            //ASSET_MANAGER.queueDownload('../img/animals/chicken/jump_0.png');
        };

        /** Download the assets **/
        queueDownloads();
        ASSET_MANAGER.downloadAll(function () {
            startInput();
            myPlayerId = Date.now();
            gameworld.init(ctx, socket);
            // This is called when the page loads.
            var data = {
                theFunc: 'addPlayer',
                roomId: roomId,
                playerId: myPlayerId
            };

            gameworld.gameEngine.addPlayer(data);
            socket.emit('joingameroom', data);
            // Add the player to our own gameworld
            console.log('This browser id is ' + data.playerId);
        });
    });

    socket.on('client_update', function(data){
        if (roomMaster){
            if(data && data.theFunc) {
                gameworld.gameEngine.callFunc(data);
            } else {
                console.log('receive_gameworld_update failed. Data is ' + data + '\n');
            }
        } else {
            console.log('You are not the game master. Nothing to update.');
        }
    });

    socket.on('setroommaster', function(data) {
        if (data.playerId == myPlayerId) {
            $("#sectionCanvas").show();
            gameworld.roomMasterWorld = true;
            roomMaster = true;

            gameworld.start();
        }
    });

    socket.on('setcontroller', function(data) {
        if (mobilecheck()) {
            $("#mobileControls").show();
            $("#sectionCanvas").hide();
            $("#sectionControls").hide();
        } else if (!roomMaster) {
            $("#sectionControls").show();
            $("#sectionCanvas").hide();
            $("#mobileControls").hide();
        }
    });
});

