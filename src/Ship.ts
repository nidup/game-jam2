
import {IControlEngine} from "./ControlEngine";
import {ShootingMachine} from "./ShootingMachine";

interface IShip {
    move();
}

export class Ship implements IShip {
    private sprite: Phaser.Sprite;
    private controller: VelocityController;
    private trail: Phaser.Particles.Arcade.Emitter;
    private controlEngine: IControlEngine;
    private shootingMachine: ShootingMachine;

    constructor (
        sprite: Phaser.Sprite,
        trail: Phaser.Particles.Arcade.Emitter,
        controlEngine: IControlEngine,
        shootingMachine: ShootingMachine
    ) {
        this.sprite = sprite;
        this.trail = trail;
        this.controlEngine = controlEngine;
        this.controller = new VelocityController();
        this.shootingMachine = shootingMachine;

        this.sprite.animations.add("left_full", [ 0 ], 5, true);
        this.sprite.animations.add("left", [ 1 ], 5, true);
        this.sprite.animations.add("idle", [ 2 ], 5, true);
        this.sprite.animations.add("right", [ 3 ], 5, true);
        this.sprite.animations.add("right_full", [ 4 ], 5, true);
    }

    public move () {

        this.controlEngine.process();

        if (this.controlEngine.isRotatingLeft()) {
            this.sprite.body.rotateLeft(100);
        } else if (this.controlEngine.isRotatingRight()) {
            this.sprite.body.rotateRight(100);
        } else {
            this.sprite.body.setZeroRotation();
        }

        if (this.controlEngine.isAccelerating()) {
            this.sprite.body.thrust(400);
        } else if (this.controlEngine.isBraking()) {
            this.sprite.body.reverse(100);
        }

        if (this.controlEngine.isRotatingLeft() && this.controlEngine.isAccelerating()) {
            this.sprite.play("left_full");
        } else if (this.controlEngine.isRotatingLeft()) {
            this.sprite.play("left");
        } else if (this.controlEngine.isRotatingRight() && this.controlEngine.isAccelerating()) {
            this.sprite.play("right_full");
        } else if (this.controlEngine.isRotatingRight()) {
            this.sprite.play("right");
        } else {
            this.sprite.play("idle");
        }

        if (this.controlEngine.isAccelerating()) {
            this.trail.x = this.sprite.x;
            this.trail.y = this.sprite.y;
            this.trail.start(false, 200, 10);
        }

        if (this.controlEngine.isShooting()) {
            this.shootingMachine.shoot(this.sprite);
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

    public getBullets() {
        return this.shootingMachine.getBullets();
    }

    public getSprite() {
        return this.sprite;
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