/// <reference path="../lib/phaser.d.ts"/>

//import { Configuration } from "./configuration";

class SimpleGame {
    private game: Phaser.Game;
    private logo: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;
    private configuration: Configuration;

    constructor(config: Configuration) {
        this.configuration = config;
        this.game = new Phaser.Game(
            this.configuration.getGameWidth() * this.configuration.getPixelRatio(),
            this.configuration.getGameHeight() * this.configuration.getPixelRatio(),
            Phaser.AUTO,
            "content",
            this
        );
    }

    public preload() {
        this.game.load.image("logo", "images/phaser-logo-small.png");
    }

    public create() {
        this.logo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, "logo");
        this.logo.anchor.setTo(0.5, 0.5);
        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.createWorld();
    }

    public update() {
        this.game.input.update();

        if (this.cursors.down.isDown) {
            this.logo.position.y++;
        }
        if (this.cursors.up.isDown) {
            this.logo.position.y--;
        }
        if (this.cursors.left.isDown) {
            this.logo.position.x--;
        }
        if (this.cursors.right.isDown) {
            this.logo.position.x++;
        }
    }

    private createWorld() {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.world.setBounds(0, 0, this.configuration.getWorldWidth(), this.configuration.getWorldHeight());
    }
}

class Configuration {

    public getGameWidth() {
        return 320;
    }

    public getGameHeight() {
        return 400;
    }

    public getWorldWidth() {
        return 24 * 16 * 2;
    }

    public getWorldHeight() {
        return 400 * 2;
    }

    public getPixelRatio() {
        return 2;
    }
}

window.onload = () => {
    let configuration = new Configuration();
    let game = new SimpleGame(configuration);
};
