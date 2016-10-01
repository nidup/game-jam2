/**
 * Global configuration for the game
 */
export default class Configuration {

    public getGameWidth() {
        return this.getTileWidth() * this.getGameWidthInTiles() * this.getPixelRatio();
    }

    public getGameHeight() {
        return this.getTileHeight() * this.getGameHeightInTiles() * this.getPixelRatio();
    }

    public getGameWidthInTiles() {
        return 10;
    }

    public getGameHeightInTiles() {
        return 10;
    }

    public getPixelRatio() {
        return 2;
    }

    public getTileWidth() {
        return 24;
    }

    public getTileHeight() {
        return 28;
    }

    public getEmptyWidthInTiles() {
        return this.getGameWidthInTiles() / 2;
    }

    public getEmptyHeightInTiles() {
        return this.getGameHeightInTiles() / 2;
    }

    public getEmptyWidth() {
        return this.getEmptyWidthInTiles() * this.getTileWidth() * this.getPixelRatio();
    }

    public getEmptyHeight() {
        return this.getEmptyHeightInTiles() * this.getTileHeight() * this.getPixelRatio();
    }

    public getMapChunkWidthInTiles() {
        return 100;
    }

    public getMapChunkHeightInTiles() {
        return 100;
    }

    public getMapChunkWidth() {
        return this.getMapChunkWidthInTiles() * this.getTileWidth() * this.getPixelRatio();
    }

    public getMapChunkHeight() {
        return this.getMapChunkHeightInTiles() * this.getTileHeight() * this.getPixelRatio();
    }
}
