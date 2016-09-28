/**
 * Global configuration for the game
 */
export default class Configuration {

    public getGameWidth() {
        return 500;
    }

    public getGameHeight() {
        return 500;
    }

    public getTileWidth() {
        return 24;
    }

    public getTileHeight() {
        return 28;
    }

    public getMapWidthInTiles() {
        return 40;
    }

    public getMapHeightInTiles() {
        return 40;
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
