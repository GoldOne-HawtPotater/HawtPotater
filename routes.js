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


	/** Game Server **/
	var GameWorld = require('./public/js/gameworld').GameWorld;
    var gameworlds = [];

	// Initialize a new socket.io application, named 'hawtSocket'
	var hawtSocket = io.on('connection', function (socket) {
		// Keep a reference so we can stop the sync.
		var gameSyncTimer = [];
		// The delay in which we update everyone's gameworld.
		var syncDelayInMilli = 2000;

		// When the client emits the 'load' event, let them join the room.
		socket.on('load',function(data){
			var room = findClientsSocket(io,data);
			if (room.length == 0) {
				gameworlds[data] = new GameWorld();
				console.log(gameworlds[data]);
			}
		    if (room.length < 4) {
				socket.emit('joingame', {
					playerId: room.length
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
				socket.broadcast.to(socket.room).emit('addNewPlayer', data);

				console.log(socket.user + ' has joined room ' + data.roomId + '.');
				console.log('There is ' + (room.length + 1) + ' player(s) in room ' + data.roomId + '.');

				if (room.length == 1) {
					// Add all the users
					var players = [];
					for(var i = 0; i < room.length; i++) {
						players.push(room[i].user);
					}
					// And then add yourself.
					players.push(socket.user);

					// Send the startGame event to all the people in the
					// room, along with a list of people that are in it.
					console.log('Starting the game for room ' + data.roomId);
					hawtSocket.in(data.roomId).emit('startGame', {
						boolean: true,
						roomId: data.roomId,
						users: players
					});

					// Update everybody's gameworld with server gameworld.
			        gameSyncTimer[data.roomId] = setInterval(function () {
			            //socket.broadcast.to(data.roomId).emit('sync', gameworlds[data.roomId]);
			        }, syncDelayInMilli);
				}
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		// Somebody left the game
		socket.on('disconnect', function() {

			// Notify the other person in the game room
			// that his partner has left

			console.log(this.user + " has left room " + this.room + ".");

			socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username
			});

			// leave the room
			socket.leave(socket.room);


			var playersLeft = findClientsSocket(io, this.room);
			console.log("Players left in room " + this.room + ": " + playersLeft.length + ".");
			if (playersLeft == 0) {
				clearInterval(gameSyncTimer[this.room]);
				gameSyncTimer.pop(this.room);
				gameworlds.pop(this.room);
			}
		});

		/** Update the game with player interactions **/
		socket.on('update_clients', function(data) {
			console.log('Updating everyone else.');
			socket.broadcast.to(socket.room).emit('receive_player_update', data);
		});

		socket.on('update_gameworld', function(data) {
			console.log('Updating server.');
			gameworlds[socket.room].callFunc(data);
			console.log('Updating everyone else.');
			socket.broadcast.to(socket.room).emit('receive_gameworld_update', data);
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


