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
	// Keep a reference so we can stop the sync.
	var gameLoopTimer = new Map();
	var currentGames = new Map();


	// Initialize a new socket.io application, named 'hawtSocket'
	var hawtSocket = io.on('connection', function (socket) {
		// When the client emits the 'load' event, let them join the room.
		socket.on('joingameroom', function(data){
			var gameRoom = findClientsSocket(io, data.roomId);
			if (gameRoom.length == 0) {
				currentGames.set(data.roomId, new GameEngine());
				socket.roomMaster = true;
				socket.emit('setroommaster', {
					playerId: data.playerId
				});
			} else {
				console.log("Setting player as controller.");
				socket.emit('setcontroller');
			}

			currentGames.get(data.roomId).addPlayer(data);

			socket.playerId = data.playerId;
			socket.roomId = data.roomId;

			socket.join(data.roomId);

			// Notify others to add you.
			socket.broadcast.to(data.roomId).emit('client_update', data);
		});

		socket.on('getGameList', function() {
			var data = {};
			var keys = currentGames.keys();
			for (var i = 0; i < keys.length; i++) {
				data[keys[i]] = {
					size: currentGames.get(keys[i]).players.size,
					gameState: currentGames.get(keys[i]).myGameState
				}
			}
			socket.emit('receiveGameList', data);
		});

		socket.on('server_update', function(data) {
			currentGames.get(socket.roomId).callFunc(data);
			io.to(socket.roomId).emit('client_update', data);
		});

		socket.on('disconnect', function() {
			if (socket.roomId) {
				console.log(socket.roomId);
				var roomId = this.roomId;
				console.log(this.playerId + ' has left room ' + roomId + '.');

				if (socket.roomMaster) {
					// Need to notify everyone that the room master disconnected. 
					socket.broadcast.to(roomId).emit('roommasterleft');
				}

				// leave the room
				socket.leave(roomId);

				var data = {
					theFunc: 'removePlayer',
					roomId: roomId,
					playerId: socket.playerId
				};
				socket.broadcast.to(roomId).emit('client_update', data);
				currentGames.get(roomId).callFunc(data);

				var playersLeft = findClientsSocket(io, roomId);
				console.log("Players left in room " + roomId + ": " + playersLeft.length + ".\n");
				if (playersLeft == 0) {
					console.log('Removing room: ' + roomId);

					clearInterval(gameLoopTimer.get(roomId));
					gameLoopTimer.delete(roomId);
					currentGames.delete(roomId);
				} 
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


