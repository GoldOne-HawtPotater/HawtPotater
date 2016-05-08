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


	// Initialize a new socket.io application, named 'hawtSocket'
	var hawtSocket = io.on('connection', function (socket) {
		// When the client emits the 'load' event, let them join the room.
		socket.on('joingameroom', function(data){
			var gameRoom = findClientsSocket(io, data.roomId);
			if (gameRoom.length == 0) {
				socket.roomMaster = true;
				socket.emit('setroommaster', {
					playerId: data.playerId
				});
			} else {
				console.log("Setting player as controller.");
				socket.emit('setcontroller');
			}


			socket.playerId = data.playerId;
			socket.roomId = data.roomId;

			socket.join(data.roomId);

			// Notify others to add you.
			socket.broadcast.to(data.roomId).emit('client_update', data);
		});

		socket.on('server_update', function(data) {
			io.to(socket.roomId).emit('client_update', data);
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

			socket.broadcast.to(roomId).emit('client_update', data);

			// leave the room
			socket.leave(roomId);

			var playersLeft = findClientsSocket(io, roomId);
			console.log("Players left in room " + roomId + ": " + playersLeft.length + ".\n");
			if (playersLeft == 0) {
				console.log('Removing room: ' + roomId);

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


