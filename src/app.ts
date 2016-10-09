/// <reference path="../lib/phaser.d.ts"/>

import Configuration from "./Configuration";
import {MapChunkRegistry, MapChunk} from "./MapGenerator";
import {PlayerShip} from "./Ship";
import {IMoveEngine, KeyboardMoveEngine, GamePadEngine} from "./MoveEngine";

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
        this.game.load.spritesheet("ship", "assets/player_ship_1.png", 24, 28);
        this.game.load.image("bullet", "assets/bullet.png");
        this.game.load.spritesheet("explosion", "assets/explode.png", 128, 128);
    }

    public create() {
        this.createWorld();
    }

    public update() {

        this.ship.move();

        if (this.generating === false && this.ship.getX() > this.configuration.getRightBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getRight(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.configuration.getLeftBorder(), this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getX() < this.configuration.getLeftBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getLeft(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.configuration.getRightBorder(), this.ship.getY());
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() > this.configuration.getBottomBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getBottom(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), this.configuration.getTopBorder());
            this.generating = false;

        } else if (this.generating === false && this.ship.getY() < this.configuration.getTopBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getTop(this.currentChunk);
            this.repaintCurrentChunk();
            this.ship.reset(this.ship.getX(), this.configuration.getBottomBorder());
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
        let fireButton = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

        let pad = this.game.input.gamepad.pad1;
        this.game.input.gamepad.start();

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

        let bullets = this.game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, "bullet");
        bullets.setAll("anchor.x", 0.5);
        bullets.setAll("anchor.y", 1);
        bullets.setAll("outOfBoundsKill", true);
        bullets.setAll("checkWorldBounds", true);

        let playerSprite = this.game.add.sprite(
            this.configuration.getMapChunkWidth() / 2,
            this.configuration.getMapChunkHeight() / 2,
            "ship"
        );

        playerSprite.scale.setTo(this.configuration.getPixelRatio(), this.configuration.getPixelRatio());
        this.game.physics.p2.enable(playerSprite);
        this.game.camera.follow(playerSprite);

        let trail = this.game.add.emitter(playerSprite.x - 40, playerSprite.y, 1000);
        trail.width = 10;
        trail.makeParticles("explosion", [1, 2, 3, 4, 5]);
        trail.setXSpeed(20, -20);
        trail.setRotation(50, -50);
        trail.setAlpha(0.4, 0, 800);
        trail.setScale(0.01, 0.1, 0.01, 0.1, 1000, Phaser.Easing.Quintic.Out);

        //let moveEngine = new KeyboardMoveEngine(cursors);
        let moveEngine = new GamePadEngine(pad);

        this.ship = new PlayerShip(playerSprite, this.game.time, bullets, this.game.physics.arcade, trail, fireButton, moveEngine);
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
    new SimpleGame(configuration);
};
