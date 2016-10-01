/// <reference path="../lib/phaser.d.ts"/>

import Configuration from "./Configuration";
import {MapChunkRegistry, MapChunk} from "./MapGenerator";

class SimpleGame {
    private game: Phaser.Game;
    private configuration: Configuration;
    private ship: PlayerShip;
    private map: Phaser.Tilemap;
    private layer: Phaser.TilemapLayer;
    private chunkRegistry: MapChunkRegistry;
    private currentChunk: MapChunk;
    private generating: boolean;

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

        this.generating = false;
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

        let borderPadding = this.configuration.getGameWidth() / 2;
        let borderRight = this.configuration.getMapWidth() - borderPadding;
        let borderBottom = this.configuration.getMapHeight() - borderPadding;
        if (this.generating === false && this.ship.getX() > borderRight) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getRight(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(borderPadding, this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getX() < borderPadding) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getLeft(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(borderRight, this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() > borderBottom) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getBottom(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), borderPadding);
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() < borderPadding) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getTop(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), borderBottom);
            this.generating = false;
        }
    }

    private repaintCurrentChunk () {
        let tiles = this.currentChunk.getTiles();

        let newLayerNumber = this.layer.name + 1;
        let newLayer = this.map.create(
            "" + newLayerNumber,
            this.configuration.getMapWidthInTiles(),
            this.configuration.getMapHeightInTiles(),
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );
        newLayer.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());

        let painter = new TilemapPainter();
        painter.paint(this.map, newLayer, tiles);

        this.layer.destroy();
        this.layer = newLayer;
        this.ship.bringToTop();
    }

    private createWorld() {

        let cursors = this.game.input.keyboard.createCursorKeys();

        this.game.world.setBounds(0, 0, this.configuration.getMapWidth(), this.configuration.getMapHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.restitution = 0.8;

        this.map = this.game.add.tilemap();
        this.map.addTilesetImage(
            "tileset",
            "tileset",
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );
        this.layer = this.map.create(
            "1",
            this.configuration.getMapWidthInTiles(),
            this.configuration.getMapHeightInTiles(),
            this.configuration.getTileWidth(),
            this.configuration.getTileHeight()
        );
        this.layer.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());

        this.currentChunk = this.chunkRegistry.getInitial();
        let tiles = this.currentChunk.getTiles();
        let painter = new TilemapPainter();
        painter.paint(this.map, this.layer, tiles);

        let playerSprite = this.game.add.sprite(
            this.configuration.getMapWidth() / 2,
            this.configuration.getMapHeight() / 2,
            "ship"
        );
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
 * Paints a tile map layer with the given set of tiles
 */
class TilemapPainter {
    public paint (map: Phaser.Tilemap, layer: Phaser.TilemapLayer, tiles: Array<Array<number>>) {
        for (let column = 0; column < tiles.length; column++) {
            for (let row = 0; row < tiles[column].length; row++) {
                map.putTile(tiles[column][row], column, row, layer);
            }
        }
    }
}

window.onload = () => {
    let configuration = new Configuration();
    let game = new SimpleGame(configuration);
};
