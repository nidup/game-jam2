/// <reference path="../lib/phaser.d.ts"/>

import Configuration from "./Configuration";
import {MapChunkRegistry, MapChunk} from "./MapGenerator";
import {Ship} from "./Ship";
import {ShipBuilder} from "./ShipBuilder";
import {KeyboardControlEngine, GamePadControlEngine} from "./ControlEngine";

class SimpleGame {
    private game: Phaser.Game;
    private configuration: Configuration;
    private chunkRegistry: MapChunkRegistry;
    private currentChunk: MapChunk;
    private player: Ship = null;
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
        this.game.load.spritesheet("ship1", "assets/player_ship_1.png", 24, 28);
        this.game.load.spritesheet("ship2", "assets/player_ship_2.png", 24, 28);
        this.game.load.spritesheet("ship3", "assets/player_ship_3.png", 24, 28);
        this.game.load.spritesheet("ship4", "assets/player_ship_4.png", 24, 28);
        this.game.load.image("bullet", "assets/bullet.png");
        this.game.load.spritesheet("explosion", "assets/explode.png", 128, 128);
    }

    public create() {
        this.createWorld();
    }

    public update() {

        this.player.move();

        if (this.generating === false && this.player.getX() > this.configuration.getRightBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getRight(this.currentChunk);
            this.repaintCurrentChunk();
            this.player.reset(this.configuration.getLeftBorder(), this.player.getY());
            this.generating = false;

        } else if (this.generating === false && this.player.getX() < this.configuration.getLeftBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getLeft(this.currentChunk);
            this.repaintCurrentChunk();
            this.player.reset(this.configuration.getRightBorder(), this.player.getY());
            this.generating = false;

        } else if (this.generating === false && this.player.getY() > this.configuration.getBottomBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getBottom(this.currentChunk);
            this.repaintCurrentChunk();
            this.player.reset(this.player.getX(), this.configuration.getTopBorder());
            this.generating = false;

        } else if (this.generating === false && this.player.getY() < this.configuration.getTopBorder()) {
            this.generating = true;
            this.currentChunk = this.chunkRegistry.getTop(this.currentChunk);
            this.repaintCurrentChunk();
            this.player.reset(this.player.getX(), this.configuration.getBottomBorder());
            this.generating = false;
        }

        // TODO: set a timer to pre-generate upcoming chunks to reduce the lag effect (only repaint)
    }

    public render() {
        this.game.debug.text(this.game.time.fps + " " || "--", 2, 14, "#00ff00");
    }

    private createWorld() {

        this.game.time.advancedTiming = true;

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

        this.buildPlayer();
    }

    private buildPlayer() {
        let shipBuilder = new ShipBuilder();
        let bullets = shipBuilder.buildBullets(this.game, "bullet");

        let shipSprite = shipBuilder.buildSprite(
            this.game,
            "ship1",
            this.configuration.getMapChunkWidth() / 2,
            this.configuration.getMapChunkHeight() / 2,
            this.configuration.getPixelRatio()
        );
        this.game.camera.follow(shipSprite);

        let trail = shipBuilder.buildTrail(this.game, "explosion", shipSprite);

        let controlEngine = null;
        if (this.configuration.playWithGamePad()) {
            let pad = this.game.input.gamepad.pad1;
            this.game.input.gamepad.start();
            controlEngine = new GamePadControlEngine(pad);
        } else {
            controlEngine = new KeyboardControlEngine(this.game.input.keyboard);
        }

        let shootingMachine = shipBuilder.buildShootingMachine(bullets, this.game.time, this.game.physics.arcade);

        this.player = new Ship(shipSprite, trail, controlEngine, shootingMachine);
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
