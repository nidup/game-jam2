
import {ShootingMachine} from "./ShootingMachine";

export class ShipBuilder {

    private game: Phaser.Game; // TODO tmp

    public buildSprite(game: Phaser.Game, key: string, x: number, y: number, pixelRatio: number) {
        let shipSprite = game.add.sprite(x, y, key);
        shipSprite.scale.setTo(pixelRatio, pixelRatio);
        game.physics.p2.enable(shipSprite);

        return shipSprite;
    }

    public buildBullets(game: Phaser.Game, key: string) {
        let bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.P2JS;
        game.physics.p2.enable(bullets);

        bullets.createMultiple(30, key);
        bullets.setAll("anchor.x", 0.5);
        bullets.setAll("anchor.y", 0.5);
        bullets.setAll("checkWorldBounds", true);
        bullets.setAll("outOfBoundsKill", true);
        bullets.setAll("outOfCameraBoundsKill", true);
        // TODO: how to kill bullets?

        // TODO hardcode stuff just to test
        this.game = game;
        bullets.forEach(function (bullet){
            bullet.body.onBeginContact.add(this.collisionHandler, this);
        }, this);

        return bullets;
    }

    // TODO
    private collisionHandler (body, bodyShape, contactShape, contactEquation) {

        if (body === null) {
            return;
        }

        if (body.sprite.key === "ship1") {
            return;
        }

        // cf http://stackoverflow.com/questions/23587975/detect-impact-force-in-phaser-with-p2js
        let enemySprite = body.sprite;
        let dieSprite = this.game.add.sprite(
            enemySprite.centerX - enemySprite.width,
            enemySprite.centerY - enemySprite.height,
            'explosion'
        );
        dieSprite.animations.add('kaboom');
        dieSprite.play("kaboom", 30, false, true);

        body.sprite.kill();
        // TODO kill the whole object
    }

    public buildTrail(game: Phaser.Game, key: string, shipSprite: Phaser.Sprite) {
        let trail = game.add.emitter(shipSprite.x - 40, shipSprite.y, 1000);
        trail.width = 10;
        trail.makeParticles(key, [1, 2, 3, 4, 5]);
        trail.setXSpeed(20, -20);
        trail.setRotation(50, -50);
        trail.setAlpha(0.4, 0, 800);
        trail.setScale(0.01, 0.1, 0.01, 0.1, 1000, Phaser.Easing.Quintic.Out);

        return trail;
    }

    public buildShootingMachine(bullets: Phaser.Group, time: Phaser.Time) {
        return new ShootingMachine(bullets, time);
    }
}
