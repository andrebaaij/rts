/* global Image,document,window,setTimeout,console,XMLHttpRequest,common,game */

/* jshint loopfunc: true */

var level = {};

var firstNode = {};
var currentNode = {};

level.initialise = function() {
    this.load("west.json");
    
    //Interfaces 
    game.calculatefog = level.calculatefog;
    game.getChunk = level.chunks.get;
    game.getLevel = level.get;
    game.getPath = level.getPath;
};

level.load = function (jsonFilename) {
//    var URI = "./assets/maps/" + jsonFilename;
//    this.definition = common.getJSONFromURI(URI);
//    
//    //Add a layer with history of walked tiles.
//    
//    var historyLayer = {
//        data:Array.apply(null, new Array(level.definition.width * level.definition.height)).map(Number.prototype.valueOf,2),
//        height:level.definition.height,
//        name:"history",
//        type:"historylayer",
//        visible:true,
//        width:level.definition.width,
//        x:0,
//        y:0
//    };
//    
//    this.definition.layers.push(historyLayer);
//    
//    level.layers = {};
//    level.definition.layers.forEach(function(layer, index) {
//        level.layers[layer.name] = layer;
//    });
//    
//    game.variables.tile = {
//        width : this.definition.tilewidth,
//        height : this.definition.tileheight
//    };
//    
//    //fill resources layer
//    level.layers.resources.data = Array.apply(null, new Array(level.definition.width * level.definition.height)).map(Number.prototype.valueOf,4);
//
//    //generate iron resources
//    for (var i = 0; i < level.definition.width*level.definition.height; i++) {
//        y = Math.floor(i / level.definition.width);
//        x = i - level.definition.width * y;
//        
//        var n = Perlin.noise(x/20,y/20, game.variables.seed);
//        n = Math.cos(n*5);
//        
//        var d = Math.round(n * 10)
//        
//        level.layers.iron.data[i] = d <= 0 ? 1 : d + 1;
//    }
//    
//    level.calculatefog();
    
    
    
    
    game.variables.tile = {
        width : 64,
        height : 32
    };
    
    
    
    level.chunks = [];
    
    // Layers
    level.layers = {};
    
    level.layers.background = {
        name : "background",
        type : "tile",
        visible : true,
        tileset : common.resources.tilesets.get("tiles"),
        size : game.variables.chunk.size,
        data : [],
        generate : function(x, y) {
            return 0;
        }
    };
    level.layers.history = {
        name : "history",
        type : "data",
        visible : false,
        tileset : common.resources.tilesets.get("gameTiles"),
        size : game.variables.chunk.size,
        data : [],
        generate : function(x, y) {
            return 1;
        }
    };
    level.layers.calculateFog = {
        name : "calculateFog",
        type : "data",
        visible : false,
        tileset : common.resources.tilesets.get("gameTiles"),
        size : game.variables.chunk.size,
        data : [],
        generate : function(x, y) {
            return 1;
        }
    };
    level.layers.resources = {
        name : "resources",
        type : "tile",
        visible : false,
        tileset : common.resources.tilesets.get("gameTiles"),
        size : game.variables.chunk.size,
        data : [],
        generate : function(x, y) {
            return 1;
        }
    };
    level.layers.resources.layers = {};
    level.layers.resources.layers.iron = {
        name : "resources_iron",
        type : "tile",
        visible : true,
        tileset : common.resources.tilesets.get("iron"),
        size : game.variables.chunk.size,
        data : [],
        generate : function(x, y) {
            return 1;
        }
    };
    level.layers.selection = {
        name : "selection",
        type : "selection",
        visible : true,
        size : game.variables.chunk.size
    };
    level.layers.objects = {
        name : "objects",
        type : "objects",
        visible : true,
        size : game.variables.chunk.size
    };
    level.layers.fog = {
        name : "fog",
        type : "tile",
        visible : true,
        tileset : common.resources.tilesets.get("gameTiles"),
        size : game.variables.chunk.size,
        data : [],
        generate : function(x, y) {
            return 1;
        }
    };
};

level.chunk = function(x, y){
    var _self = this;
    
    _self.x = x;
    _self.y = y;
    
    _self.size = game.variables.chunk.size;
    
    _self.layers = {};
};

level.chunk.prototype.generate = function() {
    var _self = this;
};

level.chunk.prototype.getLayer = function(layer) {
    var _self = this;
    
    if (_self.layers[layer.name]) {
        if (_self.layers[layer.name].canvas === null && layer.type === 'tile') {
            _self.drawLayer(_self.layers[layer.name]);
        }
        return _self.layers[layer.name];    
    } else {
        return _self.createLayer(layer);
    }
    
};

