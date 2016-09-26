/// <reference path="../lib/phaser.d.ts"/>

class SimpleGame {
    private game: Phaser.Game;
    private configuration: Configuration;
    private ship: PlayerShip;

    constructor(config: Configuration) {
        this.configuration = config;
        this.game = new Phaser.Game(
            this.configuration.getGameWidth(),
            this.configuration.getGameHeight(),
            Phaser.AUTO,
            "content",
            this
        );
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
    }

    private createWorld() {

        let cursors = this.game.input.keyboard.createCursorKeys();

        this.game.world.setBounds(0, 0, this.configuration.getWorldWidth(), this.configuration.getWorldHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.restitution = 0.8;

        let seed = "12345"; // ensure a deterministic generation
        let randGenerator = new Phaser.RandomDataGenerator(seed);

        let map = this.game.add.tilemap();
        let generator = new TilemapGenerator();
        generator.generate(randGenerator, map, this.configuration);

        let playerSprite = this.game.add.sprite(200, 200, "ship");
        playerSprite.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
        this.game.physics.p2.enable(playerSprite);
        this.game.camera.follow(playerSprite);
        this.ship = new PlayerShip(playerSprite, cursors);
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

class TilemapGenerator {
    public generate (rand: Phaser.RandomDataGenerator, map: Phaser.Tilemap, configuration: Configuration) {
        map.addTilesetImage(
            "tileset",
            "tileset",
            configuration.getTileWidth(),
            configuration.getTileHeight()
        );
        let layer = map.create(
            "ground",
            configuration.getMapWidthInTiles(),
            configuration.getMapHeightInTiles(),
            configuration.getTileWidth(),
            configuration.getTileHeight()
        );
        layer.scale.setTo(configuration.getPixelRatio(), configuration.getPixelRatio());

        let cellularGenerator = new CellularAutomataMapGenerator(rand);
        let cells = cellularGenerator.generate(configuration.getMapWidthInTiles(), configuration.getMapHeightInTiles());

        let tilesGenerator = new TerrainTileMapGenerator();
        let tiles = tilesGenerator.generate(cells);

        for (let row = 0; row < tiles.length; row++) {
            for (let column = 0; column < tiles[row].length; column++) {
                map.putTile(tiles[row][column], row, column, layer);
            }
        }
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

/**
 * Procedural map generator using cellular automata
 *
 * @see https://en.wikipedia.org/wiki/Cellular_automaton
 * @see https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
 * @see http://fiddle.jshell.net/neuroflux/qpnf32fu/
 */
class CellularAutomataMapGenerator {

    public STATE_DEATH: number = 0;
    public STATE_ALIVE_ONE: number = 1;
    public STATE_ALIVE_TWO: number = 2;
    public STATE_ALIVE_THREE: number = 3;
    private rand: Phaser.RandomDataGenerator;

    constructor (rand: Phaser.RandomDataGenerator) {
        this.rand = rand;
    }

    public generate(width: number, height: number) {
        let chanceToStartAlive = 4;
        let numberOfSteps = 3;
        let deathLimit = 3;
        let birthLimit = 4;
        let cells = this.initialize(width, height, chanceToStartAlive);
        for (let i = 0; i < numberOfSteps; i++) {
            cells = this.doSimulationStep(cells, deathLimit, birthLimit);
        }

        return cells;
    }

    private initialize(width: number, height: number, chanceToStartAlive: number) {
        let cells = [[]];
        for (let x = 0; x < width; x++) {
            cells[x] = [];
            for (let y = 0; y < height; y++) {
                if (this.rand.between(1, 10) < chanceToStartAlive) {
                    cells[x][y] = (this.rand.between(1, 10) < 3) ?
                        this.STATE_ALIVE_ONE : (this.rand.between(1, 10) < 5) ?
                            this.STATE_ALIVE_TWO : this.STATE_ALIVE_THREE;
                } else {
                    cells[x][y] = this.STATE_DEATH;
                }
            }
        }

        return cells;
    }

    private doSimulationStep (cells: Array<Array<number>>, deathLimit: number, birthLimit: number) {
        let newCells = [[]];
        for (let x = 0; x < cells.length; x++) {
            newCells[x] = [];
            for (let y = 0; y < cells[0].length; y++) {
                let nbs = this.countAliveNeighbours(cells, x, y);
                if (cells[x][y] > this.STATE_DEATH) {
                    if (nbs < deathLimit) {
                        newCells[x][y] = this.STATE_DEATH;
                    } else {
                        newCells[x][y] = this.getDominantNeighbourActiveState(cells, x, y);
                    }
                } else {
                    if (nbs > birthLimit) {
                        newCells[x][y] = this.getDominantNeighbourActiveState(cells, x, y);
                    } else {
                        newCells[x][y] = this.STATE_DEATH;
                    }
                }
            }
        }

        return newCells;
    }

    private countAliveNeighbours(cells: Array<Array<number>>, x, y) {
        let count = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let nbX = i + x;
                let nbY = j + y;
                if (nbX < 0 || nbY < 0 || nbX >= cells.length || nbY >= cells[0].length) {
                    count = count + 1;
                } else if (cells[nbX][nbY] > this.STATE_DEATH) {
                    count = count + 1;
                }
            }
        }

        return count;
    }

    private getDominantNeighbourActiveState(cells: Array<Array<number>>, x, y) {
        let counterAliveOne = 0;
        let counterAliveTwo = 0;
        let counterAliveThree = 0;

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let nbX = i + x;
                let nbY = j + y;
                if (nbX < 0 || nbY < 0 || nbX >= cells.length || nbY >= cells[0].length) {
                    continue;
                } else if (cells[nbX][nbY] === this.STATE_ALIVE_ONE) {
                    counterAliveOne = counterAliveOne + 1;
                } else if (cells[nbX][nbY] === this.STATE_ALIVE_TWO) {
                    counterAliveTwo = counterAliveTwo + 1;
                } else if (cells[nbX][nbY] === this.STATE_ALIVE_THREE) {
                    counterAliveThree = counterAliveThree + 1;
                }
            }
        }

        if (counterAliveOne > counterAliveTwo && counterAliveOne > counterAliveThree) {
            return this.STATE_ALIVE_THREE;
        } else if (counterAliveTwo > counterAliveOne && counterAliveTwo > counterAliveThree) {
            return this.STATE_ALIVE_TWO;
        } else {
            return this.STATE_ALIVE_THREE;
        }
    }
}

/**
 * Global configuration for the game
 */
class Configuration {

    public getGameWidth() {
        return 500;
    }

    public getGameHeight() {
        return 500;
    }

    public getWorldWidth() {
        return 100000;
    }

    public getWorldHeight() {
        return 100000;
    }

    public getTileWidth() {
        return 24;
    }

    public getTileHeight() {
        return 28;
    }

    public getMapWidthInTiles() {
        return 50;
    }

    public getMapHeightInTiles() {
        return 50;
    }

    public getPixelRatio() {
        return 2;
    }
}

window.onload = () => {
    let configuration = new Configuration();
    let game = new SimpleGame(configuration);
};
