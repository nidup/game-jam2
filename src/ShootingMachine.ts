
export class ShootingMachine {
    private time: Phaser.Time;
    private bullets: Phaser.Group;
    private explosions: Phaser.Group;
    private bulletTimer: number;

    constructor (bullets: Phaser.Group, explosions: Phaser.Group, time: Phaser.Time) {
        this.bullets = bullets;
        this.explosions = explosions;
        this.time = time;
        this.bulletTimer = 0;
        this.prepareCollisions(bullets);
    }

    public shoot(shipSprite: Phaser.Sprite) {
        if (this.time.now > this.bulletTimer) {
            let bulletSpeed = 2000;
            let bulletSpacingMs = 200;
            let bulletLifeMs = 200;
            let bullet = this.bullets.getFirstExists(false);
            if (bullet) {
                bullet.reset(shipSprite.centerX, shipSprite.centerY);
                bullet.body.angle = shipSprite.body.angle;
                bullet.body.force.x = shipSprite.body.force.x;
                bullet.body.force.y = shipSprite.body.force.y;
                bullet.body.velocity.x = shipSprite.body.velocity.x;
                bullet.body.velocity.y = shipSprite.body.velocity.y;
                bullet.body.moveForward(bulletSpeed);
                this.bulletTimer = this.time.now + bulletSpacingMs;
                this.time.events.add(bulletLifeMs, this.killBullet, this, bullet);
            }
        }
    }

    public getBullets() {
        return this.bullets;
    }

    private killBullet(bullet: Phaser.Sprite) {
        bullet.kill();
    }

    private prepareCollisions(bullets: Phaser.Group) {
        bullets.forEach(function (bullet){
            bullet.body.onBeginContact.add(this.collideBullet, this);
        }, this);
    }

    private collideBullet(body, bodyShape, contactShape, contactEquation) {

        if (body === null) { // TODO: why?
            return;
        }

        if (body.sprite.key === "ship1" || body.sprite.key === "ship2") { // TODO don't kill the owner? not mandatory if properly kills bullets
            return;
        }

        // cf http://stackoverflow.com/questions/23587975/detect-impact-force-in-phaser-with-p2js
        let enemySprite = body.sprite;

        let explosion = this.explosions.getFirstExists(false);
        explosion.reset(enemySprite.centerX - enemySprite.width, enemySprite.centerY - enemySprite.height);
        explosion.play("explosion", 30, false, true);

        body.sprite.kill();
        // TODO kill the whole object
        // TODO kill the bullet!
    }
}
