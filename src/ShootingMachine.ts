
export class ShootingMachine {
    private time: Phaser.Time;
    private bullets: Phaser.Group;
    private bulletTimer: number;
    private physics: Phaser.Physics.Arcade;

    constructor (bullets: Phaser.Group, time: Phaser.Time, physics: Phaser.Physics.Arcade) {
        this.bullets = bullets;
        this.time = time;
        this.physics = physics;
        this.bulletTimer = 0;
    }

    public shoot(emiterSprite: Phaser.Sprite) {
        if (this.time.now > this.bulletTimer) {
            let bulletSpeed = 400;
            let bulletSpacing = 200;
            let bullet = this.bullets.getFirstExists(false);
            if (bullet) {
                let bulletOffset = 20;
                bullet.reset(emiterSprite.x + bulletOffset, emiterSprite.y);
                bullet.angle = emiterSprite.angle;
                this.physics.velocityFromAngle(bullet.angle - 90, bulletSpeed, bullet.body.velocity);
                bullet.body.velocity.x += emiterSprite.body.velocity.x;
                this.bulletTimer = this.time.now + bulletSpacing;
            }
        }
    }
}