level.chunk.prototype.createLayer = function(layer) {
    var _self = this;
    
    _self.layers[layer.name] = {
        data : [],
        tileset : layer.tileset
    };
    
    var chunkSize = _self.size;
    var chunkX = _self.x;
    var chunkY = _self.y;
    
    // GENERATE
    if (layer.generate) {
        for (var y = 0; y < chunkSize; y++) {
            for (var x = 0; x < chunkSize; x++) { 
                var i = (y * _self.size + x);
                _self.layers[layer.name].data[i] = layer.generate(x, y);
            }
        }
    }
    
    if (layer.type === 'tile') {
        _self.drawLayer(_self.layers[layer.name]);
    }
    
    return _self.layers[layer.name];
};

level.chunk.prototype.drawLayer = function(layer) { 
    var _self = this;
    
    var canvasLayer = document.createElement('canvas'); // Create a new canvas, with a render chunk we can just dispose of any pre-existing chunk and create a new canvas element
    canvasLayer.context = canvasLayer.getContext("2d");
     
    canvasLayer.width = _self.size * game.variables.tile.width; 
    canvasLayer.height = _self.size * game.variables.tile.height;
    
    // Sometimes the tileset is not loaded yet, then we don't have any images to draw the chunk,
    // so we can safely return and retry it later.
    

    if (!layer.tileset.isLoaded) {
        layer.canvas = null;
        return null;
    }
    
    // Assign tileset data to variables for easy use.
    var tileWidth = game.variables.tile.width;
    var tileHeight = game.variables.tile.height;
    
    for (var i = 0; i < _self.size * _self.size; i++) {
        var x = i % _self.size;
        var y = Math.floor(i / _self.size);
        
        var sx = layer.data[i] % layer.tileset.tilesPerRow;
        var sy = (layer.data[i] - sx) / layer.tileset.tilesPerRow;

        canvasLayer.context.drawImage(layer.tileset,
                               sx * tileWidth,
                               sy * tileHeight,
                               tileWidth,
                               tileHeight,
                               (_self.size * tileWidth / 2) + Math.round(0.5*(x-y)*tileWidth) - (tileWidth / 2),
                               Math.round(0.5*(x+y)*tileHeight),
                               tileWidth,
                               tileHeight
                            );
    }   
    
    layer.canvas = canvasLayer;

    return canvasLayer;
};

level.getChunk = function(x, y) {
    if(level.chunks[x] && level.chunks[x][y]) {
        return level.chunks[x][y];
    } else {
        if (!level.chunks[x]) level.chunks[x] = [];
        level.chunks[x][y] = new level.chunk(x, y);
        return level.chunks[x][y];
    }
}

level.get = function() {
    var self = level.definition;
    return level.definition;
};

level.makeNode = function (index, previousNodeOnShortestPath, distance) {
    return {previous:null, index:index, previousNodeOnShortestPath: previousNodeOnShortestPath, distance:distance, next:null};
};

level.addNode = function (node) {
    while (true) {
        if (currentNode.distance == node.distance) {
            if (currentNode.next !== null) {
                currentNode.next.previous = node;
                node.next = currentNode.next;
            }
            currentNode.next = node;
            node.previous = currentNode;
            return;
        } else if (currentNode.distance < node.distance) {
            if (currentNode.next !== null) {
                if (currentNode.next.distance >= node.distance) {
                    currentNode.next.previous = node;
                    node.next = currentNode.next;
                    currentNode.next = node;
                    node.previous = currentNode;
                    return;
                } else {
                    currentNode = currentNode.next;
                    continue;
                }
            } else {
                currentNode.next = node;
                node.previous = currentNode;
                return;
            }
        } else if (currentNode.distance > node.distance) {
            if (currentNode.previous !== null) {
                if (currentNode.previous.distance <= node.distance) {
                    currentNode.previous.next = node;
                    node.previous = currentNode.previous;
                    currentNode.previous = node;
                    node.next = currentNode;
                    return;
                } else {
                    currentNode = currentNode.previous;
                    continue;
                }
            } else {
                currentNode.previous = node;
                node.next = currentNode;
                firstNode = node;
                return;
            }
        }
    }
};

level.getNeighbours = function (index, distance) {
    var array = [];
    array.push({index:index + this.definition.width - 1, distance:2 + distance});
    array.push({index:index - this.definition.width + 1, distance:2 + distance});
    array.push({index:index + this.definition.width + 1, distance:1 + distance});
    array.push({index:index - this.definition.width - 1, distance:1 + distance});
    array.push({index:index + this.definition.width, distance:0.999 + distance});
    array.push({index:index + 1, distance:0.999 + distance});
    array.push({index:index - this.definition.width, distance:0.999 + distance});
    array.push({index:index - 1, distance:0.999 + distance});
    return array;
};

level.printPath = function (node) {
    var tileset = this.definition.tilesets[0];
    
    var tilewidth = tileset.tilewidth;
    var tileheight = tileset.tileheight;
    
    var array = [];
    
    while (true) {
        var right = node.index % this.definition.width;
        var left = (node.index - right) / this.definition.width;
        var x = 0.5*tilewidth*(right - left)+ tilewidth*0.5;
        var y = 0.5*tileheight*(1+left+right);
        array.push({x:x, y:y});

        node = node.previousNodeOnShortestPath;
        if (node === null) {
            array.pop();
            return array.reverse();
        }
    }
    return array.reverse;
};

