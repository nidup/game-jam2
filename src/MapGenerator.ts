import Configuration from "./Configuration";

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
export class MapChunk {
    private baseTiles: Array<Array<number>>;
    private smoothTiles: Array<Array<number>>;
    private finalTiles: Array<Array<number>>;
    private positionX: number;
    private positionY: number;
    private randState: string;

    constructor (
        baseTiles: Array<Array<number>>,
        smoothTiles: Array<Array<number>>,
        finalTiles: Array<Array<number>>,
        randState: string,
        x: number,
        y: number
    ) {
        this.baseTiles = baseTiles;
        this.smoothTiles = smoothTiles;
        this.finalTiles = finalTiles;
        this.randState = randState;
        this.positionX = x;
        this.positionY = y;
    }

    public getBaseTiles() {
        return this.baseTiles;
    }

    public getSmoothTiles() {
        return this.smoothTiles;
    }

    public getFinalTiles() {
        return this.finalTiles;
    }

    public getPositionX() {
        return this.positionX;
    }

    public getPositionY() {
        return this.positionY;
    }

    public getRandState() {
        return this.randState;
    }
}

/**
 * Represents the registry of MapChunk, it internally generates new MapChunk on demand
 */
export class MapChunkRegistry {
    private randGenerator: Phaser.RandomDataGenerator;
    private configuration: Configuration;
    private generator: MapChunkGenerator;
    private chunks: Array<MapChunk>;

    constructor (randGenerator: Phaser.RandomDataGenerator, configuration: Configuration) {
        this.randGenerator = randGenerator;
        this.configuration = configuration;
        this.generator = new MapChunkGenerator();
        this.chunks = new Array();
    }

    public getInitial() {
        let x = 0;
        let y = 0;
        let newChunk = this.generator.generateInitial(this.randGenerator, this.configuration, x, y);
        this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;

        return newChunk;
    }

    public getTop(chunk: MapChunk) {
        let x = chunk.getPositionX();
        let y = chunk.getPositionY() - 1;
        let newChunk = this.getByPosition(x, y);
        if (newChunk === null) {
            newChunk = this.generator.generateTopOf(chunk, this.randGenerator, this.configuration, x, y);
            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
        }

        return newChunk;
    }

    public getBottom(chunk: MapChunk) {
        let x = chunk.getPositionX();
        let y = chunk.getPositionY() + 1;
        let newChunk = this.getByPosition(x, y);
        if (newChunk === null) {
            newChunk = this.generator.generateBottomOf(chunk, this.randGenerator, this.configuration, x, y);
            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
        }

        return newChunk;
    }

    public getRight(chunk: MapChunk) {
        let x = chunk.getPositionX() + 1;
        let y = chunk.getPositionY();
        let newChunk = this.getByPosition(x, y);
        if (newChunk === null) {
            newChunk = this.generator.generateRightOf(chunk, this.randGenerator, this.configuration, x, y);
            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
        }

        return newChunk;
    }

    public getLeft(chunk: MapChunk) {
        let x = chunk.getPositionX() - 1;
        let y = chunk.getPositionY();
        let newChunk = this.getByPosition(x, y);

        if (newChunk === null) {
            newChunk = this.generator.generateLeftOf(chunk, this.randGenerator, this.configuration, x, y);
            this.chunks[this.getKeyFromChunk(newChunk)] = newChunk;
        }

        return newChunk;
    }

    private getByPosition(x: number, y: number) {
        let key = this.getKeyFromPosition(x, y);
        if (key in this.chunks) {
            return this.chunks[key];
        }

        return null;
    }

    private getKeyFromChunk (chunk: MapChunk) {
        return chunk.getPositionX() + "-" + chunk.getPositionY();
    }

    private getKeyFromPosition (x: number, y: number) {
        return x + "-" + y;
    }
}

/**
 * Generates MapChunk from neighbour to be able to get consistent junctions between chunks when passing from a chunk
 * to another (no water to forest)
 */
class MapChunkGenerator {

    public generateInitial(rand: Phaser.RandomDataGenerator, configuration: Configuration, x: number, y: number) {
        return this.generateFromInitTiles(rand, configuration, x, y, null);
    }

