/**
 * Global configuration for the game
 */
export default class Configuration {

    public getGameWidth() {
        return this.getTileWidth() * this.getMapWidthInTiles() * this.getPixelRatio();
    }

    public getGameHeight() {
        return this.getTileHeight() * this.getMapHeightInTiles() * this.getPixelRatio();
    }

    public getTileWidth() {
        return 24;
    }

    public getTileHeight() {
        return 28;
    }

    public getMapWidthInTiles() {
        return 10;
    }

    public getMapHeightInTiles() {
        return 7;
    }

    public getPixelRatio() {
        return 2;
    }

    public getMapWidth() {
        return (this.getMapWidthInTiles() - 1) * this.getTileWidth() * this.getPixelRatio();
    }

    public getMapHeight() {
        return (this.getMapHeightInTiles() - 1) * this.getTileHeight() * this.getPixelRatio();
    }
}
