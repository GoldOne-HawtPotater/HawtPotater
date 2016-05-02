// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /game/:id
// and listens for socket.io messages.

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){
	/** Route the client to the correct place **/
	app.get('/', function(req, res){

		// Render views/home.html
		res.render('home');
	});

	app.get('/create', function(req,res){

		// Generate unique id for the room
		var id = Math.round((Math.random() * 1000000));

		// Redirect to the random room
		res.redirect('/game/'+id);
	});

	app.get('/game/:id', function(req,res){
		// Render the game.html view
		res.render('game');
	});

	// Collections
	var Map = require('collections/map');

	/** Game Server **/
	var TileMaps = require('./public/js/mapdata').TileMaps;
	var GameEngine = require('./public/js/gameengine').GameEngine;
    var listofgames = new Map();
	// Keep a reference so we can stop the sync.
	var gameLoopTimer = new Map();


	// Initialize a new socket.io application, named 'hawtSocket'
	var hawtSocket = io.on('connection', function (socket) {
		// When the client emits the 'load' event, let them join the room.
		socket.on('joingameroom', function(data){
			var gameRoom = findClientsSocket(io, data.roomId);
			if (gameRoom.length == 0) {
				listofgames.set(data.roomId, new GameEngine());
				socket.roomMaster = true;
				socket.emit('setroommaster', {
					playerId: data.playerId
				});
				var engine = listofgames.get(data.roomId);
				gameLoopTimer.set(data.roomId, setInterval(function () {
					if (engine.players.length > 1 && engine.allIsReady()) {
						// Randomly choose a map.
						// Get a random number between 1 and the TileMaps.length - 1
						var mapNum = Math.ceil(Math.random() * (Object.getOwnPropertyNames(TileMaps).length - 1) + 1); //Math.floor(Math.random() * (Object.getOwnPropertyNames(TileMaps).length - 1)) + 1;
						var data = {
							mapNum: mapNum,
							time: Date.now() + 5000
						};
						io.to(socket.roomId).emit('startTheGame', data);
						engine.setGame(data);
					} else if (engine.myGameState == engine.gameStates.playing) {
						io.to(socket.roomId).emit('client_update', {
							theFunc: 'syncTheGame',
							thePlayers: listofgames.get(socket.roomId).players
							//, theEntities: listofgames.get(socket.roomId).entities
						});
					}
				}, 2000));
			}


			socket.playerId = data.playerId;
			socket.roomId = data.roomId;

			socket.join(data.roomId);

			// Pass the current players.
			socket.emit('client_update', {
				theFunc: 'syncTheGame',
				thePlayers: listofgames.get(data.roomId).players
			});

			// Notify others to add you.
			socket.broadcast.to(data.roomId).emit('client_update', data);

			// Add you to the server.
			listofgames.get(data.roomId).addPlayer(data);
		});

		socket.on('server_update', function(data) {
			if (listofgames.get(socket.roomId)) {
				listofgames.get(socket.roomId).callFunc(data);
			} else {
				console.log('Server game world does not exist. Room = ' + socket.room);
			}
			// console.log('Updating everyone else.\n');
			socket.broadcast.to(socket.roomId).emit('client_update', data);
			// io.to(socket.roomId).emit('client_update', data);
			// io.to(socket.roomId).emit('client_update', {
			// 	theFunc: 'syncTheGame',
			// 	thePlayers: listofgames.get(socket.roomId).players,
			// 	theEntities: listofgames.get(socket.roomId).entities
			// });
		});

		socket.on('update_gameengine', function() {
			// Update the server game engine when the game master updates.
			if  (listofgames.get(socket.roomId) && socket.roomMaster) {
				listofgames.get(socket.roomId).update();
				io.to(socket.roomId).emit('client_update', {
					theFunc: 'syncTheGame',
					thePlayers: listofgames.get(socket.roomId).players
					// , theEntities: listofgames.get(socket.roomId).entities
				});
			}
		});


		socket.on('disconnect', function() {
			console.log(socket.roomId);

			var roomId = this.roomId;
			console.log(this.playerId + ' has left room ' + roomId + '.');

			if (socket.roomMaster) {
				// Need to notify everyone that the room master disconnected. 
				socket.broadcast.to(roomId).emit('roommasterleft');
			}

			var data = {
				theFunc: 'removePlayer',
				roomId: roomId,
				playerId: socket.playerId
			};
			listofgames.get(roomId).callFunc(data);
			socket.broadcast.to(roomId).emit('client_update', data);

			// leave the room
			socket.leave(roomId);

			var playersLeft = findClientsSocket(io, roomId);
			console.log("Players left in room " + roomId + ": " + playersLeft.length + ".\n");
			if (playersLeft == 0) {
				console.log('Removing room: ' + roomId);
				listofgames.delete(roomId);

				clearInterval(gameLoopTimer.get(roomId));
				gameLoopTimer.delete(roomId)
			}
		});
	});
};

function findClientsSocket(io,roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			} else {
				res.push(ns.connected[id]);
			}
		}
	}
	return res;
}


