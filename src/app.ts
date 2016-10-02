/// <reference path="../lib/phaser.d.ts"/>

import Configuration from "./Configuration";
import {MapChunkRegistry, MapChunk} from "./MapGenerator";

class SimpleGame {
    private game: Phaser.Game;
    private configuration: Configuration;
    private chunkRegistry: MapChunkRegistry;
    private currentChunk: MapChunk;
    private ship: PlayerShip = null;
    private map: Phaser.Tilemap = null;
    private layer: Phaser.TilemapLayer = null;
    private generating: boolean = false;

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

        let borderLeft = this.configuration.getEmptyWidth();
        let borderTop = this.configuration.getEmptyHeight();
        let borderRight = this.configuration.getMapChunkWidth() - this.configuration.getEmptyWidth();
        let borderBottom = this.configuration.getMapChunkHeight() - this.configuration.getEmptyHeight();

        if (this.generating === false && this.ship.getX() > borderRight) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getRight(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(borderLeft, this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getX() < borderLeft) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getLeft(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(borderRight, this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() > borderBottom) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getBottom(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), borderTop);
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() < borderTop) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getTop(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), borderBottom);
            this.generating = false;
        }

        // TODO: set a timer to pre-generate upcoming chunks to reduce the lag effect (only repaint)
    }

    public render() {
        this.game.debug.text(this.game.time.fps + " " || "--", 2, 14, "#00ff00");
    }

    private createWorld() {

        this.game.time.advancedTiming = true;

        let cursors = this.game.input.keyboard.createCursorKeys();

        this.game.world.setBounds(0, 0, this.configuration.getMapChunkWidth(), this.configuration.getMapChunkHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.restitution = 0.8;

        this.map = this.game.add.tilemap();
        this.map.addTilesetImage(
            "tileset",
            "tileset",
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );

        this.currentChunk = this.chunkRegistry.getInitial();
        this.repaintCurrentChunk();

        let playerSprite = this.game.add.sprite(
            this.configuration.getMapChunkWidth() / 2,
            this.configuration.getMapChunkHeight() / 2,
            "ship"
        );
        playerSprite.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
        this.game.physics.p2.enable(playerSprite);
        this.game.camera.follow(playerSprite);
        this.ship = new PlayerShip(playerSprite, cursors);
    }

    private repaintCurrentChunk () {
        let newLayer = this.getLayer(this.currentChunk);
    }

    private getLayer(chunk: MapChunk) {
        if (this.layer === null) {
            let newLayer = this.map.create(
                this.currentChunk.getRandState(),
                this.configuration.getMapChunkWidthInTiles(),
                this.configuration.getMapChunkHeightInTiles(),
                this.configuration.getTileWidth(),
                this.configuration.getTileHeight()
            );
            newLayer.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
            if (this.layer !== null) {
                this.layer.destroy();
            }
            this.layer = newLayer;
        }

        let tiles = this.currentChunk.getFinalTiles();
        let painter = new TilemapPainter();
        painter.paint(this.map, this.layer, tiles);

        return this.layer;
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
 * Paints a tile map layer with the given set of tiles, the layer will contains empty tiles around the painted tiles to
 * allow to always keep the player centered in the screen
 */
class TilemapPainter {
    public paint(map: Phaser.Tilemap, layer: Phaser.TilemapLayer, tiles: Array<Array<number>>) {

        let nbColumns = tiles.length;
        let nbRows = tiles[0].length;

        for (let column = 0; column < nbColumns; column++) {
            for (let row = 0; row < nbRows; row++) {
                map.putTile(tiles[column][row], column, row, layer);
            }
        }
    }
}

window.onload = () => {
    let configuration = new Configuration();
    let game = new SimpleGame(configuration);
};