    public generateLeftOf(chunk: MapChunk, rand: Phaser.RandomDataGenerator, configuration: Configuration, x: number, y: number) {
        let initTiles = null;
        if (chunk !== null) {
            let copier = new NeighbourTilesCopier();
            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.LEFT, configuration.getHorizontalTilesToCopy());
        }

        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
    }

    public generateRightOf(chunk: MapChunk, rand: Phaser.RandomDataGenerator, configuration: Configuration, x: number, y: number) {
        let initTiles = null;
        if (chunk !== null) {
            let copier = new NeighbourTilesCopier();
            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.RIGHT, configuration.getHorizontalTilesToCopy());
        }

        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
    }

    public generateTopOf(chunk: MapChunk, rand: Phaser.RandomDataGenerator, configuration: Configuration, x: number, y: number) {
        let initTiles = null;
        if (chunk !== null) {
            let copier = new NeighbourTilesCopier();
            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.TOP, configuration.getVerticalTilesToCopy());
        }

        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
    }

    public generateBottomOf(chunk: MapChunk, rand: Phaser.RandomDataGenerator, configuration: Configuration, x: number, y: number) {
        let initTiles = null;
        if (chunk !== null) {
            let copier = new NeighbourTilesCopier();
            initTiles = copier.copy(chunk.getSmoothTiles(), Directions.BOTTOM, configuration.getVerticalTilesToCopy());
        }

        return this.generateFromInitTiles(rand, configuration, x, y, initTiles);
    }

    private generateFromInitTiles (
        rand: Phaser.RandomDataGenerator,
        configuration: Configuration,
        x: number,
        y: number,
        initTiles: Array<Array<number>>
    ) {
        let baseTilesGenerator = new BaseTilesGenerator(rand);
        let baseTiles = baseTilesGenerator.generate(
            configuration.getMapChunkWidthInTiles(),
            configuration.getMapChunkHeightInTiles(),
            initTiles
        );

        // TODO fix chunk transition and optimize
        // let smoothTiles = baseTiles;
        let smoothTilesGenerator = new SmoothTilesGenerator();
        let smoothTiles = smoothTilesGenerator.generate(baseTiles);

        // TODO fix chunk transition and optimize
        // let finalTiles = smoothTiles;
        let tilesGenerator = new FinalTilesGenerator();
        let finalTiles = tilesGenerator.generate(smoothTiles);

        let randState = rand.state();

        return new MapChunk(baseTiles, smoothTiles, finalTiles, randState, x, y);
    }
}

/**
 * Generates a map of clean tiles, with clean ground transitions, rounded borders, etc
 *
 * Huge Thx to Chmood who inspirates this generator https://github.com/Chmood/shmup/blob/gh-pages/src/js/game.js
 */
class FinalTilesGenerator {