level.getPath = function(object, destination) {
    var _self = level;
    
    return [destination];
    
    var tileset = _self.definition.tilesets[0];
    
    var tilewidth = tileset.tilewidth;
    var tileheight = tileset.tileheight;
    
    var left = Math.floor((object.y*tilewidth - object.x*tileheight)/(tilewidth*tileheight));
    var right = Math.floor((object.y*tilewidth + object.x*tileheight)/(tilewidth*tileheight));
    var index = level.definition.width * left + right;
    
    var coordinates = common.getGridFromCoordinates(destination.x, destination.y);
    
    left = Math.floor((destination.y*tilewidth - destination.x*tileheight)/(tilewidth*tileheight));
    right = Math.floor((destination.y*tilewidth + destination.x*tileheight)/(tilewidth*tileheight));
    var destinationIndex = _self.definition.width * left + right;
    
    destinationIndex = coordinates.index;
    
    var layer = level.layers.background;
    var visitedNotes = [];
    
    var currentPosition = _self.makeNode(index,null,0);
    visitedNotes[index] = 1;
    firstNode = currentPosition;
    currentNode = currentPosition;
    
    while (visitedNotes[destinationIndex] === undefined) {
        var neighbours = _self.getNeighbours(firstNode.index, firstNode.distance);
        while (neighbours.length > 0) {
            var neighbour = neighbours.pop();
            if (neighbour.index >= 0 && visitedNotes[neighbour.index] === undefined) {
                if (layer.data[neighbour.index] < 15) {
                visitedNotes[neighbour.index] = 1;
                if (neighbour.index == destinationIndex) {
                    return _self.printPath(_self.makeNode(neighbour.index, firstNode, neighbour.distance));
                }
                _self.addNode(_self.makeNode(neighbour.index, firstNode, neighbour.distance));
                }
            }
        }
        firstNode.next.previous = null;
        firstNode = firstNode.next;
    }
};

level.calculatefog = function() {
    var arrObjects = game.getObjects();
    var handledObjects = [];
    var objectsBeingHandled = [];

    arrObjects.forEach(function(object, index) {
        if (object.name === 'mind') {
            objectsBeingHandled.push(object);
           
        }
    
    });
    
    var thereAreNewObjectsToBeHandled = true;
    
    while(thereAreNewObjectsToBeHandled) {
        thereAreNewObjectsToBeHandled = false;
        
        objectsBeingHandled.forEach(function(object, index) {

            for(var x = object.grid.x - object.communicationRadius; x <= object.grid.x + object.communicationRadius; x++) {
                for(var y = object.grid.y - object.communicationRadius; y <= object.grid.y + object.communicationRadius; y++) {        
                    var chunkX = Math.floor(x / game.variables.chunk.size);
                    var chunkY = Math.floor(y / game.variables.chunk.size);

                    var dx = x % game.variables.chunk.size;
                    var dy = y % game.variables.chunk.size;
                    
                    if (dx < 0) dx = game.variables.chunk.size + dx;
                    if (dy < 0) dy = game.variables.chunk.size + dy;
                    
                    level.getChunk(chunkX, chunkY).getLayer(level.layers.calculateFog).data[dy * game.variables.chunk.size + dx] = -1;
                    level.getChunk(chunkX, chunkY).getLayer(level.layers.history).data[dy * game.variables.chunk.size + dx] = 3;
                }
            }
            
            
            var objectsWithinCommunicationRadius = game.findObject(object.grid.x - object.communicationRadius,
                                          object.grid.y - object.communicationRadius, 
                                          object.grid.x + object.communicationRadius,
                                          object.grid.y + object.communicationRadius);
            
            objectsWithinCommunicationRadius.forEach(function(objectWithinCommunicationRadius, index) {                
                if (handledObjects.indexOf(objectWithinCommunicationRadius) === -1 && objectsBeingHandled.indexOf(objectWithinCommunicationRadius) === -1 ) {
                    objectsBeingHandled.push(objectWithinCommunicationRadius);
                    thereAreNewObjectsToBeHandled = true;

                }
            });

            handledObjects.push(object);
            delete objectsBeingHandled[index];
        });
    }
    
    
    for(var x in level.chunks) {    
        if ((!isNaN(parseFloat(x)) && isFinite(x))) {
            for (var y in level.chunks[x]) {
                if ((!isNaN(parseFloat(y)) && isFinite(y))) {
                    var chunk = level.chunks[x][y];
                    if (!chunk.getLayer(level.layers.calculateFog).data.equals(chunk.getLayer(level.layers.fog).data)) {
                        chunk.getLayer(level.layers.fog).data.forEach(function(n, i, array) {
                            array[i] = chunk.getLayer(level.layers.calculateFog).data[i];
                        });
                        chunk.drawLayer(chunk.getLayer(level.layers.fog));
                    }
                }
            }
        }
    } 
};