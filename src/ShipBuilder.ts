
import {ShootingMachine} from "./ShootingMachine";

export class ShipBuilder {

    public buildSprite(game: Phaser.Game, key: string, x: number, y: number, pixelRatio: number) {
        let shipSprite = game.add.sprite(x, y, key);
        shipSprite.scale.setTo(pixelRatio, pixelRatio);
        game.physics.p2.enable(shipSprite);
        shipSprite.maxHealth = 100;
        shipSprite.health = 100;

        return shipSprite;
    }

    public buildShootingMachine(game: Phaser.Game, bulletKey: string, explosionKey: string, bulletSpacingMs: number) {
        let bullets = this.buildBulletsPool(game, bulletKey);
        let explosions = this.buildBulletExplosionsPool(game, explosionKey);

        let shootingMachine = new ShootingMachine(bullets, explosions, game.time, bulletSpacingMs);

        return shootingMachine;
    }

    private buildBulletsPool(game: Phaser.Game, key: string) {
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

    private buildBulletExplosionsPool(game: Phaser.Game, explosionKey: string) {
        let explosions = game.add.group();
        explosions.createMultiple(30, explosionKey);
        explosions.forEach(function (explosion){
            explosion.anchor.x = 0.5;
            explosion.anchor.y = 0.5;
            explosion.animations.add(explosionKey);
        }, this);

        return explosions;
    }
}
