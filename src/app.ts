/// <reference path="../lib/phaser.d.ts"/>

//import { Configuration } from "./configuration";

class SimpleGame {
    private game: Phaser.Game;
    private logo: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;
    private configuration: Configuration;
    private ship: Phaser.Sprite;
    private starfield: Phaser.Sprite;

    constructor(config: Configuration) {
        this.configuration = config;
        this.game = new Phaser.Game(
            this.configuration.getGameWidth(),
            this.configuration.getGameHeight(),
            Phaser.AUTO,
            "content",
            this
        );
    }

    public preload() {
        this.game.load.image("stars", "assets/starfield.jpg");
        this.game.load.image("ship", "assets/thrust_ship2.png");
    }

    public create() {
        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.createWorld();
    }

    public update() {
        if (this.cursors.left.isDown) {
            this.ship.body.rotateLeft(100);
        } else if (this.cursors.right.isDown) {
            this.ship.body.rotateRight(100);
        } else {
            this.ship.body.setZeroRotation();
        }

        if (this.cursors.up.isDown) {
            this.ship.body.thrust(400);
        } else if (this.cursors.down.isDown) {
            this.ship.body.reverse(400);
        }

        if (!this.game.camera.atLimit.x) {
            this.starfield.tilePosition.x -= (this.ship.body.velocity.x * this.game.time.physicsElapsed);
        }

        if (!this.game.camera.atLimit.y) {
            this.starfield.tilePosition.y -= (this.ship.body.velocity.y * this.game.time.physicsElapsed);
        }
    }

    private createWorld() {
        /*this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.world.setBounds(0, 0, this.configuration.getWorldWidth(), this.configuration.getWorldHeight());*/


        this.game.world.setBounds(0, 0, this.configuration.getWorldWidth(), this.configuration.getWorldHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.defaultRestitution = 0.8;

        this.starfield = this.game.add.tileSprite(0, 0, 800, 600, "stars");
        this.starfield.fixedToCamera = true;

        this.ship = this.game.add.sprite(200, 200, "ship");
        this.game.physics.p2.enable(this.ship);
        this.game.camera.follow(this.ship);

        //cursors = game.input.keyboard.createCursorKeys();
    }
}

class Configuration {

    public getGameWidth() {
        return 200;
    }

    public getGameHeight() {
        return 200;
    }

    public getWorldWidth() {
        return 100000;
    }

    public getWorldHeight() {
        return 100000;
    }

    public getPixelRatio() {
        return 2;
    }
}

window.onload = () => {
    let configuration = new Configuration();
    let game = new SimpleGame(configuration);
};
