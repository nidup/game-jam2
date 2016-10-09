/**
 * Global configuration for the game
 */
export default class Configuration {

    public playWithGamePad() {
        return false; // if false, the game will be playable with keyboard
    }

    public getGameWidth() {
        return this.getTileWidth() * this.getGameWidthInTiles() * this.getPixelRatio();
    }

    public getGameHeight() {
        return this.getTileHeight() * this.getGameHeightInTiles() * this.getPixelRatio();
    }

    public getGameWidthInTiles() {
        return 13;
    }

    public getGameHeightInTiles() {
        return 13;
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

    public getMapChunkWidthInTiles() {
        return 40;
    }

    public getMapChunkHeightInTiles() {
        return 40;
    }

    public getMapChunkWidth() {
        return this.getMapChunkWidthInTiles() * this.getTileWidth() * this.getPixelRatio();
    }

    public getMapChunkHeight() {
        return this.getMapChunkHeightInTiles() * this.getTileHeight() * this.getPixelRatio();
    }

    public getHorizontalTilesToCopy() {
        return this.getGameWidthInTiles() + this.getPaddingInTiles();
    }

    public getVerticalTilesToCopy() {
        return this.getGameHeightInTiles() + this.getPaddingInTiles();
    }

    public getLeftBorder() {
        return this.getEmptyWidthInTiles() * this.getTileWidth() * this.getPixelRatio();
    }

    public getRightBorder() {
        return this.getMapChunkWidth() - this.getLeftBorder();
    }

    public getTopBorder() {
        return this.getEmptyHeightInTiles() * this.getTileHeight() * this.getPixelRatio();
    }

    public getBottomBorder() {
        return this.getMapChunkHeight() - this.getTopBorder();
    }

    private getEmptyWidthInTiles() {
        return (this.getGameWidthInTiles() + this.getPaddingInTiles()) / 2;
    }

    private getEmptyHeightInTiles() {
        return (this.getGameHeightInTiles() + this.getPaddingInTiles()) / 2;
    }

    private getPaddingInTiles() {
        return 4;
    }
}
