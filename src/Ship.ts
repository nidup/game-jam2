
import {IControlEngine} from "./ControlEngine";

interface IShip {
    move();
}

export class PlayerShip implements IShip {
    private sprite: Phaser.Sprite;
    private controller: VelocityController;
    private time: Phaser.Time;
    private bullets: Phaser.Group;
    private bulletTimer: number = 0;
    private physics: Phaser.Physics.Arcade;
    private trail: Phaser.Particles.Arcade.Emitter;
    private moveEngine: IControlEngine;

    constructor (sprite: Phaser.Sprite, time: Phaser.Time, bullets: Phaser.Group, physics: Phaser.Physics.Arcade, trail: Phaser.Particles.Arcade.Emitter, moveEngine: IControlEngine) {
        this.sprite = sprite;
        this.bullets = bullets;
        this.time = time;
        this.physics = physics;
        this.trail = trail;
        this.moveEngine = moveEngine;
        this.controller = new VelocityController();

        this.sprite.animations.add("left_full", [ 0 ], 5, true);
        this.sprite.animations.add("left", [ 1 ], 5, true);
        this.sprite.animations.add("idle", [ 2 ], 5, true);
        this.sprite.animations.add("right", [ 3 ], 5, true);
        this.sprite.animations.add("right_full", [ 4 ], 5, true);
    }

    public move () {

        this.moveEngine.process();

        if (this.moveEngine.isRotatingLeft()) {
            this.sprite.body.rotateLeft(100);
        } else if (this.moveEngine.isRotatingRight()) {
            this.sprite.body.rotateRight(100);
        } else {
            this.sprite.body.setZeroRotation();
        }

        if (this.moveEngine.isAccelerating()) {
            this.sprite.body.thrust(400);
        } else if (this.moveEngine.isBraking()) {
            this.sprite.body.reverse(100);
        }

        if (this.moveEngine.isRotatingLeft() && this.moveEngine.isAccelerating()) {
            this.sprite.play("left_full");
        } else if (this.moveEngine.isRotatingLeft()) {
            this.sprite.play("left");
        } else if (this.moveEngine.isRotatingRight() && this.moveEngine.isAccelerating()) {
            this.sprite.play("right_full");
        } else if (this.moveEngine.isRotatingRight()) {
            this.sprite.play("right");
        } else {
            this.sprite.play("idle");
        }

        if (this.moveEngine.isAccelerating()) {
            this.trail.x = this.sprite.x;
            this.trail.y = this.sprite.y;
            this.trail.start(false, 200, 10);
        }

        if (this.moveEngine.isShooting()) {
            if (this.time.now > this.bulletTimer) {
                let bulletSpeed = 400;
                let bulletSpacing = 200;
                let bullet = this.bullets.getFirstExists(false);
                if (bullet) {
                    let bulletOffset = 20;
                    bullet.reset(this.sprite.x + bulletOffset, this.sprite.y);
                    bullet.angle = this.sprite.angle;
                    this.physics.velocityFromAngle(bullet.angle - 90, bulletSpeed, bullet.body.velocity);
                    bullet.body.velocity.x += this.sprite.body.velocity.x;
                    this.bulletTimer = this.time.now + bulletSpacing;
                }
            }
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