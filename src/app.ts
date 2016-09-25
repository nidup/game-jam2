/// <reference path="../lib/phaser.d.ts"/>

class SimpleGame {
    private game: Phaser.Game;
    private configuration: Configuration;
    private ship: PlayerShip;
    //private ground: Ground;

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
        //this.game.load.image("tileset", "assets/tileset.png");
        this.game.load.image("tileset", "assets/tileset_debug.png");
        this.game.load.image("stars", "assets/starfield.jpg");
        this.game.load.image("ship", "assets/thrust_ship2.png");
    }

    public create() {
        this.createWorld();
    }

    public update() {
        this.ship.move();
        //this.ground.update();
    }

    private createWorld() {

        let cursors = this.game.input.keyboard.createCursorKeys();

        this.game.world.setBounds(0, 0, this.configuration.getWorldWidth(), this.configuration.getWorldHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.restitution = 0.8;

        let map = this.game.add.tilemap();
        let generator = new TilemapGenerator();
        generator.generate(this.game.rnd, map, this.configuration);

        //let starfield = this.game.add.tileSprite(0, 0, 800, 600, "stars");
        //starfield.fixedToCamera = true;

        let playerSprite = this.game.add.sprite(200, 200, "ship");
        playerSprite.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
        this.game.physics.p2.enable(playerSprite);
        this.game.camera.follow(playerSprite);
        this.ship = new PlayerShip(playerSprite, cursors);

        //this.ground = new Ground(playerSprite, starfield, this.game.camera, this.game.time);

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

        let cellularGenerator = new CellularAutomataMapGenerator();
        let cells = cellularGenerator.generate(configuration.getMapWidthInTiles(), configuration.getMapHeightInTiles());

        let tilesGenerator = new TerrainTileMapGenerator();
        let tiles = tilesGenerator.generate(cells);

        /*
         var TILE = {
         FORREST: 		6,
         EARTH: 			6 + 15 * 1,
         WATER: 			6 + 15 * 2,
         DEEPWATER: 	6 + 15 * 3
         };
         */

        for (let row = 0; row < tiles.length; row++) {
            for (let column = 0; column < tiles[row].length; column++) {
                map.putTile(tiles[row][column], row, column, layer);
            }
        }
    }
}

/**
 * Generates a map of numbers representing tile indexes
 */
class TerrainTileMapGenerator {

    public generate(cells: Array<Array<boolean>>) {
        let tiles = [[]];
        for (let row = 0; row < cells.length; row++) {
            tiles[row] = [];
            for (let column = 0; column < cells[row].length; column++) {
                let tileIndex = 6 + 15 * 2;
                if (cells[row][column] === false) {
                    tileIndex = 6 + 15 * 1;
                }
                tiles[row][column] = tileIndex;
            }
        }

        return tiles;
    }
}

/**
 * Procedural boolean map generator using cellular automata
 * @see https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
 * @see http://fiddle.jshell.net/neuroflux/qpnf32fu/
 */
class CellularAutomataMapGenerator {
    public generate(width: number, height: number) {
        let chanceToStartAlive = 0.4;
        let numberOfSteps = 2;
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
                if (Math.random() < chanceToStartAlive) {
                    cells[x][y] = true;
                } else {
                    cells[x][y] = false;
                }
            }
        }

        return cells;
    }

    private doSimulationStep (cells: Array<Array<boolean>>, deathLimit: number, birthLimit: number) {
        let newCells = [[]];
        for (let x = 0; x < cells.length; x++) {
            newCells[x] = [];
            for (let y = 0; y < cells[0].length; y++) {
                let nbs = this.countAliveNeighbours(cells, x, y);
                if (cells[x][y] === true) {
                    if (nbs < deathLimit) {
                        newCells[x][y] = false;
                    } else {
                        newCells[x][y] = true;
                    }
                } else {
                    if (nbs > birthLimit) {
                        newCells[x][y] = true;
                    } else {
                        newCells[x][y] = false;
                    }
                }
            }
        }

        return newCells;
    }

    private countAliveNeighbours(cells: Array<Array<boolean>>, x, y) {
        let count = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let nbX = i + x;
                let nbY = j + y;
                if (nbX < 0 || nbY < 0 || nbX >= cells.length || nbY >= cells[0].length) {
                    count = count + 1;
                } else if (cells[nbX][nbY] === true) {
                    count = count + 1;
                }
            }
        }
        return count;
    }
}

class Ground {
    private playerSprite: Phaser.Sprite;
    private backgroundSprite: Phaser.TileSprite;
    private camera: Phaser.Camera;
    private time: Phaser.Time;

    constructor (playerSprite: Phaser.Sprite, groundSprite: Phaser.TileSprite, camera: Phaser.Camera, time: Phaser.Time) {
        this.playerSprite = playerSprite;
        this.backgroundSprite = groundSprite;
        this.camera = camera;
        this.time = time;
    }

    public update() {
        if (!this.camera.atLimit.x) {
            this.backgroundSprite.tilePosition.x -= (this.playerSprite.body.velocity.x * this.time.physicsElapsed);
        }

        if (!this.camera.atLimit.y) {
            this.backgroundSprite.tilePosition.y -= (this.playerSprite.body.velocity.y * this.time.physicsElapsed);
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
