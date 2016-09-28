/// <reference path="../lib/phaser.d.ts"/>

import Configuration from "./Configuration";
import CellularAutomataMapGenerator from "./CellularAutomataMapGenerator";

class SimpleGame {
    private game: Phaser.Game;
    private configuration: Configuration;
    private ship: PlayerShip;
    private map: Phaser.Tilemap;
    private layer: Phaser.TilemapLayer;
    private chunkRegistry: MapChunkRegistry;
    private currentChunk: MapChunk;
    private generating: boolean;

    constructor(config: Configuration) {
        this.configuration = config;
        this.game = new Phaser.Game(
            this.configuration.getGameWidth(),
            this.configuration.getGameHeight(),
            Phaser.AUTO,
            "content",
            this
        );
        this.chunkRegistry = new MapChunkRegistry(this.game.rnd, this.configuration);

        this.generating = false;
    }

    public preload() {
        this.game.load.image("tileset", "assets/tileset.png");
        this.game.load.image("stars", "assets/starfield.jpg");
        this.game.load.image("ship", "assets/thrust_ship2.png");
    }

    public create() {
        this.createWorld();
    }

    public update() {

        this.ship.move();

        let borderPadding = this.configuration.getGameWidth() / 2;
        let borderRight = this.configuration.getMapWidth() - borderPadding;
        let borderBottom = this.configuration.getMapHeight() - borderPadding;
        if (this.generating === false && this.ship.getX() > borderRight) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getRight(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(borderPadding, this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getX() < borderPadding) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getLeft(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(borderRight, this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() > borderBottom) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getBottom(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), borderPadding);
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() < borderPadding) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getTop(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), borderBottom);
            this.generating = false;
        }
    }

    private repaintCurrentChunk () {
        let tiles = this.currentChunk.getTiles();

        let newLayerNumber = this.layer.name + 1;
        let newLayer = this.map.create(
            "" + newLayerNumber,
            this.configuration.getMapWidthInTiles(),
            this.configuration.getMapHeightInTiles(),
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );
        newLayer.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());

        let painter = new TilemapPainter();
        painter.paint(this.map, newLayer, tiles);

        this.layer.destroy();
        this.layer = newLayer;
        this.ship.bringToTop();
    }

    private createWorld() {

        let cursors = this.game.input.keyboard.createCursorKeys();

        this.game.world.setBounds(0, 0, this.configuration.getMapWidth(), this.configuration.getMapHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.restitution = 0.8;

        this.map = this.game.add.tilemap();
        this.map.addTilesetImage(
            "tileset",
            "tileset",
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );
        this.layer = this.map.create(
            "1",
            this.configuration.getMapWidthInTiles(),
            this.configuration.getMapHeightInTiles(),
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );
        this.layer.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());

        this.currentChunk = this.chunkRegistry.getInitial();
        let tiles = this.currentChunk.getTiles();
        let painter = new TilemapPainter();
        painter.paint(this.map, this.layer, tiles);

        let playerSprite = this.game.add.sprite(
            this.configuration.getMapWidth() / 2,
            this.configuration.getMapHeight() / 2,
            "ship"
        );
        playerSprite.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
        this.game.physics.p2.enable(playerSprite);
        this.game.camera.follow(playerSprite);
        this.ship = new PlayerShip(playerSprite, cursors);
    }
}

/**
 * Represents a map chunk, aka a set of tiles, the rand state allowing to re-generate the same chunk and the position
 * of the chunk in the map, the first generated chunk has coordinates x: 0, y:0
 */
class MapChunk {
    private tiles: Array<Array<number>>;
    private positionX: number;
    private positionY: number;
    private randState: string;

    constructor (tiles: Array<Array<number>>, randState: string, x: number, y: number) {
        this.tiles = tiles;
        this.randState = randState;
        this.positionX = x;
        this.positionY = y;
    }

    public getTiles() {
        return this.tiles;
    }

    public getPositionX() {
        return this.positionX;
    }

