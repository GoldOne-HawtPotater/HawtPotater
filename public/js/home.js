$(function(){
    // connect to the socket
    var socket = io();

	var gameStates = {
            0: 'waiting',
            1: 'playing',
            2: 'next level',
            3: 'count down',
            4: 'setting up'
        };

    var checkForGames = setInterval(function() {
    	socket.emit("getGameList");
    }, 2000);


    //document.getElementById("create").addEventListener("click", function (ele) {
    //    //socket.emit("receiveName", document.getElementById("namebox").value);
    //});

    //document.getElementById("gameListContainer").addEventListener("click", function () {
    //    socket.emit("receiveName", document.getElementById("namebox").value);
    //});

    socket.on("receiveGameList", function(data) {
    	var count = 0;
    	var container = $("#gameListContainer");
    	if (data) {
			container.html("");
			var playingList = [];
    		for (var key in data) {
    			count++;
    		    // 
    			("Room #" + key + " has " + data[key].size + " players.\n Game state: " + gameStates[data[key].gameState]);
    			var linkToGame = $("<a>");
    			var gameDiv = $("<div>");
    			var roomDiv = $("<div>");
    			var sizeDiv = $("<div>");
    			var statusDiv = $("<div>");

    			roomDiv.text(key);
    			sizeDiv.text(data[key].size);
    			statusDiv.text(gameStates[data[key].gameState]);

    			linkToGame.addClass("joinGameLink");
    			roomDiv.addClass("joinInfo").addClass("joinNumber");
    			sizeDiv.addClass("joinInfo").addClass("joinSize");
    			statusDiv.addClass("joinInfo").addClass("joinStatus");

    			linkToGame.attr("href", "/game/" + key);

    			linkToGame.append(gameDiv.append(roomDiv)
    				.append(sizeDiv)
    				.append(statusDiv));

    			if (data[key].gameState == 0) { // if waiting
    				container.append(linkToGame);
    			} else {
    				playingList.push(linkToGame);
    			}
    		}
    		for (var i = 0; i < playingList.length; i++) {
    			container.append(playingList[i]);
    		}
    	} 
    	if (count == 0) {
    		container.append("<div>There are currently no available games. Please create one.</div>");
    	}
    });
});