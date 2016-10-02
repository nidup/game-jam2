
interface IShip {
    move();
}

export class PlayerShip implements IShip {
    private sprite: Phaser.Sprite;
    private cursors: Phaser.CursorKeys;
    private controller: VelocityController;

    constructor (sprite: Phaser.Sprite, cursors: Phaser.CursorKeys) {
        this.sprite = sprite;
        this.cursors = cursors;
        this.controller = new VelocityController();

        this.sprite.animations.add("left_full", [ 0 ], 5, true);
        this.sprite.animations.add("left", [ 1 ], 5, true);
        this.sprite.animations.add("idle", [ 2 ], 5, true);
        this.sprite.animations.add("right", [ 3 ], 5, true);
        this.sprite.animations.add("right_full", [ 4 ], 5, true);
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

        if (this.cursors.left.isDown && this.cursors.up.isUp) {
            this.sprite.play("left_full");
        } else if (this.cursors.left.isDown && this.cursors.up.isDown) {
            this.sprite.play("left");
        } else if (this.cursors.right.isDown && this.cursors.up.isUp) {
            this.sprite.play("right_full");
        } else if (this.cursors.right.isDown && this.cursors.up.isDown) {
            this.sprite.play("right");
        } else {
            this.sprite.play("idle");
        }

        this.controller.limitVelocity(this.sprite, 15);
    }

    public getX() {
        return this.sprite.x;
    }

    public getY() {
        return this.sprite.y;
    }

    public reset(x: number, y: number) {
        this.sprite.body.x = x;
        this.sprite.body.y = y;
    }

    public bringToTop() {
        this.sprite.bringToTop();
    }
}

/**
 * Controls and limits the velocity of a sprite
 * @see http://www.html5gamedevs.com/topic/4723-p2-physics-limit-the-speed-of-a-sprite/
 */
class VelocityController {
    public limitVelocity(sprite: Phaser.Sprite, maxVelocity: number) {
        let body = sprite.body
        let vx = body.data.velocity[0];
        let vy = body.data.velocity[1];
        let currVelocitySqr = vx * vx + vy * vy;
        let angle = Math.atan2(vy, vx);
        if (currVelocitySqr > maxVelocity * maxVelocity) {
            vx = Math.cos(angle) * maxVelocity;
            vy = Math.sin(angle) * maxVelocity;
            body.data.velocity[0] = vx;
            body.data.velocity[1] = vy;
        }
    }
}