    public getPositionY() {
        return this.positionY;
    }
}

/**
 * Represents the registry of map chunk
 */
class MapChunkRegistry {
    private randGenerator: Phaser.RandomDataGenerator;
    private configuration: Configuration;
    private tilesGenerator: TilemapGenerator;
    private chunks: Array<MapChunk>;

    constructor (randGenerator: Phaser.RandomDataGenerator, configuration: Configuration) {
        this.randGenerator = randGenerator;
        this.configuration = configuration;
        this.tilesGenerator = new TilemapGenerator();
        this.chunks = new Array();
    }

    public getInitial() {
        return this.getByPosition(0, 0);
    }

    public getTop(chunk: MapChunk) {
        return this.getByPosition(chunk.getPositionX(), chunk.getPositionY() - 1);
    }

    public getBottom(chunk: MapChunk) {
        return this.getByPosition(chunk.getPositionX(), chunk.getPositionY() + 1);
    }

    public getRight(chunk: MapChunk) {
        return this.getByPosition(chunk.getPositionX() + 1, chunk.getPositionY());
    }

    public getLeft(chunk: MapChunk) {
        return this.getByPosition(chunk.getPositionX() - 1, chunk.getPositionY());
    }

    private getByPosition(x: number, y: number) {
        let key = this.getKeyFromPosition(x, y);
        if (key in this.chunks) {
            return this.chunks[key];
        }

        let newChunk = this.generateChunk(x, y);
        this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;

        return newChunk;
    }

    private generateChunk(x: number, y: number) {
        let randState = this.randGenerator.state();
        console.log('Generate a new chunk with seed ' + randState);
        let newTiles = this.tilesGenerator.generate(this.randGenerator, this.configuration);

        return new MapChunk(newTiles, randState, x, y);
    }

    private getKeyFromChunk (chunk: MapChunk) {
        return chunk.getPositionX() + "-" + chunk.getPositionY();
    }

    private getKeyFromPosition (x: number, y: number) {
        return x + "-" + y;
    }
}

interface IShip {
    move();
}

class PlayerShip implements IShip {
    private sprite: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;
    private controller: VelocityController;

    constructor (sprite: Phaser.Sprite, cursors: Phaser.CursorKeys) {
        this.sprite = sprite;
        this.cursors = cursors;
        this.controller = new VelocityController();
    }

    public move () {
        if (this.cursors.left.isDown) {
            this.sprite.body.rotateLeft(100);
        } else if (this.cursors.right.isDown) {
            this.sprite.body.rotateRight(100);
        } else {
            this.sprite.body.setZeroRotation();
        }

        if (this.cursors.up.isDown) {
            this.sprite.body.thrust(400);
        } else if (this.cursors.down.isDown) {
            this.sprite.body.reverse(100);
        }

        this.controller.limitVelocity(this.sprite, 15);
    }

    public getX() {
        return this.sprite.x;
    }

    public getY() {
        return this.sprite.y;
    }

    public reset(x: number, y: number) {
        this.sprite.body.x = x;
        this.sprite.body.y = y;
    }

    public bringToTop() {
        this.sprite.bringToTop();
    }
}

/**
 * Controls and limits the velocity of a sprite
 * @see http://www.html5gamedevs.com/topic/4723-p2-physics-limit-the-speed-of-a-sprite/
 */
class VelocityController {
    public limitVelocity(sprite: Phaser.Sprite, maxVelocity: number) {
        let body = sprite.body
        let vx = body.data.velocity[0];
        let vy = body.data.velocity[1];
        let currVelocitySqr = vx * vx + vy * vy;
        let angle = Math.atan2(vy, vx);
        if (currVelocitySqr > maxVelocity * maxVelocity) {
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            body.data.velocity[0] = vx;
            body.data.velocity[1] = vy;
        }
    }
}

/**
 * Paints a tile map layer with the given set of tiles
 */
