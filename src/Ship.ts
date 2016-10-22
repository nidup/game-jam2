import {IControlEngine} from "./ControlEngine";
import {ShootingMachine} from "./ShootingMachine";

export class Ship extends Phaser.Sprite {

    private controller: VelocityController;
    private trail: Phaser.Particles.Arcade.Emitter;
    private controlEngine: IControlEngine;
    private shootingMachine: ShootingMachine;

    constructor(game: Phaser.Game, x: number, y: number, key: string, frame: number) {
        super(game, x, y, key, frame);

        // TODO no hardcoded stuff
        let pixelRatio = 2;
        this.scale.setTo(pixelRatio, pixelRatio);

        this.animations.add("left_full", [ 0 ], 5, true);
        this.animations.add("left", [ 1 ], 5, true);
        this.animations.add("idle", [ 2 ], 5, true);
        this.animations.add("right", [ 3 ], 5, true);
        this.animations.add("right_full", [ 4 ], 5, true);

        game.add.existing(this);
        game.physics.p2.enable(this);
    }

    // TODO : to update
    public configure(
        pixelRatio: number,
        trail: Phaser.Particles.Arcade.Emitter,
        controlEngine: IControlEngine,
        shootingMachine: ShootingMachine,
        health: number
    ) {
        this.maxHealth = health;
        this.health = health;
        this.trail = trail;
        this.controlEngine = controlEngine;
        this.controller = new VelocityController();
        this.shootingMachine = shootingMachine;
        this.shootingMachine.configure(this);
    }

    public update () {

        this.controlEngine.process();

        if (this.controlEngine.isRotatingLeft()) {
            this.body.rotateLeft(100);
        } else if (this.controlEngine.isRotatingRight()) {
            this.body.rotateRight(100);
        } else {
            this.body.setZeroRotation();
        }

        if (this.controlEngine.isAccelerating()) {
            this.body.thrust(400);
        } else if (this.controlEngine.isBraking()) {
            this.body.reverse(100);
        }

        if (this.controlEngine.isRotatingLeft() && this.controlEngine.isAccelerating()) {
            this.play("left_full");
        } else if (this.controlEngine.isRotatingLeft()) {
            this.play("left");
        } else if (this.controlEngine.isRotatingRight() && this.controlEngine.isAccelerating()) {
            this.play("right_full");
        } else if (this.controlEngine.isRotatingRight()) {
            this.play("right");
        } else {
            this.play("idle");
        }

        if (this.controlEngine.isAccelerating()) {
            this.trail.x = this.x;
            this.trail.y = this.y;
            this.trail.start(false, 200, 10);
        }

        if (this.controlEngine.isShooting()) {
            this.shootingMachine.shoot();
        }

        this.controller.limitVelocity(this, 15);
    }

    public kill() {
        this.shootingMachine.kill();
        super.kill();
        return this;
    }

    public getX() {
        return this.x;
    }

    public getY() {
        return this.y;
    }

    public resetPosition(x: number, y: number) {
        this.body.x = x;
        this.body.y = y;
    }

    public getBullets() {
        return this.shootingMachine.getBullets();
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