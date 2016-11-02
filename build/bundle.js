/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../lib/phaser.d.ts"/>
	"use strict";
	var Configuration_1 = __webpack_require__(1);
	var MapGenerator_1 = __webpack_require__(2);
	var ShipBuilder_1 = __webpack_require__(3);
	var ControlEngine_1 = __webpack_require__(6);
	var SimpleGame = (function () {
	    function SimpleGame(config) {
	        this.player = null;
	        this.map = null;
	        this.layer = null;
	        this.generating = false;
	        this.enemy = null;
	        this.configuration = config;
	        this.game = new Phaser.Game(this.configuration.getGameWidth(), this.configuration.getGameHeight(), Phaser.AUTO, "content", this);
	        this.chunkRegistry = new MapGenerator_1.MapChunkRegistry(this.game.rnd, this.configuration);
	    }
	    SimpleGame.prototype.preload = function () {
	        this.game.load.image("tileset", "assets/tileset.png");
	        this.game.load.image("stars", "assets/starfield.jpg");
	        this.game.load.spritesheet("ship1", "assets/player_ship_1.png", 24, 28);
	        this.game.load.spritesheet("ship2", "assets/player_ship_2.png", 24, 28);
	        this.game.load.spritesheet("ship3", "assets/player_ship_3.png", 24, 28);
	        this.game.load.spritesheet("ship4", "assets/player_ship_4.png", 24, 28);
	        this.game.load.image("bullet", "assets/bullet.png");
	        this.game.load.spritesheet("explosion", "assets/explode.png", 128, 128);
	    };
	    SimpleGame.prototype.create = function () {
	        this.createWorld();
	    };
	    SimpleGame.prototype.update = function () {
	        // TODO: reset bullets positions when changing chunk
	        // TODO: reset enemy does not work properly, only works when enemy is following the player
	        if (this.generating === false && this.player.getX() > this.configuration.getRightBorder()) {
	            this.generating = true;
	            this.currentChunk = this.chunkRegistry.getRight(this.currentChunk);
	            this.repaintCurrentChunk();
	            var playerX = this.configuration.getLeftBorder();
	            var enemyX = playerX + (Math.abs(this.enemy.getX()) - Math.abs(this.player.getX()));
	            this.player.resetPosition(playerX, this.player.getY());
	            this.enemy.resetPosition(enemyX, this.enemy.getY());
	            this.generating = false;
	        }
	        else if (this.generating === false && this.player.getX() < this.configuration.getLeftBorder()) {
	            this.generating = true;
	            this.currentChunk = this.chunkRegistry.getLeft(this.currentChunk);
	            this.repaintCurrentChunk();
	            var playerX = this.configuration.getRightBorder();
	            var enemyX = playerX + (Math.abs(this.enemy.getX()) - Math.abs(this.player.getX()));
	            this.player.resetPosition(playerX, this.player.getY());
	            this.enemy.resetPosition(enemyX, this.enemy.getY());
	            this.generating = false;
	        }
	        else if (this.generating === false && this.player.getY() > this.configuration.getBottomBorder()) {
	            this.generating = true;
	            this.currentChunk = this.chunkRegistry.getBottom(this.currentChunk);
	            this.repaintCurrentChunk();
	            var playerY = this.configuration.getTopBorder();
	            var enemyY = playerY + (Math.abs(this.enemy.getY()) - Math.abs(this.player.getY()));
	            this.player.resetPosition(this.player.getX(), playerY);
	            this.enemy.resetPosition(this.enemy.getX(), enemyY);
	            this.generating = false;
	        }
	        else if (this.generating === false && this.player.getY() < this.configuration.getTopBorder()) {
	            this.generating = true;
	            this.currentChunk = this.chunkRegistry.getTop(this.currentChunk);
	            this.repaintCurrentChunk();
	            var playerY = this.configuration.getBottomBorder();
	            var enemyY = playerY + (Math.abs(this.enemy.getY()) - Math.abs(this.player.getY()));
	            this.player.resetPosition(this.player.getX(), playerY);
	            this.enemy.resetPosition(this.enemy.getX(), enemyY);
	            this.generating = false;
	        }
	        // TODO: set a timer to pre-generate upcoming chunks to reduce the lag effect (only repaint)
	    };
	    SimpleGame.prototype.render = function () {
	        this.game.debug.text("FPS: " + this.game.time.fps + " "
	            + " Player PV " + this.player.health + " "
	            + " Enemy PV " + this.enemy.health + " ", 2, 14, "#00ff00");
	    };
	    SimpleGame.prototype.createWorld = function () {
	        this.game.time.advancedTiming = true;
	        this.game.world.setBounds(0, 0, this.configuration.getMapChunkWidth(), this.configuration.getMapChunkHeight());
	        this.game.physics.startSystem(Phaser.Physics.P2JS);
	        this.game.physics.p2.setImpactEvents(true);
	        this.game.physics.p2.restitution = 0.8;
	        this.map = this.game.add.tilemap();
	        this.map.addTilesetImage("tileset", "tileset", this.configuration.getTileWidth(), this.configuration.getTileHeight());
	        this.currentChunk = this.chunkRegistry.getInitial();
	        this.repaintCurrentChunk();
	        this.buildPlayer();
	        this.buildEnemy();
	    };
	    SimpleGame.prototype.buildPlayer = function () {
	        var controlEngine = null;
	        if (this.configuration.playWithGamePad()) {
	            var pad = this.game.input.gamepad.pad1;
	            this.game.input.gamepad.start();
	            controlEngine = new ControlEngine_1.GamePadControlEngine(pad);
	        }
	        else {
	            controlEngine = new ControlEngine_1.KeyboardControlEngine(this.game.input.keyboard);
	        }
	        var shipBuilder = new ShipBuilder_1.ShipBuilder();
	        this.player = shipBuilder.buildSprite(this.game, "ship1", this.configuration.getMapChunkWidth() / 2, this.configuration.getMapChunkHeight() / 2, this.configuration.getPixelRatio(), controlEngine, 200, 300);
	        this.game.camera.follow(this.player);
	    };
	    SimpleGame.prototype.buildEnemy = function () {
	        var controlEngine = new ControlEngine_1.DummyControlEngine();
	        var shipBuilder = new ShipBuilder_1.ShipBuilder();
	        this.enemy = shipBuilder.buildSprite(this.game, "ship2", this.configuration.getMapChunkWidth() / 2 + 100, this.configuration.getMapChunkHeight() / 2, this.configuration.getPixelRatio(), controlEngine, 800, 50);
	        controlEngine.configure(this.player, this.enemy);
	    };
	    SimpleGame.prototype.repaintCurrentChunk = function () {
	        var newLayer = this.getLayer(this.currentChunk);
	    };
	    SimpleGame.prototype.getLayer = function (chunk) {
	        if (this.layer === null) {
	            var newLayer = this.map.create(this.currentChunk.getRandState(), this.configuration.getMapChunkWidthInTiles(), this.configuration.getMapChunkHeightInTiles(), this.configuration.getTileWidth(), this.configuration.getTileHeight());
	            newLayer.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
	            if (this.layer !== null) {
	                this.layer.destroy();
	            }
	            this.layer = newLayer;
	        }
	        var tiles = this.currentChunk.getFinalTiles();
	        var painter = new TilemapPainter();
	        painter.paint(this.map, this.layer, tiles);
	        return this.layer;
	    };
	    return SimpleGame;
	}());
	/**
	 * Paints a tile map layer with the given set of tiles, the layer will contains empty tiles around the painted tiles to
	 * allow to always keep the player centered in the screen
	 */
	var TilemapPainter = (function () {
	    function TilemapPainter() {
	    }
	    TilemapPainter.prototype.paint = function (map, layer, tiles) {
	        var nbColumns = tiles.length;
	        var nbRows = tiles[0].length;
	        for (var column = 0; column < nbColumns; column++) {
	            for (var row = 0; row < nbRows; row++) {
	                map.putTile(tiles[column][row], column, row, layer);
	            }
	        }
	    };
	    return TilemapPainter;
	}());
	window.onload = function () {
	    var configuration = new Configuration_1.default();
	    new SimpleGame(configuration);
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Global configuration for the game
	 */
	var Configuration = (function () {
	    function Configuration() {
	    }
	    Configuration.prototype.playWithGamePad = function () {
	        return false; // if false, the game will be playable with keyboard
	    };
	    Configuration.prototype.getGameWidth = function () {
	        return this.getTileWidth() * this.getGameWidthInTiles() * this.getPixelRatio();
	    };
	    Configuration.prototype.getGameHeight = function () {
	        return this.getTileHeight() * this.getGameHeightInTiles() * this.getPixelRatio();
	    };
	    Configuration.prototype.getGameWidthInTiles = function () {
	        return 13;
	    };
	    Configuration.prototype.getGameHeightInTiles = function () {
	        return 13;
	    };
	    Configuration.prototype.getPixelRatio = function () {
	        return 2;
	    };
	    Configuration.prototype.getTileWidth = function () {
	        return 24;
	    };
	    Configuration.prototype.getTileHeight = function () {
	        return 28;
	    };
	    Configuration.prototype.getMapChunkWidthInTiles = function () {
	        return 40;
	    };
	    Configuration.prototype.getMapChunkHeightInTiles = function () {
	        return 40;
	    };
	    Configuration.prototype.getMapChunkWidth = function () {
	        return this.getMapChunkWidthInTiles() * this.getTileWidth() * this.getPixelRatio();
	    };
	    Configuration.prototype.getMapChunkHeight = function () {
	        return this.getMapChunkHeightInTiles() * this.getTileHeight() * this.getPixelRatio();
	    };
	    Configuration.prototype.getHorizontalTilesToCopy = function () {
	        return this.getGameWidthInTiles() + this.getPaddingInTiles();
	    };
	    Configuration.prototype.getVerticalTilesToCopy = function () {
	        return this.getGameHeightInTiles() + this.getPaddingInTiles();
	    };
	    Configuration.prototype.getLeftBorder = function () {
	        return this.getEmptyWidthInTiles() * this.getTileWidth() * this.getPixelRatio();
	    };
	    Configuration.prototype.getRightBorder = function () {
	        return this.getMapChunkWidth() - this.getLeftBorder();
	    };
	    Configuration.prototype.getTopBorder = function () {
	        return this.getEmptyHeightInTiles() * this.getTileHeight() * this.getPixelRatio();
	    };
	    Configuration.prototype.getBottomBorder = function () {
	        return this.getMapChunkHeight() - this.getTopBorder();
	    };
	    Configuration.prototype.getEmptyWidthInTiles = function () {
	        return (this.getGameWidthInTiles() + this.getPaddingInTiles()) / 2;
	    };
	    Configuration.prototype.getEmptyHeightInTiles = function () {
	        return (this.getGameHeightInTiles() + this.getPaddingInTiles()) / 2;
	    };
	    Configuration.prototype.getPaddingInTiles = function () {
	        return 4;
	    };
	    return Configuration;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Configuration;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Represents a MapChunk, a chunk of the global map with coordinates and the tiles to display.
	 *
	 * baseTiles = only base ground tiles for sand, forrest, water and deep water
	 * smoothedTiles = ordered base tiles to avoid to have neighbour incompatibility, for instance, forrest and water
	 * finalTiles = base tiles are here replaced by rounded tiles allowing sweet transitions between grounds
	 *
	 * the rand state allows to re-generate the exact same chunk
	 *
	 * the first generated chunk has coordinates x: 0, y:0
	 */
	var MapChunk = (function () {
	    function MapChunk(baseTiles, smoothTiles, finalTiles, randState, x, y) {
	        this.baseTiles = baseTiles;
	        this.smoothTiles = smoothTiles;
	        this.finalTiles = finalTiles;
	        this.randState = randState;
	        this.positionX = x;
	        this.positionY = y;
	    }
	    MapChunk.prototype.getBaseTiles = function () {
	        return this.baseTiles;
	    };
	    MapChunk.prototype.getSmoothTiles = function () {
	        return this.smoothTiles;
	    };
	    MapChunk.prototype.getFinalTiles = function () {
	        return this.finalTiles;
	    };
	    MapChunk.prototype.getPositionX = function () {
	        return this.positionX;
	    };
	    MapChunk.prototype.getPositionY = function () {
	        return this.positionY;
	    };
	    MapChunk.prototype.getRandState = function () {
	        return this.randState;
	    };
	    return MapChunk;
	}());
	exports.MapChunk = MapChunk;
	/**
	 * Represents the registry of MapChunk, it internally generates new MapChunk on demand
	 */
	var MapChunkRegistry = (function () {
	    function MapChunkRegistry(randGenerator, configuration) {
	        this.randGenerator = randGenerator;
	        this.configuration = configuration;
	        this.generator = new MapChunkGenerator();
	        this.chunks = new Array();
	    }
	    MapChunkRegistry.prototype.getInitial = function () {
	        var x = 0;
	        var y = 0;
	        var newChunk = this.generator.generateInitial(this.randGenerator, this.configuration, x, y);
	        this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
	        return newChunk;
	    };
	    MapChunkRegistry.prototype.getTop = function (chunk) {
	        var x = chunk.getPositionX();
	        var y = chunk.getPositionY() - 1;
	        var newChunk = this.getByPosition(x, y);
	        if (newChunk === null) {
	            newChunk = this.generator.generateTopOf(chunk, this.randGenerator, this.configuration, x, y);
	            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
	        }
	        return newChunk;
	    };
	    MapChunkRegistry.prototype.getBottom = function (chunk) {
	        var x = chunk.getPositionX();
	        var y = chunk.getPositionY() + 1;
	        var newChunk = this.getByPosition(x, y);
	        if (newChunk === null) {
	            newChunk = this.generator.generateBottomOf(chunk, this.randGenerator, this.configuration, x, y);
	            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
	        }
	        return newChunk;
	    };
	    MapChunkRegistry.prototype.getRight = function (chunk) {
	        var x = chunk.getPositionX() + 1;
	        var y = chunk.getPositionY();
	        var newChunk = this.getByPosition(x, y);
	        if (newChunk === null) {
	            newChunk = this.generator.generateRightOf(chunk, this.randGenerator, this.configuration, x, y);
	            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
	        }
	        return newChunk;
	    };
	    MapChunkRegistry.prototype.getLeft = function (chunk) {
	        var x = chunk.getPositionX() - 1;
	        var y = chunk.getPositionY();
	        var newChunk = this.getByPosition(x, y);
	        if (newChunk === null) {
	            newChunk = this.generator.generateLeftOf(chunk, this.randGenerator, this.configuration, x, y);
	            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
	        }
	        return newChunk;
	    };
	    MapChunkRegistry.prototype.getByPosition = function (x, y) {
	        var key = this.getKeyFromPosition(x, y);
	        if (key in this.chunks) {
	            return this.chunks[key];
	        }
	        return null;
	    };
	    MapChunkRegistry.prototype.getKeyFromChunk = function (chunk) {
	        return chunk.getPositionX() + "-" + chunk.getPositionY();
	    };
	    MapChunkRegistry.prototype.getKeyFromPosition = function (x, y) {
	        return x + "-" + y;
	    };
	    return MapChunkRegistry;
	}());
	exports.MapChunkRegistry = MapChunkRegistry;
	/**
	 * Generates MapChunk from neighbour to be able to get consistent junctions between chunks when passing from a chunk
	 * to another (no water to forest)
	 */
	var MapChunkGenerator = (function () {
	    function MapChunkGenerator() {
	    }
	    MapChunkGenerator.prototype.generateInitial = function (rand, configuration, x, y) {
	        return this.generateFromInitTiles(rand, configuration, x, y, null);
	    };
	    MapChunkGenerator.prototype.generateLeftOf = function (chunk, rand, configuration, x, y) {
	        var initTiles = null;
	        if (chunk !== null) {
	            var copier = new NeighbourTilesCopier();
	            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.LEFT, configuration.getHorizontalTilesToCopy());
	        }
	        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
	    };
	    MapChunkGenerator.prototype.generateRightOf = function (chunk, rand, configuration, x, y) {
	        var initTiles = null;
	        if (chunk !== null) {
	            var copier = new NeighbourTilesCopier();
	            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.RIGHT, configuration.getHorizontalTilesToCopy());
	        }
	        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
	    };
	    MapChunkGenerator.prototype.generateTopOf = function (chunk, rand, configuration, x, y) {
	        var initTiles = null;
	        if (chunk !== null) {
	            var copier = new NeighbourTilesCopier();
	            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.TOP, configuration.getVerticalTilesToCopy());
	        }
	        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
	    };
	    MapChunkGenerator.prototype.generateBottomOf = function (chunk, rand, configuration, x, y) {
	        var initTiles = null;
	        if (chunk !== null) {
	            var copier = new NeighbourTilesCopier();
	            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.BOTTOM, configuration.getVerticalTilesToCopy());
	        }
	        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
	    };
	    MapChunkGenerator.prototype.generateFromInitTiles = function (rand, configuration, x, y, initTiles) {
	        var baseTilesGenerator = new BaseTilesGenerator(rand);
	        var baseTiles = baseTilesGenerator.generate(configuration.getMapChunkWidthInTiles(), configuration.getMapChunkHeightInTiles(), initTiles);
	        // TODO fix chunk transition and optimize
	        // let smoothTiles = baseTiles;
	        var smoothTilesGenerator = new SmoothTilesGenerator();
	        var smoothTiles = smoothTilesGenerator.generate(baseTiles);
	        // TODO fix chunk transition and optimize
	        // let finalTiles = smoothTiles;
	        var tilesGenerator = new FinalTilesGenerator();
	        var finalTiles = tilesGenerator.generate(smoothTiles);
	        var randState = rand.state();
	        return new MapChunk(baseTiles, smoothTiles, finalTiles, randState, x, y);
	    };
	    return MapChunkGenerator;
	}());
	/**
	 * Generates a map of clean tiles, with clean ground transitions, rounded borders, etc
	 *
	 * Huge Thx to Chmood who inspirates this generator https://github.com/Chmood/shmup/blob/gh-pages/src/js/game.js
	 */
	var FinalTilesGenerator = (function () {
	    function FinalTilesGenerator() {
	    }
	    /**
	     * Detect ground differences and corners to replace base tiles by rounded tiles
	     * @param tiles
	     * @returns {Array}
	     */
	    FinalTilesGenerator.prototype.generate = function (tiles) {
	        var roundedTiles = [];
	        for (var i = 0; i < tiles.length; i++) {
	            roundedTiles[i] = [];
	        }
	        for (var n = 1; n < Tiles.STACK.length; n++) {
	            var currentLayer = Tiles.STACK[n];
	            var upperLayer = Tiles.STACK[n - 1];
	            for (var i = 0; i < tiles.length; i++) {
	                for (var j = 0; j < tiles[i].length; j++) {
	                    // copy last tiles TODO generate one more and drop it cause we can't smooth those???
	                    if (i === tiles.length - 1 || j === tiles[i].length - 1) {
	                        roundedTiles[i][j] = tiles[i][j];
	                        continue;
	                    }
	                    var q = [[tiles[i][j], tiles[i + 1][j]], [tiles[i][j + 1], tiles[i + 1][j + 1]]];
	                    // 4 corners
	                    if (q.join() === [[upperLayer, upperLayer], [upperLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 6;
	                    }
	                    else if (q.join() === [[upperLayer, upperLayer], [upperLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 9;
	                    }
	                    else if (q.join() === [[upperLayer, upperLayer], [currentLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 8;
	                    }
	                    else if (q.join() === [[currentLayer, upperLayer], [upperLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 3;
	                    }
	                    else if (q.join() === [[upperLayer, currentLayer], [upperLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 4;
	                    }
	                    else if (q.join() === [[upperLayer, upperLayer], [currentLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 11;
	                    }
	                    else if (q.join() === [[currentLayer, upperLayer], [currentLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 5;
	                    }
	                    else if (q.join() === [[currentLayer, currentLayer], [upperLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 1;
	                    }
	                    else if (q.join() === [[upperLayer, currentLayer], [upperLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 7;
	                    }
	                    else if (q.join() === [[currentLayer, upperLayer], [upperLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 14;
	                    }
	                    else if (q.join() === [[upperLayer, currentLayer], [currentLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 13;
	                    }
	                    else if (q.join() === [[upperLayer, currentLayer], [currentLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 12;
	                    }
	                    else if (q.join() === [[currentLayer, upperLayer], [currentLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 10;
	                    }
	                    else if (q.join() === [[currentLayer, currentLayer], [currentLayer, upperLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 0;
	                    }
	                    else if (q.join() === [[currentLayer, currentLayer], [upperLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = (n - 1) * 15 + 2;
	                    }
	                    else if (q.join() === [[currentLayer, currentLayer], [currentLayer, currentLayer]].join()) {
	                        roundedTiles[i][j] = n * 15 + 6;
	                    }
	                }
	            }
	        }
	        return roundedTiles;
	    };
	    return FinalTilesGenerator;
	}());
	/**
	 * Copy neighbour tiles, to ensure that we can generate a new chunk with relevant tiles related to the next chunk,
	 * for instance, if the right side of a chunk contains forest, be sure that the left side of the next chunk contains
	 * forrest too
	 *
	 * TODO: still limited cause taking in account only a neighbour and not all existant neighbours, for instance,
	 * top and left
	 */
	var NeighbourTilesCopier = (function () {
	    function NeighbourTilesCopier() {
	    }
	    NeighbourTilesCopier.prototype.copy = function (originalTiles, direction, nbTilesToCopy) {
	        if (direction === Directions.RIGHT) {
	            return this.copyRightTiles(originalTiles, nbTilesToCopy);
	        }
	        else if (direction === Directions.LEFT) {
	            return this.copyLeftTiles(originalTiles, nbTilesToCopy);
	        }
	        else if (direction === Directions.TOP) {
	            return this.copyTopTiles(originalTiles, nbTilesToCopy);
	        }
	        else if (direction === Directions.BOTTOM) {
	            return this.copyBottomTiles(originalTiles, nbTilesToCopy);
	        }
	    };
	    /**
	     * Copy nbTilesToCopy right original tiles to left neighbour tiles
	     */
	    NeighbourTilesCopier.prototype.copyRightTiles = function (originalTiles, nbTilesToCopy) {
	        var neighbourTiles = this.buildEmptyTiles(originalTiles);
	        var sourceColumnIndex = neighbourTiles.length - 1;
	        var copyColumnIndex = 0;
	        for (var row = 0; row < neighbourTiles[0].length; row++) {
	            var copySrc = nbTilesToCopy;
	            for (var copyDest = 0; copyDest < nbTilesToCopy; copyDest++) {
	                copySrc--;
	                neighbourTiles[copyColumnIndex + copyDest][row] = originalTiles[sourceColumnIndex - copySrc][row];
	            }
	        }
	        return neighbourTiles;
	    };
	    /**
	     * Copy nbTilesToCopy left original tiles to right neighbour tiles
	     */
	    NeighbourTilesCopier.prototype.copyLeftTiles = function (originalTiles, nbTilesToCopy) {
	        var neighbourTiles = this.buildEmptyTiles(originalTiles);
	        var sourceColumnIndex = 0;
	        var copyColumnIndex = neighbourTiles.length - 1;
	        for (var row = 0; row < neighbourTiles[sourceColumnIndex].length; row++) {
	            var copyDest = nbTilesToCopy;
	            for (var copySrc = 0; copySrc < nbTilesToCopy; copySrc++) {
	                copyDest--;
	                neighbourTiles[copyColumnIndex - copyDest][row] = originalTiles[sourceColumnIndex + copySrc][row];
	            }
	        }
	        return neighbourTiles;
	    };
	    /**
	     * Copy nbTilesToCopy top original tiles to bottom neighbour tiles
	     */
	    NeighbourTilesCopier.prototype.copyTopTiles = function (originalTiles, nbTilesToCopy) {
	        var neighbourTiles = this.buildEmptyTiles(originalTiles);
	        var sourceRowIndex = 0;
	        var copyRowIndex = neighbourTiles[0].length - 1;
	        for (var column = 0; column < neighbourTiles.length; column++) {
	            var copyDest = nbTilesToCopy;
	            for (var copySrc = 0; copySrc < nbTilesToCopy; copySrc++) {
	                copyDest--;
	                neighbourTiles[column][copyRowIndex - copyDest] = originalTiles[column][sourceRowIndex + copySrc];
	            }
	        }
	        return neighbourTiles;
	    };
	    /**
	     * Copy nbTilesToCopy bottom original tiles to top neighbour tiles
	     */
	    NeighbourTilesCopier.prototype.copyBottomTiles = function (originalTiles, nbTilesToCopy) {
	        var neighbourTiles = this.buildEmptyTiles(originalTiles);
	        var sourceRowIndex = neighbourTiles[0].length - 1;
	        var copyRowIndex = 0;
	        for (var column = 0; column < neighbourTiles.length; column++) {
	            var copySrc = nbTilesToCopy;
	            for (var copyDest = 0; copyDest < nbTilesToCopy; copyDest++) {
	                copySrc--;
	                neighbourTiles[column][copyRowIndex + copyDest] = originalTiles[column][sourceRowIndex - copySrc];
	            }
	        }
	        return neighbourTiles;
	    };
	    NeighbourTilesCopier.prototype.buildEmptyTiles = function (originalTiles) {
	        var emptyTiles = new Array();
	        for (var row = 0; row < originalTiles.length; row++) {
	            emptyTiles[row] = [];
	            for (var column = 0; column < originalTiles[row].length; column++) {
	                emptyTiles[row][column] = Tiles.UNDEFINED;
	            }
	        }
	        return emptyTiles;
	    };
	    return NeighbourTilesCopier;
	}());
	/**
	 * Erase difference between tile layer, for instance, it means that forrest can touch sand but not water, sand can
	 * touch water but not deep water, etc
	 */
	var SmoothTilesGenerator = (function () {
	    function SmoothTilesGenerator() {
	    }
	    SmoothTilesGenerator.prototype.generate = function (tiles) {
	        for (var n = 0; n < Tiles.STACK.length - 1; n++) {
	            var tileCurrent = Tiles.STACK[n];
	            var tileAbove = (n > 0) ? Tiles.STACK[n - 1] : -1;
	            var tileBelow = Tiles.STACK[n + 1];
	            for (var i = 0; i < tiles.length; i++) {
	                for (var j = 0; j < tiles[i].length; j++) {
	                    if (tiles[i][j] === tileCurrent) {
	                        var isLeftUp = i > 0 && j > 0 && tiles[i - 1][j - 1] !== tileCurrent
	                            && tiles[i - 1][j - 1] !== tileAbove && tiles[i - 1][j - 1] !== tileBelow;
	                        if (isLeftUp) {
	                            tiles[i - 1][j - 1] = tileBelow;
	                        }
	                        var isMidUp = j > 0 && tiles[i][j - 1] !== tileCurrent && tiles[i][j - 1] !== tileAbove
	                            && tiles[i][j - 1] !== tileBelow;
	                        if (isMidUp) {
	                            tiles[i][j - 1] = tileBelow;
	                        }
	                        var isRightUp = i < tiles.length - 1 && j > 0 && tiles[i + 1][j - 1] !== tileCurrent
	                            && tiles[i + 1][j - 1] !== tileAbove && tiles[i + 1][j - 1] !== tileBelow;
	                        if (isRightUp) {
	                            tiles[i + 1][j - 1] = tileBelow;
	                        }
	                        var isRightMid = i < tiles.length - 1 && tiles[i + 1][j] !== tileCurrent
	                            && tiles[i + 1][j] !== tileAbove && tiles[i + 1][j] !== tileBelow;
	                        if (isRightMid) {
	                            tiles[i + 1][j] = tileBelow;
	                        }
	                        var isRightDown = i < tiles.length - 1 && j < tiles[i].length - 1
	                            && tiles[i + 1][j + 1] !== tileCurrent && tiles[i + 1][j + 1] !== tileAbove
	                            && tiles[i + 1][j + 1] !== tileBelow;
	                        if (isRightDown) {
	                            tiles[i + 1][j + 1] = tileBelow;
	                        }
	                        var isMidDown = j < tiles[i].length - 1 && tiles[i][j + 1] !== tileCurrent
	                            && tiles[i][j + 1] !== tileAbove && tiles[i][j + 1] !== tileBelow;
	                        if (isMidDown) {
	                            tiles[i][j + 1] = tileBelow;
	                        }
	                        var isLeftDown = i > 0 && j < tiles[i].length - 1 && tiles[i - 1][j + 1] !== tileCurrent
	                            && tiles[i - 1][j + 1] !== tileAbove && tiles[i - 1][j + 1] !== tileBelow;
	                        if (isLeftDown) {
	                            tiles[i - 1][j + 1] = tileBelow;
	                        }
	                        var isLeftMid = i > 0 && tiles[i - 1][j] !== tileCurrent
	                            && tiles[i - 1][j] !== tileAbove && tiles[i - 1][j] !== tileBelow;
	                        if (isLeftMid) {
	                            tiles[i - 1][j] = tileBelow;
	                        }
	                    }
	                }
	            }
	        }
	        return tiles;
	    };
	    return SmoothTilesGenerator;
	}());
	/**
	 * Procedural tiles map generator using cellular automata, it only uses base tiles (forrest, sand, water, deep water),
	 * the passed init cells are kept and not updated to ensure smooth transitions between map chunks
	 *
	 * @see https://en.wikipedia.org/wiki/Cellular_automaton
	 * @see https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
	 * @see http://fiddle.jshell.net/neuroflux/qpnf32fu/
	 */
	var BaseTilesGenerator = (function () {
	    function BaseTilesGenerator(rand) {
	        this.STATE_DEATH = Tiles.FORREST;
	        this.STATE_ALIVE_ONE = Tiles.SAND;
	        this.STATE_ALIVE_TWO = Tiles.WATER;
	        this.STATE_ALIVE_THREE = Tiles.DEEP_WATER;
	        this.rand = rand;
	    }
	    /**
	     * Generate new tiles and ensure that init tiles are kept to ensure smooth transitions between chunks
	     */
	    BaseTilesGenerator.prototype.generate = function (width, height, initTiles) {
	        var chanceToStartAlive = 4;
	        var numberOfSteps = 2;
	        var deathLimit = 3;
	        var birthLimit = 4;
	        var baseTiles = this.initialize(width, height, chanceToStartAlive);
	        for (var i = 0; i < numberOfSteps; i++) {
	            baseTiles = this.doSimulationStep(baseTiles, deathLimit, birthLimit);
	        }
	        if (initTiles !== null) {
	            baseTiles = this.copyInitTiles(baseTiles, initTiles);
	        }
	        return baseTiles;
	    };
	    /**
	     * Generate random tiles to fulfil the map
	     */
	    BaseTilesGenerator.prototype.initialize = function (width, height, chanceToStartAlive) {
	        var baseTiles = [[]];
	        for (var x = 0; x < width; x++) {
	            baseTiles[x] = [];
	            for (var y = 0; y < height; y++) {
	                if (this.rand.between(1, 10) < chanceToStartAlive) {
	                    baseTiles[x][y] = (this.rand.between(1, 10) < 3) ?
	                        this.STATE_ALIVE_ONE : (this.rand.between(1, 10) < 5) ?
	                        this.STATE_ALIVE_TWO : this.STATE_ALIVE_THREE;
	                }
	                else {
	                    baseTiles[x][y] = this.STATE_DEATH;
	                }
	            }
	        }
	        return baseTiles;
	    };
	    /**
	     * Change random tiles depending on neighbour tiles
	     */
	    BaseTilesGenerator.prototype.doSimulationStep = function (baseTiles, deathLimit, birthLimit) {
	        var newTiles = [[]];
	        for (var x = 0; x < baseTiles.length; x++) {
	            newTiles[x] = [];
	            for (var y = 0; y < baseTiles[0].length; y++) {
	                var nbs = this.countAliveNeighbours(baseTiles, x, y);
	                if (baseTiles[x][y] > this.STATE_DEATH) {
	                    if (nbs < deathLimit) {
	                        newTiles[x][y] = this.STATE_DEATH;
	                    }
	                    else {
	                        newTiles[x][y] = this.getDominantNeighbourActiveState(baseTiles, x, y);
	                    }
	                }
	                else {
	                    if (nbs > birthLimit) {
	                        newTiles[x][y] = this.getDominantNeighbourActiveState(baseTiles, x, y);
	                    }
	                    else {
	                        newTiles[x][y] = this.STATE_DEATH;
	                    }
	                }
	            }
	        }
	        return newTiles;
	    };
	    BaseTilesGenerator.prototype.countAliveNeighbours = function (baseTiles, x, y) {
	        var count = 0;
	        for (var i = -1; i < 2; i++) {
	            for (var j = -1; j < 2; j++) {
	                var nbX = i + x;
	                var nbY = j + y;
	                if (nbX < 0 || nbY < 0 || nbX >= baseTiles.length || nbY >= baseTiles[0].length) {
	                    count = count + 1;
	                }
	                else if (baseTiles[nbX][nbY] > this.STATE_DEATH) {
	                    count = count + 1;
	                }
	            }
	        }
	        return count;
	    };
	    BaseTilesGenerator.prototype.getDominantNeighbourActiveState = function (baseTiles, x, y) {
	        var counterAliveOne = 0;
	        var counterAliveTwo = 0;
	        var counterAliveThree = 0;
	        for (var i = -1; i < 2; i++) {
	            for (var j = -1; j < 2; j++) {
	                var nbX = i + x;
	                var nbY = j + y;
	                if (nbX < 0 || nbY < 0 || nbX >= baseTiles.length || nbY >= baseTiles[0].length) {
	                    continue;
	                }
	                else if (baseTiles[nbX][nbY] === this.STATE_ALIVE_ONE) {
	                    counterAliveOne = counterAliveOne + 1;
	                }
	                else if (baseTiles[nbX][nbY] === this.STATE_ALIVE_TWO) {
	                    counterAliveTwo = counterAliveTwo + 1;
	                }
	                else if (baseTiles[nbX][nbY] === this.STATE_ALIVE_THREE) {
	                    counterAliveThree = counterAliveThree + 1;
	                }
	            }
	        }
	        if (counterAliveOne > counterAliveTwo && counterAliveOne > counterAliveThree) {
	            return this.STATE_ALIVE_ONE;
	        }
	        else if (counterAliveTwo > counterAliveOne && counterAliveTwo > counterAliveThree) {
	            return this.STATE_ALIVE_TWO;
	        }
	        else {
	            return this.STATE_ALIVE_THREE;
	        }
	    };
	    /**
	     * Copy init tiles to ensure smooth transition with neighboug chunk
	     */
	    BaseTilesGenerator.prototype.copyInitTiles = function (baseTiles, initTiles) {
	        for (var x = 0; x < baseTiles.length; x++) {
	            for (var y = 0; y < baseTiles[x].length; y++) {
	                if (initTiles !== null && initTiles[x][y] >= 0) {
	                    baseTiles[x][y] = initTiles[x][y];
	                }
	            }
	        }
	        return baseTiles;
	    };
	    return BaseTilesGenerator;
	}());
	/**
	 * Allow to access base tiles (forrest, sand, water, deep water) and to the stack, aka, in which order you can
	 * encounter them, forrest can touch sand but not water or deep water, sand can touch forrest or water, etc
	 */
	var Tiles = (function () {
	    function Tiles() {
	    }
	    Tiles.UNDEFINED = -1;
	    Tiles.FORREST = 6;
	    Tiles.SAND = 6 + 15 * 1;
	    Tiles.WATER = 6 + 15 * 2;
	    Tiles.DEEP_WATER = 6 + 15 * 3;
	    Tiles.STACK = [Tiles.FORREST, Tiles.SAND, Tiles.WATER, Tiles.DEEP_WATER];
	    return Tiles;
	}());
	/**
	 * Defines constant for different directions
	 */
	var Directions = (function () {
	    function Directions() {
	    }
	    Directions.LEFT = 1;
	    Directions.RIGHT = 2;
	    Directions.TOP = 3;
	    Directions.BOTTOM = 4;
	    return Directions;
	}());
	/**
	 * Display the tiles in the log
	 */
	var TilesDebugger = (function () {
	    function TilesDebugger() {
	    }
	    TilesDebugger.prototype.display = function (tiles) {
	        var rowsString = [];
	        for (var row = 0; row < tiles[0].length; row++) {
	            rowsString[row] = "";
	        }
	        for (var column = 0; column < tiles.length; column++) {
	            for (var row = 0; row < tiles[column].length; row++) {
	                rowsString[row] = rowsString[row] + "\t" + tiles[column][row];
	            }
	        }
	        var strMap = "";
	        for (var row = 0; row < rowsString.length; row++) {
	            strMap = strMap + rowsString[row] + "\n";
	        }
	        console.log(strMap);
	    };
	    return TilesDebugger;
	}());


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var ShootingMachine_1 = __webpack_require__(4);
	var Ship_1 = __webpack_require__(5);
	var ShipBuilder = (function () {
	    function ShipBuilder() {
	    }
	    ShipBuilder.prototype.buildSprite = function (game, key, x, y, pixelRatio, controlEngine, fireRate, health) {
	        var trail = this.buildTrail(game, "explosion", x, y);
	        var shootingMachine = this.buildShootingMachine(game, "bullet", "explosion", fireRate);
	        var ship = new Ship_1.Ship(game, x, y, key, 0);
	        ship.configure(pixelRatio, trail, controlEngine, shootingMachine, health);
	        return ship;
	    };
	    ShipBuilder.prototype.buildShootingMachine = function (game, bulletKey, explosionKey, bulletSpacingMs) {
	        var bullets = this.buildBulletsPool(game, bulletKey);
	        var explosions = this.buildBulletExplosionsPool(game, explosionKey);
	        var shootingMachine = new ShootingMachine_1.ShootingMachine(bullets, explosions, game.time, bulletSpacingMs);
	        return shootingMachine;
	    };
	    ShipBuilder.prototype.buildBulletsPool = function (game, key) {
	        var bullets = game.add.group();
	        bullets.enableBody = true;
	        bullets.physicsBodyType = Phaser.Physics.P2JS;
	        game.physics.p2.enable(bullets);
	        bullets.createMultiple(30, key);
	        bullets.setAll("anchor.x", 0.5);
	        bullets.setAll("anchor.y", 0.5);
	        bullets.setAll("checkWorldBounds", true);
	        bullets.setAll("outOfBoundsKill", true);
	        bullets.setAll("outOfCameraBoundsKill", true);
	        return bullets;
	    };
	    ShipBuilder.prototype.buildBulletExplosionsPool = function (game, explosionKey) {
	        var explosions = game.add.group();
	        explosions.createMultiple(30, explosionKey);
	        explosions.forEach(function (explosion) {
	            explosion.anchor.x = 0.5;
	            explosion.anchor.y = 0.5;
	            explosion.animations.add(explosionKey);
	        }, this);
	        return explosions;
	    };
	    ShipBuilder.prototype.buildTrail = function (game, key, x, y) {
	        var trail = game.add.emitter(x - 40, y, 1000);
	        trail.width = 10;
	        trail.makeParticles(key, [1, 2, 3, 4, 5]);
	        trail.setXSpeed(20, -20);
	        trail.setRotation(50, -50);
	        trail.setAlpha(0.4, 0, 800);
	        trail.setScale(0.01, 0.1, 0.01, 0.1, 1000, Phaser.Easing.Quintic.Out);
	        return trail;
	    };
	    return ShipBuilder;
	}());
	exports.ShipBuilder = ShipBuilder;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	var ShootingMachine = (function () {
	    function ShootingMachine(bullets, explosions, time, bulletSpacingMs) {
	        this.bullets = bullets;
	        this.explosions = explosions;
	        this.time = time;
	        this.bulletTimer = 0;
	        this.bulletSpacingMs = bulletSpacingMs;
	        this.prepareCollisions(bullets);
	    }
	    // TODO to update
	    ShootingMachine.prototype.configure = function (ship) {
	        this.ship = ship;
	    };
	    ShootingMachine.prototype.shoot = function () {
	        if (this.time.now > this.bulletTimer && this.ship !== null && this.bullets !== null) {
	            var bulletSpeed = 2000;
	            var bulletLifeMs = this.bulletSpacingMs;
	            var bullet = this.bullets.getFirstExists(false);
	            if (bullet) {
	                bullet.reset(this.ship.centerX, this.ship.centerY);
	                bullet.body.angle = this.ship.body.angle;
	                bullet.body.force.x = this.ship.body.force.x;
	                bullet.body.force.y = this.ship.body.force.y;
	                bullet.body.velocity.x = this.ship.body.velocity.x;
	                bullet.body.velocity.y = this.ship.body.velocity.y;
	                bullet.body.moveForward(bulletSpeed);
	                this.bulletTimer = this.time.now + this.bulletSpacingMs;
	                this.time.events.add(bulletLifeMs, this.killBullet, this, bullet);
	            }
	        }
	    };
	    ShootingMachine.prototype.getBullets = function () {
	        return this.bullets;
	    };
	    ShootingMachine.prototype.kill = function () {
	        this.bullets.destroy();
	        this.explosions.destroy();
	    };
	    ShootingMachine.prototype.killBullet = function (bullet) {
	        bullet.kill();
	    };
	    ShootingMachine.prototype.prepareCollisions = function (bullets) {
	        bullets.forEach(function (bullet) {
	            bullet.body.onBeginContact.add(this.collideBullet, this);
	        }, this);
	    };
	    ShootingMachine.prototype.collideBullet = function (body, bodyShape, contactShape, contactEquation) {
	        if (body === null) {
	            return;
	        }
	        if (body.sprite.key === this.ship.key) {
	            return;
	        }
	        // kill the bullet
	        contactShape.body.parent.sprite.kill();
	        // cf http://stackoverflow.com/questions/23587975/detect-impact-force-in-phaser-with-p2js
	        // damage the enemy
	        var enemySprite = body.sprite;
	        var explosion = this.explosions.getFirstExists(false);
	        explosion.reset(enemySprite.centerX - enemySprite.width, enemySprite.centerY - enemySprite.height);
	        explosion.play("explosion", 30, false, true);
	        body.sprite.damage(10);
	        // TODO kill the whole object
	        // TODO kill the bullet!
	    };
	    return ShootingMachine;
	}());
	exports.ShootingMachine = ShootingMachine;


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Ship = (function (_super) {
	    __extends(Ship, _super);
	    function Ship(game, x, y, key, frame) {
	        _super.call(this, game, x, y, key, frame);
	        // TODO no hardcoded stuff
	        var pixelRatio = 2;
	        this.scale.setTo(pixelRatio, pixelRatio);
	        this.animations.add("left_full", [0], 5, true);
	        this.animations.add("left", [1], 5, true);
	        this.animations.add("idle", [2], 5, true);
	        this.animations.add("right", [3], 5, true);
	        this.animations.add("right_full", [4], 5, true);
	        game.add.existing(this);
	        game.physics.p2.enable(this);
	    }
	    // TODO : to update
	    Ship.prototype.configure = function (pixelRatio, trail, controlEngine, shootingMachine, health) {
	        this.maxHealth = health;
	        this.health = health;
	        this.trail = trail;
	        this.controlEngine = controlEngine;
	        this.controller = new VelocityController();
	        this.shootingMachine = shootingMachine;
	        this.shootingMachine.configure(this);
	    };
	    Ship.prototype.update = function () {
	        this.controlEngine.process();
	        if (this.controlEngine.isRotatingLeft()) {
	            this.body.rotateLeft(100);
	        }
	        else if (this.controlEngine.isRotatingRight()) {
	            this.body.rotateRight(100);
	        }
	        else {
	            this.body.setZeroRotation();
	        }
	        if (this.controlEngine.isAccelerating()) {
	            this.body.thrust(400);
	        }
	        else if (this.controlEngine.isBraking()) {
	            this.body.reverse(100);
	        }
	        if (this.controlEngine.isRotatingLeft() && this.controlEngine.isAccelerating()) {
	            this.play("left_full");
	        }
	        else if (this.controlEngine.isRotatingLeft()) {
	            this.play("left");
	        }
	        else if (this.controlEngine.isRotatingRight() && this.controlEngine.isAccelerating()) {
	            this.play("right_full");
	        }
	        else if (this.controlEngine.isRotatingRight()) {
	            this.play("right");
	        }
	        else {
	            this.play("idle");
	        }
	        if (this.controlEngine.isAccelerating()) {
	            this.trail.x = this.x;
	            this.trail.y = this.y;
	            this.trail.start(false, 200, 10);
	        }
	        if (this.controlEngine.isShooting()) {
	            this.shootingMachine.shoot();
	        }
	        this.controller.limitVelocity(this, 15);
	    };
	    Ship.prototype.kill = function () {
	        this.shootingMachine.kill();
	        _super.prototype.kill.call(this);
	        return this;
	    };
	    Ship.prototype.getX = function () {
	        return this.x;
	    };
	    Ship.prototype.getY = function () {
	        return this.y;
	    };
	    Ship.prototype.resetPosition = function (x, y) {
	        this.body.x = x;
	        this.body.y = y;
	    };
	    Ship.prototype.getBullets = function () {
	        return this.shootingMachine.getBullets();
	    };
	    return Ship;
	}(Phaser.Sprite));
	exports.Ship = Ship;
	/**
	 * Controls and limits the velocity of a sprite
	 * @see http://www.html5gamedevs.com/topic/4723-p2-physics-limit-the-speed-of-a-sprite/
	 */
	var VelocityController = (function () {
	    function VelocityController() {
	    }
	    VelocityController.prototype.limitVelocity = function (sprite, maxVelocity) {
	        var body = sprite.body;
	        var vx = body.data.velocity[0];
	        var vy = body.data.velocity[1];
	        var currVelocitySqr = vx * vx + vy * vy;
	        var angle = Math.atan2(vy, vx);
	        if (currVelocitySqr > maxVelocity * maxVelocity) {
	            vx = Math.cos(angle) * maxVelocity;
	            vy = Math.sin(angle) * maxVelocity;
	            body.data.velocity[0] = vx;
	            body.data.velocity[1] = vy;
	        }
	    };
	    return VelocityController;
	}());


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var States = (function () {
	    function States() {
	    }
	    States.NO_ROTATION = 0;
	    States.LEFT_ROTATION = -1;
	    States.RIGHT_ROTATION = 1;
	    States.NO_ACCELERATION = 0;
	    States.ACCELERATION = 1;
	    States.BRAKING = -1;
	    States.SHOOTING = 1;
	    States.NO_SHOOTING = 0;
	    return States;
	}());
	var AbstractControlEngine = (function () {
	    function AbstractControlEngine() {
	        this.rotation = States.NO_ROTATION;
	        this.acceleration = States.NO_ACCELERATION;
	        this.shooting = States.NO_SHOOTING;
	    }
	    AbstractControlEngine.prototype.process = function () {
	        // to implement
	    };
	    AbstractControlEngine.prototype.isAccelerating = function () {
	        return this.acceleration === States.ACCELERATION;
	    };
	    AbstractControlEngine.prototype.isNotAccelerating = function () {
	        return this.acceleration === States.NO_ACCELERATION;
	    };
	    AbstractControlEngine.prototype.isBraking = function () {
	        return this.acceleration === States.BRAKING;
	    };
	    AbstractControlEngine.prototype.isRotatingLeft = function () {
	        return this.rotation === States.LEFT_ROTATION;
	    };
	    AbstractControlEngine.prototype.isRotatingRight = function () {
	        return this.rotation === States.RIGHT_ROTATION;
	    };
	    AbstractControlEngine.prototype.isNotRotating = function () {
	        return this.rotation === States.NO_ROTATION;
	    };
	    AbstractControlEngine.prototype.isShooting = function () {
	        return this.shooting === States.SHOOTING;
	    };
	    return AbstractControlEngine;
	}());
	var KeyboardControlEngine = (function (_super) {
	    __extends(KeyboardControlEngine, _super);
	    function KeyboardControlEngine(keyboard) {
	        _super.call(this);
	        this.cursorKeys = keyboard.createCursorKeys();
	        this.shootingKey = keyboard.addKey(Phaser.KeyCode.SPACEBAR);
	    }
	    KeyboardControlEngine.prototype.process = function () {
	        if (this.cursorKeys.left.isDown) {
	            this.rotation = States.LEFT_ROTATION;
	        }
	        else if (this.cursorKeys.right.isDown) {
	            this.rotation = States.RIGHT_ROTATION;
	        }
	        else {
	            this.rotation = States.NO_ROTATION;
	        }
	        if (this.cursorKeys.up.isDown) {
	            this.acceleration = States.ACCELERATION;
	        }
	        else if (this.cursorKeys.down.isDown) {
	            this.acceleration = States.BRAKING;
	        }
	        if (this.shootingKey.isDown) {
	            this.shooting = States.SHOOTING;
	        }
	        else {
	            this.shooting = States.NO_SHOOTING;
	        }
	    };
	    return KeyboardControlEngine;
	}(AbstractControlEngine));
	exports.KeyboardControlEngine = KeyboardControlEngine;
	var GamePadControlEngine = (function (_super) {
	    __extends(GamePadControlEngine, _super);
	    function GamePadControlEngine(pad) {
	        _super.call(this);
	        this.pad = pad;
	        this.pad.addCallbacks(this, {
	            onAxis: function (pad, axis, value) {
	                if (axis === 0) {
	                    if (value === -1) {
	                        this.rotation = States.LEFT_ROTATION;
	                    }
	                    else if (value === 1) {
	                        this.rotation = States.RIGHT_ROTATION;
	                    }
	                    else {
	                        this.rotation = States.NO_ROTATION;
	                    }
	                }
	                if (axis === 1) {
	                    if (value === -1) {
	                        this.acceleration = States.ACCELERATION;
	                    }
	                    else if (value === 1) {
	                        this.acceleration = States.BRAKING;
	                    }
	                    else {
	                        this.acceleration = States.NO_ACCELERATION;
	                    }
	                }
	            },
	            onDown: function (buttonCode, value, padIndex) {
	                if (buttonCode === 3) {
	                    this.shooting = States.SHOOTING;
	                }
	            },
	            onUp: function (buttonCode, value, padIndex) {
	                if (buttonCode === 3) {
	                    this.shooting = States.NO_SHOOTING;
	                }
	            }
	        });
	    }
	    GamePadControlEngine.prototype.process = function () {
	        // TODO: nothing to do as handled by callbacks
	    };
	    return GamePadControlEngine;
	}(AbstractControlEngine));
	exports.GamePadControlEngine = GamePadControlEngine;
	var DummyControlEngine = (function (_super) {
	    __extends(DummyControlEngine, _super);
	    function DummyControlEngine() {
	        _super.apply(this, arguments);
	        this.configured = false;
	    }
	    DummyControlEngine.prototype.configure = function (player, enemy) {
	        this.player = player;
	        this.enemy = enemy;
	        this.configured = true;
	    };
	    DummyControlEngine.prototype.process = function () {
	        if (this.configured === false) {
	            return;
	        }
	        // nothing to do in the dummy engine
	        if (this.seePlayer() === false) {
	            this.acceleration = States.NO_ACCELERATION;
	            this.shooting = States.NO_SHOOTING;
	        }
	        else {
	            // cf http://phaser.io/examples/v2/p2-physics/accelerate-to-object
	            // TODO: this is pretty cool but not very compatible with manual controls!
	            var speed = 250; // TODO thrust etc
	            var angle = Math.atan2(this.player.getY() - this.enemy.getY(), this.player.getX() - this.enemy.getX());
	            this.enemy.body.rotation = angle + Phaser.Math.degToRad(90);
	            this.enemy.body.force.x = Math.cos(angle) * speed;
	            this.enemy.body.force.y = Math.sin(angle) * speed;
	            this.shooting = States.SHOOTING;
	        }
	    };
	    DummyControlEngine.prototype.seePlayer = function () {
	        var scope = 500;
	        return (Math.abs(this.player.getX() - this.enemy.getX()) < scope)
	            && (Math.abs(this.player.getY() - this.enemy.getY()) < scope)
	            && this.player.alive;
	    };
	    DummyControlEngine.prototype.getDistanceFromPlayer = function () {
	        return Math.sqrt(Math.pow(this.enemy.getX() - this.player.getX(), 2) + Math.pow(this.enemy.getY() - this.player.getY(), 2));
	    };
	    return DummyControlEngine;
	}(AbstractControlEngine));
	exports.DummyControlEngine = DummyControlEngine;


/***/ }
/******/ ]);