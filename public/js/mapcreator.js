function MapCreator(spriteSheet, map) {
	this.spriteSheet = spriteSheet;
    this.map = map;
    this.layers = map.layers;
}

MapCreator.prototype.drawMap = function (ctx, flipH, flipV) {
    var scaleH = flipH ? flipH : 1, // Set horizontal scale to -1 if flip horizontal
        scaleV = flipV ? flipV : 1; // Set verical scale to -1 if flip vertical

    var tileset = this.map.tilesets[0];
    var tileWidth = tileset.tilewidth;
    var tileHeight = tileset.tileheight;
    for (var i = 0; i < this.layers.length; i++) {
    	var currLayer = this.layers[i];
    	if (currLayer.name == 'tileLayer') {
    		// Draw the map if the name of the layer is tileLayer
    		var drawData = currLayer.data;
    		for (var j = 0; j < drawData.length; j++) {
    			if (drawData[j] != 0) {
    				var xindex = (drawData[j]-1) % tileset.columns;
    				var yindex = Math.floor((drawData[j]-1) / tileset.columns);
    				// console.log('(x,y) - : (' + (j % currLayer.width) * tileWidth + ', ' + Math.floor(j / currLayer.width) * tileHeight + ') - (' + xindex + ', ' + yindex + ')');
				    ctx.drawImage(this.spriteSheet,
				                  xindex * tileWidth, yindex * tileHeight,  // source from sheet
				                  tileWidth - 0.5, tileHeight - 0.5,
				                  (j % currLayer.width) * tileWidth, Math.floor(j / currLayer.width) * tileHeight,
                                  tileWidth, tileHeight
                                  );
    			}
    		}
    	}
    }
}