class TilemapPainter {
    public paint (map: Phaser.Tilemap, layer: Phaser.TilemapLayer, tiles: Array<Array<number>>) {
        for (let row = 0; row < tiles.length; row++) {
            for (let column = 0; column < tiles[row].length; column++) {
                map.putTile(tiles[row][column], row, column, layer);
            }
        }
    }
}

/**
 * Generates tiles for a consistent tilemap
 */
class TilemapGenerator {
    public generate (rand: Phaser.RandomDataGenerator, configuration: Configuration) {
        let cellularGenerator = new CellularAutomataMapGenerator(rand);
        let cells = cellularGenerator.generate(configuration.getMapWidthInTiles(), configuration.getMapHeightInTiles());

        let tilesGenerator = new TerrainTileMapGenerator();
        let tiles = tilesGenerator.generate(cells);

        return tiles;
    }
}

/**
 * Generates a map of numbers representing tile indexes in the sprite
 *
 * Huge Thx to Chmood who inspirates this generator here https://github.com/Chmood/shmup/blob/gh-pages/src/js/game.js
 */
class TerrainTileMapGenerator {

    public FORREST: number = 6;
    public SAND: number = 6 + 15 * 1;
    public WATER: number = 6 + 15 * 2;
    public DEEP_WATER: number = 6 + 15 * 3;
    public TILE_STACK: Array<number> = [this.FORREST, this.SAND, this.WATER, this.DEEP_WATER];

    /**
     * Generates the tiles, the tile number is related to the index in the tile sprite
     * @param cells
     * @returns {Array[]}
     */
    public generate(cells: Array<Array<number>>) {
        let tiles = this.initializeWithBaseTiles(cells);
        tiles = this.smoothTiles(tiles);
        tiles = this.roundTiles(tiles);

        return tiles;
    }

    /**
     * Set up the tile map with base tiles, aka, forrest, sand, water, deep water
     * @param cells
     * @returns {Array[]}
     */
    private initializeWithBaseTiles(cells: Array<Array<number>>) {
        let tiles = [[]];
        for (let row = 0; row < cells.length; row++) {
            tiles[row] = [];
            for (let column = 0; column < cells[row].length; column++) {
                tiles[row][column] = this.TILE_STACK[cells[row][column]];
            }
        }

        return tiles;
    }

    /**
     * Erase difference between tile layer, for instance, it means that forrest can touch sand but not water, sand can
     * touch water but not deep water, etc
     *
     * @param tiles
     * @returns {Array<Array<number>>}
     */
    private smoothTiles(tiles: Array<Array<number>>) {
        for (let n = 0; n < this.TILE_STACK.length - 1; n++) {

            let tileCurrent = this.TILE_STACK[n];
            let tileAbove = (n > 0) ? this.TILE_STACK[n - 1] :  -1;
            let tileBelow =  this.TILE_STACK[n + 1];

            for (let i = 0; i < tiles.length ; i++) {
                for (let j = 0; j < tiles[i].length; j++) {
                    if (tiles[i][j] === tileCurrent) {

                        // Left up
                        if (i > 0 && j > 0 && tiles[i - 1][j - 1] !== tileCurrent && tiles[i - 1][j - 1] !== tileAbove && tiles[i - 1][j - 1] !== tileBelow) {
                            tiles[i - 1][j - 1] = tileBelow;
                        }
                        // Mid up
                        if (j > 0 && tiles[i][j - 1] !== tileCurrent && tiles[i][j - 1] !== tileAbove && tiles[i][j - 1] !== tileBelow) {
                            tiles[i][j - 1] = tileBelow;
                        }
                        // Right up
                        if (i < tiles.length - 1 && j > 0 && tiles[i + 1][j - 1] !== tileCurrent && tiles[i + 1][j - 1] !== tileAbove && tiles[i + 1][j - 1] !== tileBelow) {
                            tiles[i + 1][j - 1] = tileBelow;
                        }
                        // Right mid
                        if (i < tiles.length - 1 && tiles[i + 1][j] !== tileCurrent && tiles[i + 1][j] !== tileAbove && tiles[i + 1][j] !== tileBelow) {
                            tiles[i + 1][j] = tileBelow;
                        }
                        // Right down
                        if (i < tiles.length - 1 && j < tiles[i].length - 1 && tiles[i + 1][j + 1] !== tileCurrent && tiles[i + 1][j + 1] !== tileAbove && tiles[i + 1][j + 1] !== tileBelow) {
                            tiles[i + 1][j + 1] = tileBelow;
                        }
                        // Mid down
                        if (j < tiles[i].length - 1 && tiles[i][j + 1] !== tileCurrent && tiles[i][j + 1] !== tileAbove && tiles[i][j + 1] !== tileBelow) {
                            tiles[i][j + 1] = tileBelow;
                        }
                        // Left down
                        if (i > 0 && j < tiles[i].length - 1 && tiles[i - 1][j + 1] !== tileCurrent && tiles[i - 1][j + 1] !== tileAbove && tiles[i - 1][j + 1] !== tileBelow) {
                            tiles[i - 1][j + 1] = tileBelow;
                        }
                        // Left mid
                        if (i > 0 && tiles[i - 1][j] !== tileCurrent && tiles[i - 1][j] !== tileAbove && tiles[i - 1][j] !== tileBelow) {
                            tiles[i - 1][j] = tileBelow;
                        }
                    }
                }
            }
        }

        return tiles;
    }

