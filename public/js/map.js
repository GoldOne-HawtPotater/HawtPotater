(function(name,data){
 if(typeof onTileMapLoaded === 'undefined') {
  if(typeof TileMaps === 'undefined') TileMaps = {};
  TileMaps[name] = data;
 } else {
  onTileMapLoaded(name,data);
 }})("map",
{ "height":20,
 "layers":[
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 23, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 23, 23, 24, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 15, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":20,
         "name":"tileLayer",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":22,
         "x":0,
         "y":0
        }, 
        {
         "draworder":"topdown",
         "height":20,
         "name":"collisionLayer",
         "objects":[
                {
                 "height":98,
                 "id":3,
                 "name":"platform",
                 "rotation":0,
                 "type":"",
                 "visible":true,
                 "width":1416,
                 "x":-4,
                 "y":1068
                }, 
                {
                 "height":2272,
                 "id":4,
                 "name":"",
                 "rotation":0,
                 "type":"",
                 "visible":true,
                 "width":0,
                 "x":0,
                 "y":-1000
                }, 
                {
                 "height":2272,
                 "id":5,
                 "name":"",
                 "rotation":0,
                 "type":"",
                 "visible":true,
                 "width":0,
                 "x":1406,
                 "y":-1000
                }, 
                {
                 "height":6,
                 "id":6,
                 "name":"",
                 "rotation":0,
                 "type":"",
                 "visible":true,
                 "width":204,
                 "x":1116,
                 "y":990.666666666667
                }, 
                {
                 "height":7.33333333333326,
                 "id":7,
                 "name":"",
                 "rotation":0,
                 "type":"",
                 "visible":true,
                 "width":140.666666666667,
                 "x":1239.33333333333,
                 "y":928
                }],
         "opacity":1,
         "type":"objectgroup",
         "visible":true,
         "width":22,
         "x":0,
         "y":0
        }],
 "nextobjectid":9,
 "orientation":"orthogonal",
 "renderorder":"right-down",
 "tileheight":64,
 "tilesets":[
        {
         "columns":7,
         "firstgid":1,
         "image":"..\/img\/platforms\/map_spritesheet_01.png",
         "imageheight":448,
         "imagewidth":448,
         "margin":0,
         "name":"map_spritesheet_01",
         "spacing":0,
         "tilecount":49,
         "tileheight":64,
         "tilewidth":64,
         "transparentcolor":"#ffffff"
        }],
 "tilewidth":64,
 "version":1,
 "width":22
});