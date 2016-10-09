
import {ShootingMachine} from "./ShootingMachine";

export class ShipBuilder {

    public buildSprite(game: Phaser.Game, key: string, x: number, y: number, pixelRatio: number) {
        let shipSprite = game.add.sprite(x, y, key);
        shipSprite.scale.setTo(pixelRatio, pixelRatio);
        game.physics.p2.enable(shipSprite);

        return shipSprite;
    }

    public buildBullets(game: Phaser.Game, key: string) {
        let bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, key);
        bullets.setAll("anchor.x", 0.5);
        bullets.setAll("anchor.y", 1);
        bullets.setAll("outOfBoundsKill", true);
        bullets.setAll("checkWorldBounds", true);

        return bullets;
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

    public buildShootingMachine(bullets: Phaser.Group, time: Phaser.Time, physics: Phaser.Physics.Arcade) {
        return new ShootingMachine(bullets, time, physics);
    }
}