    /**
     * Detect ground differences and corners to replace base tiles by rounded tiles
     * @param tiles
     * @returns {Array}
     */
    private roundTiles(tiles: Array<Array<number>>) {

        let roundedTiles = [];
        for (let i = 0; i < tiles.length - 1; i++) {
            roundedTiles[i] = [];
        }

        for (let n = 1; n < this.TILE_STACK.length; n++) {
            let currentLayer = this.TILE_STACK[n];
            let upperLayer = this.TILE_STACK[n - 1];

            for (let i = 0; i < tiles.length - 1; i++) {
                for (let j = 0; j < tiles[i].length - 1; j++) {
                    let q = [[tiles[i][j], tiles[i + 1][j]], [tiles[i][j + 1], tiles[i + 1][j + 1]]];

                    // 4 corners
                    if (q.join() === [[upperLayer, upperLayer], [upperLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 6;

                    // 3 corners
                    } else if (q.join() === [[upperLayer, upperLayer], [upperLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 9;

                    } else if (q.join() === [[upperLayer, upperLayer], [currentLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 8;

                    } else if (q.join() === [[currentLayer, upperLayer], [upperLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 3;

                    } else if (q.join() === [[upperLayer, currentLayer], [upperLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 4;

                    // 2 corners
                    } else if (q.join() === [[upperLayer, upperLayer], [currentLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 11;

                    } else if (q.join() === [[currentLayer, upperLayer], [currentLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 5;

                    } else if (q.join() === [[currentLayer, currentLayer], [upperLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 1;

                    } else if (q.join() === [[upperLayer, currentLayer], [upperLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 7;

                    } else if (q.join() === [[currentLayer, upperLayer], [upperLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 14;

                    } else if (q.join() === [[upperLayer, currentLayer], [currentLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 13;

                    // 1 corner
                    } else if (q.join() === [[upperLayer, currentLayer], [currentLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 12;

                    } else if (q.join() === [[currentLayer, upperLayer], [currentLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 10;

                    } else if (q.join() === [[currentLayer, currentLayer], [currentLayer, upperLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 0;

                    } else if (q.join() === [[currentLayer, currentLayer], [upperLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = (n - 1) * 15 + 2;

                    // no corner
                    } else if (q.join() === [[currentLayer, currentLayer], [currentLayer, currentLayer]].join()) {
                        roundedTiles[i][j] = n * 15 + 6;
                    }
                }
            }
        }

        return roundedTiles;
    }
}

window.onload = () => {
    let configuration = new Configuration();
    let game = new SimpleGame(configuration);
};
