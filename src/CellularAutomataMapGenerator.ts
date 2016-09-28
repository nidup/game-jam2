/**
 * Procedural map generator using cellular automata
 *
 * @see https://en.wikipedia.org/wiki/Cellular_automaton
 * @see https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
 * @see http://fiddle.jshell.net/neuroflux/qpnf32fu/
 */
export default class CellularAutomataMapGenerator {

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