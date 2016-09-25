/// <reference path="../lib/phaser.d.ts"/>

class SimpleGame {
    private game: Phaser.Game;
    private map: Phaser.Tilemap;
    private cursors: Phaser.CursorKeys;
    private configuration: Configuration;
    private ship: PlayerShip;
    private starfield: Phaser.TileSprite;

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
        this.game.load.image("tileset", "assets/tileset.png");
        this.game.load.image("stars", "assets/starfield.jpg");
        this.game.load.image("ship", "assets/thrust_ship2.png");
    }

    public create() {
        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.createWorld();
        //this.createGround();
    }

    public update() {
        this.ship.move();

        // TODO
        if (!this.game.camera.atLimit.x) {
            this.starfield.tilePosition.x -= (this.ship.sprite.body.velocity.x * this.game.time.physicsElapsed);
        }

        if (!this.game.camera.atLimit.y) {
            this.starfield.tilePosition.y -= (this.ship.sprite.body.velocity.y * this.game.time.physicsElapsed);
        }
    }

    private createWorld() {
        this.game.world.setBounds(0, 0, this.configuration.getWorldWidth(), this.configuration.getWorldHeight());

        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.restitution = 0.8;

        this.starfield = this.game.add.tileSprite(0, 0, 800, 600, "stars");
        this.starfield.fixedToCamera = true;

        let sprite = this.game.add.sprite(200, 200, "ship");
        this.game.physics.p2.enable(sprite);
        this.game.camera.follow(sprite);
        this.ship = new PlayerShip(sprite, this.cursors);
    }

}

interface IShip {
    move();
}

class PlayerShip implements IShip {
    public sprite: Phaser.Sprite; // TODO: public for camera :(
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
}

/**
 * Controls and limits the velocity of a sprite
 * @see http://www.html5gamedevs.com/topic/4723-p2-physics-limit-the-speed-of-a-sprite/
 */
class VelocityController {
    public limitVelocity(sprite: Phaser.Sprite, maxVelocity: number) {
        let body = sprite.body
        let angle, currVelocitySqr, vx, vy;
        vx = body.data.velocity[0];
        vy = body.data.velocity[1];
        currVelocitySqr = vx * vx + vy * vy;
        if (currVelocitySqr > maxVelocity * maxVelocity) {
            angle = Math.atan2(vy, vx);
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            body.data.velocity[0] = vx;
            body.data.velocity[1] = vy;
        }
    }
}

/**
 * Global configuration for the game
 */
class Configuration {

    public getGameWidth() {
        return 500;
    }

    public getGameHeight() {
        return 500;
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
