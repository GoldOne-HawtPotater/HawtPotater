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
	// var Entity = require('./public/js/entity').Entity;
	var GameWorld = require('./public/js/gameworld').GameWorld;
    var gameworlds = new Map();

	// Initialize a new socket.io application, named 'hawtSocket'
	var hawtSocket = io.on('connection', function (socket) {
		// Keep a reference so we can stop the sync.
		var gameSyncTimer = new Map();
		// The delay in which we update everyone's gameworld.
		var syncDelayInMilli = 2000;

		// When the client emits the 'load' event, let them join the room.
		socket.on('load',function(roomId){
			var room = findClientsSocket(io,roomId);
			if (room.length == 0) {
				// Create a new game world for the room.
				gameworlds.set(roomId, new GameWorld());
				// Sync the game world with other players.
 				gameSyncTimer.set(roomId, setInterval(function () {
 					// Check if the players are ready to play.
 					if (gameworlds.get(roomId) 
 						&& gameworlds.get(roomId).playersAreReady() 
 						&& !gameworlds.get(roomId).gameStarted
 						&& gameworlds.get(roomId).players.length > 2) {
 						console.log('Game is starting for room #' + roomId + '\n');
	        			gameworlds.get(roomId).gameStarted = true;
	        			io.to(roomId).emit('receive_player_update', {
	        				theFunc: 'startTheGame'
	        			});
	        		}
 					// Send the server room game world to clients.
		        	// io.to(roomId).emit('sync_worlds', gameworlds[roomId]);
		        }, syncDelayInMilli));
			}
		    if (room.length < 4) {
				socket.emit('joingame', {
					playerId: room.length,
					theWorld: gameworlds.get(roomId)
				});	
		    } else {
		    	// If there are too many players, emit the 'tooMany' event
		    	// and take care of the situation in client.js
		    	socket.emit('tooMany', {boolean: true});
		    }
		});

		// When the client emits 'login', save his name, 'and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.roomId);
			// Only 4 people per room are allowed
			if (room.length < 4) {

				// Use the socket object to store data. Each client gets
				// their own unique socket object
				socket.user = 'Player ' + data.playerId;
				socket.room = data.roomId;

				// Add the client to the room
				socket.join(data.roomId);
				// Tell server to add the user.
				gameworlds.get(data.roomId).callFunc(data);
				// Tell everyone else to add the user.
				socket.broadcast.to(socket.room).emit('receive_gameworld_update', data);

				console.log(socket.user + ' has joined room ' + data.roomId + '.');
				console.log('There is ' + (room.length + 1) + ' player(s) in room ' + data.roomId + '.\n');
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		// Somebody left the game
		socket.on('disconnect', function() {

			// Notify the other person in the game room
			// that his partner has left

			var roomId = this.room;
			console.log(this.user + ' has left room ' + this.room + '.');

			socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username
			});

			// leave the room
			socket.leave(socket.room);


			var playersLeft = findClientsSocket(io, roomId);
			console.log("Players left in room " + roomId + ": " + playersLeft.length + ".\n");
			if (playersLeft == 0) {
				console.log('Removing room: ' + roomId);
				clearInterval(gameSyncTimer.get(roomId));
				gameSyncTimer.delete(roomId);
				gameworlds.delete(roomId);
			}
		});

		/** Update the game with player interactions **/
		socket.on('update_clients', function(data) {
			console.log('Updating everyone else. Calling ' + data.theFunc + '.');
			socket.broadcast.to(socket.room).emit('receive_player_update', data);
		});

		socket.on('update_gameworld', function(data) {
			console.log('Updating server.');
			if (gameworlds.get(socket.room)) {
				gameworlds.get(socket.room).callFunc(data);
			} else {
				console.log('Server game world does not exist. Room = ' + socket.room);
			}
			console.log('Updating everyone else.');
			socket.broadcast.to(socket.room).emit('receive_gameworld_update', data);
		});

		// socket.on('error', function (err) {
		//   if (err.description) throw err.description;
		//   else throw err; // Or whatever you want to do
		// });

		socket.on('error', function (err) {
			if (err.description) {
				console.log('routes.on[error.desc]: ' + err.description);
				throw err.description;
			} else {
				console.log('routes.on[error]: ' + err)
				throw err; // Or whatever you want to do
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


