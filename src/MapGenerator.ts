import Configuration from "./Configuration";

/**
 * Represents the registry of MapChunk, it internally generates new MapChunk on demand
 */
export class MapChunkRegistry {
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

/**
 * Represents a MapChunk, aka a set of tiles, the rand state allowing to re-generate the same chunk and the position
 * of the chunk in the map, the first generated chunk has coordinates x: 0, y:0
 */
export class MapChunk {
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