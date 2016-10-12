
export class ShootingMachine {
    private time: Phaser.Time;
    private bullets: Phaser.Group;
    private bulletTimer: number;

    constructor (bullets: Phaser.Group, time: Phaser.Time) {
        this.bullets = bullets;
        this.time = time;
        this.bulletTimer = 0;
    }

    public shoot(shipSprite: Phaser.Sprite) {
        if (this.time.now > this.bulletTimer) {
            let bulletSpeed = 2000;
            let bulletSpacing = 200;
            let bullet = this.bullets.getFirstExists(false);
            if (bullet) {
                bullet.reset(shipSprite.centerX, shipSprite.centerY);
                bullet.body.angle = shipSprite.body.angle;
                bullet.body.force.x = shipSprite.body.force.x;
                bullet.body.force.y = shipSprite.body.force.y;
                bullet.body.velocity.x = shipSprite.body.velocity.x;
                bullet.body.velocity.y = shipSprite.body.velocity.y;
                bullet.body.moveForward(bulletSpeed);
                this.bulletTimer = this.time.now + bulletSpacing;
            }
        }
    }

    public getBullets() {
        return this.bullets;
    }
}