    /**
     * Detect ground differences and corners to replace base tiles by rounded tiles
     * @param tiles
     * @returns {Array}
     */
    public generate(tiles: Array<Array<number>>) {
        let roundedTiles = [];
        for (let i = 0; i < tiles.length; i++) {
            roundedTiles[i] = [];
        }

        for (let n = 1; n < Tiles.STACK.length; n++) {
            let currentLayer = Tiles.STACK[n];
            let upperLayer = Tiles.STACK[n - 1];

            for (let i = 0; i < tiles.length; i++) {
                for (let j = 0; j < tiles[i].length; j++) {

                    // copy last tiles TODO generate one more and drop it cause we can't smooth those???
                    if (i === tiles.length - 1 || j === tiles[i].length - 1) {
                        roundedTiles[i][j] = tiles[i][j];
                        continue;
                    }

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
 * Copy neighbour tiles, to ensure that we can generate a new chunk with relevant tiles related to the next chunk,
 * for instance, if the right side of a chunk contains forest, be sure that the left side of the next chunk contains
 * forrest too
 *
 * TODO: still limited cause taking in account only a neighbour and not all existant neighbours, for instance,
 * top and left
 */
class NeighbourTilesCopier {

    public copy(originalTiles: Array<Array<number>>, direction: number, nbTilesToCopy: number) {
        if (direction === Directions.RIGHT) {
            return this.copyRightTiles(originalTiles, nbTilesToCopy);
        } else if (direction === Directions.LEFT) {
            return this.copyLeftTiles(originalTiles, nbTilesToCopy);
        } else if (direction === Directions.TOP) {
            return this.copyTopTiles(originalTiles, nbTilesToCopy);
        } else if (direction === Directions.BOTTOM) {
            return this.copyBottomTiles(originalTiles, nbTilesToCopy);
        }
    }

    /**
     * Copy nbTilesToCopy right original tiles to left neighbour tiles
     */
    public copyRightTiles(originalTiles: Array<Array<number>>, nbTilesToCopy: number) {
        let neighbourTiles = this.buildEmptyTiles(originalTiles);
        let sourceColumnIndex = neighbourTiles.length - 1;
        let copyColumnIndex = 0;
        for (let row = 0; row < neighbourTiles[0].length; row++) {
            let copySrc = nbTilesToCopy;
            for (let copyDest = 0; copyDest < nbTilesToCopy; copyDest++) {
                copySrc--;
                neighbourTiles[copyColumnIndex + copyDest][row] = originalTiles[sourceColumnIndex - copySrc][row];
            }
        }

        return neighbourTiles;
    }

    /**
     * Copy nbTilesToCopy left original tiles to right neighbour tiles
     */
    public copyLeftTiles(originalTiles: Array<Array<number>>, nbTilesToCopy: number) {
        let neighbourTiles = this.buildEmptyTiles(originalTiles);
        let sourceColumnIndex = 0;
        let copyColumnIndex = neighbourTiles.length - 1;
        for (let row = 0; row < neighbourTiles[sourceColumnIndex].length; row++) {
            let copyDest = nbTilesToCopy;
            for (let copySrc = 0; copySrc < nbTilesToCopy; copySrc++) {
                copyDest--;
                neighbourTiles[copyColumnIndex - copyDest][row] = originalTiles[sourceColumnIndex + copySrc][row];
            }
        }

        return neighbourTiles;
    }

    /**
     * Copy nbTilesToCopy top original tiles to bottom neighbour tiles
     */
    public copyTopTiles(originalTiles: Array<Array<number>>, nbTilesToCopy: number) {
        let neighbourTiles = this.buildEmptyTiles(originalTiles);
        let sourceRowIndex = 0;
        let copyRowIndex = neighbourTiles[0].length - 1;

        for (let column = 0; column < neighbourTiles.length; column++) {
            let copyDest = nbTilesToCopy;
            for (let copySrc = 0; copySrc < nbTilesToCopy; copySrc++) {
                copyDest--;
                neighbourTiles[column][copyRowIndex - copyDest] = originalTiles[column][sourceRowIndex + copySrc];
            }
        }

        return neighbourTiles;
    }

    /**
     * Copy nbTilesToCopy bottom original tiles to top neighbour tiles
     */
    public copyBottomTiles(originalTiles: Array<Array<number>>, nbTilesToCopy: number) {
        let neighbourTiles = this.buildEmptyTiles(originalTiles);
        let sourceRowIndex = neighbourTiles[0].length - 1;
        let copyRowIndex = 0;
        for (let column = 0; column < neighbourTiles.length; column++) {
            let copySrc = nbTilesToCopy;
            for (let copyDest = 0; copyDest < nbTilesToCopy; copyDest++) {
                copySrc--;
                neighbourTiles[column][copyRowIndex + copyDest] = originalTiles[column][sourceRowIndex - copySrc];
            }
        }

        return neighbourTiles;
    }

    public buildEmptyTiles(originalTiles: Array<Array<number>>) {
        let emptyTiles = new Array();
        for (let row = 0; row < originalTiles.length; row++) {
            emptyTiles[row] = [];
            for (let column = 0; column < originalTiles[row].length; column++) {
                emptyTiles[row][column] = Tiles.UNDEFINED;
            }
         }
        return emptyTiles;
    }
}

/**
 * Erase difference between tile layer, for instance, it means that forrest can touch sand but not water, sand can
 * touch water but not deep water, etc
 */
class SmoothTilesGenerator {

    public generate(tiles: Array<Array<number>>) {
        for (let n = 0; n < Tiles.STACK.length - 1; n++) {

            let tileCurrent = Tiles.STACK[n];
            let tileAbove = (n > 0) ? Tiles.STACK[n - 1] :  -1;
            let tileBelow =  Tiles.STACK[n + 1];

            for (let i = 0; i < tiles.length ; i++) {
                for (let j = 0; j < tiles[i].length; j++) {
                    if (tiles[i][j] === tileCurrent) {
                        let isLeftUp = i > 0 && j > 0 && tiles[i - 1][j - 1] !== tileCurrent
                            && tiles[i - 1][j - 1] !== tileAbove && tiles[i - 1][j - 1] !== tileBelow;
                        if (isLeftUp) {
                            tiles[i - 1][j - 1] = tileBelow;
                        }
                        let isMidUp = j > 0 && tiles[i][j - 1] !== tileCurrent && tiles[i][j - 1] !== tileAbove
                            && tiles[i][j - 1] !== tileBelow;
                        if (isMidUp) {
                            tiles[i][j - 1] = tileBelow;
                        }
                        let isRightUp = i < tiles.length - 1 && j > 0 && tiles[i + 1][j - 1] !== tileCurrent
                            && tiles[i + 1][j - 1] !== tileAbove && tiles[i + 1][j - 1] !== tileBelow;
                        if (isRightUp) {
                            tiles[i + 1][j - 1] = tileBelow;
                        }
                        let isRightMid = i < tiles.length - 1 && tiles[i + 1][j] !== tileCurrent
                            && tiles[i + 1][j] !== tileAbove && tiles[i + 1][j] !== tileBelow;
                        if (isRightMid) {
                            tiles[i + 1][j] = tileBelow;
                        }
                        let isRightDown = i < tiles.length - 1 && j < tiles[i].length - 1
                            && tiles[i + 1][j + 1] !== tileCurrent && tiles[i + 1][j + 1] !== tileAbove
                            && tiles[i + 1][j + 1] !== tileBelow;
                        if (isRightDown) {
                            tiles[i + 1][j + 1] = tileBelow;
                        }
                        let isMidDown = j < tiles[i].length - 1 && tiles[i][j + 1] !== tileCurrent
                            && tiles[i][j + 1] !== tileAbove && tiles[i][j + 1] !== tileBelow;
                        if (isMidDown) {
                            tiles[i][j + 1] = tileBelow;
                        }
                        let isLeftDown = i > 0 && j < tiles[i].length - 1 && tiles[i - 1][j + 1] !== tileCurrent
                            && tiles[i - 1][j + 1] !== tileAbove && tiles[i - 1][j + 1] !== tileBelow;
                        if (isLeftDown) {
                            tiles[i - 1][j + 1] = tileBelow;
                        }
                        let isLeftMid = i > 0 && tiles[i - 1][j] !== tileCurrent
                            && tiles[i - 1][j] !== tileAbove && tiles[i - 1][j] !== tileBelow;
                        if (isLeftMid) {
                            tiles[i - 1][j] = tileBelow;
                        }
                    }
                }
            }
        }

        return tiles;
    }
}

/**
 * Procedural tiles map generator using cellular automata, it only uses base tiles (forrest, sand, water, deep water),
 * the passed init cells are kept and not updated to ensure smooth transitions between map chunks
 *
 * @see https://en.wikipedia.org/wiki/Cellular_automaton
 * @see https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
 * @see http://fiddle.jshell.net/neuroflux/qpnf32fu/
 */
class BaseTilesGenerator {

    public STATE_DEATH: number = Tiles.FORREST;
    public STATE_ALIVE_ONE: number = Tiles.SAND;
    public STATE_ALIVE_TWO: number = Tiles.WATER;
    public STATE_ALIVE_THREE: number = Tiles.DEEP_WATER;
    private rand: Phaser.RandomDataGenerator;

    constructor (rand: Phaser.RandomDataGenerator) {
        this.rand = rand;
    }

    /**
     * Generate new tiles and ensure that init tiles are kept to ensure smooth transitions between chunks
     */
    public generate(width: number, height: number, initTiles: Array<Array<number>>) {
        let chanceToStartAlive = 4;
        let numberOfSteps = 2;
        let deathLimit = 3;
        let birthLimit = 4;
        let baseTiles = this.initialize(width, height, chanceToStartAlive);

        for (let i = 0; i < numberOfSteps; i++) {
            baseTiles = this.doSimulationStep(baseTiles, deathLimit, birthLimit);
        }

        if (initTiles !== null) {
            baseTiles = this.copyInitTiles(baseTiles, initTiles);
        }

        return baseTiles;
    }

    /**
     * Generate random tiles to fulfil the map
     */
    private initialize(width: number, height: number, chanceToStartAlive: number) {
        let baseTiles = [[]];
        for (let x = 0; x < width; x++) {
            baseTiles[x] = [];
            for (let y = 0; y < height; y++) {
                if (this.rand.between(1, 10) < chanceToStartAlive) {
                    baseTiles[x][y] = (this.rand.between(1, 10) < 3) ?
                        this.STATE_ALIVE_ONE : (this.rand.between(1, 10) < 5) ?
                        this.STATE_ALIVE_TWO : this.STATE_ALIVE_THREE;
                } else {
                    baseTiles[x][y] = this.STATE_DEATH;
                }
            }
        }

        return baseTiles;
    }

    /**
     * Change random tiles depending on neighbour tiles
     */
    private doSimulationStep(baseTiles: Array<Array<number>>, deathLimit: number, birthLimit: number) {
        let newTiles = [[]];
        for (let x = 0; x < baseTiles.length; x++) {
            newTiles[x] = [];
            for (let y = 0; y < baseTiles[0].length; y++) {
                let nbs = this.countAliveNeighbours(baseTiles, x, y);
                if (baseTiles[x][y] > this.STATE_DEATH) {
                    if (nbs < deathLimit) {
                        newTiles[x][y] = this.STATE_DEATH;
                    } else {
                        newTiles[x][y] = this.getDominantNeighbourActiveState(baseTiles, x, y);
                    }
                } else {
                    if (nbs > birthLimit) {
                        newTiles[x][y] = this.getDominantNeighbourActiveState(baseTiles, x, y);
                    } else {
                        newTiles[x][y] = this.STATE_DEATH;
                    }
                }
            }
        }

        return newTiles;
    }

    private countAliveNeighbours(baseTiles: Array<Array<number>>, x, y) {
        let count = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let nbX = i + x;
                let nbY = j + y;
                if (nbX < 0 || nbY < 0 || nbX >= baseTiles.length || nbY >= baseTiles[0].length) {
                    count = count + 1;
                } else if (baseTiles[nbX][nbY] > this.STATE_DEATH) {
                    count = count + 1;
                }
            }
        }

        return count;
    }

    private getDominantNeighbourActiveState(baseTiles: Array<Array<number>>, x, y) {
        let counterAliveOne = 0;
        let counterAliveTwo = 0;
        let counterAliveThree = 0;

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let nbX = i + x;
                let nbY = j + y;
                if (nbX < 0 || nbY < 0 || nbX >= baseTiles.length || nbY >= baseTiles[0].length) {
                    continue;
                } else if (baseTiles[nbX][nbY] === this.STATE_ALIVE_ONE) {
                    counterAliveOne = counterAliveOne + 1;
                } else if (baseTiles[nbX][nbY] === this.STATE_ALIVE_TWO) {
                    counterAliveTwo = counterAliveTwo + 1;
                } else if (baseTiles[nbX][nbY] === this.STATE_ALIVE_THREE) {
                    counterAliveThree = counterAliveThree + 1;
                }
            }
        }

        if (counterAliveOne > counterAliveTwo && counterAliveOne > counterAliveThree) {
            return this.STATE_ALIVE_ONE;
        } else if (counterAliveTwo > counterAliveOne && counterAliveTwo > counterAliveThree) {
            return this.STATE_ALIVE_TWO;
        } else {
            return this.STATE_ALIVE_THREE;
        }
    }

    /**
     * Copy init tiles to ensure smooth transition with neighboug chunk
     */
    private copyInitTiles(baseTiles: Array<Array<number>>, initTiles: Array<Array<number>>) {
        for (let x = 0; x < baseTiles.length; x++) {
            for (let y = 0; y < baseTiles[x].length; y++) {
                if (initTiles !== null && initTiles[x][y] >= 0) {
                    baseTiles[x][y] = initTiles[x][y];
                }
            }
        }

        return baseTiles;
    }
}

/**
 * Allow to access base tiles (forrest, sand, water, deep water) and to the stack, aka, in which order you can
 * encounter them, forrest can touch sand but not water or deep water, sand can touch forrest or water, etc
 */
class Tiles {
    public static UNDEFINED: number = -1;
    public static FORREST: number = 6;
    public static SAND: number = 6 + 15 * 1;
    public static WATER: number = 6 + 15 * 2;
    public static DEEP_WATER: number = 6 + 15 * 3;
    public static STACK: Array<number> = [Tiles.FORREST, Tiles.SAND, Tiles.WATER, Tiles.DEEP_WATER];
}

/**
 * Defines constant for different directions
 */
class Directions {
    public static LEFT: number = 1;
    public static RIGHT: number = 2;
    public static TOP: number = 3;
    public static BOTTOM: number = 4;
}

/**
 * Display the tiles in the log
 */
class TilesDebugger {
    public display(tiles: Array<Array<number>>) {

        let rowsString = [];
        for (let row = 0; row < tiles[0].length; row++) {
            rowsString[row] = "";
        }

        for (let column = 0; column < tiles.length; column++) {
            for (let row = 0; row < tiles[column].length; row++) {
                rowsString[row] = rowsString[row] + "\t" + tiles[column][row]
            }
        }

        let strMap = "";
        for (let row = 0; row < rowsString.length; row++) {
            strMap = strMap + rowsString[row] + "\n";
        }

        console.log(strMap);
    }
}