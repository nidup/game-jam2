
import {Ship} from "./Ship";

export interface IControlEngine {
    process();
    isAccelerating();
    isNotAccelerating();
    isBraking();
    isRotatingLeft();
    isRotatingRight();
    isNotRotating();
    isShooting();
}

class States {
    public static NO_ROTATION: number = 0;
    public static LEFT_ROTATION: number = -1;
    public static RIGHT_ROTATION: number = 1;
    public static NO_ACCELERATION: number = 0;
    public static ACCELERATION: number = 1;
    public static BRAKING: number = -1;
    public static SHOOTING: number = 1;
    public static NO_SHOOTING: number = 0;
}

abstract class AbstractControlEngine implements IControlEngine {
    protected rotation: number = States.NO_ROTATION;
    protected acceleration: number = States.NO_ACCELERATION;
    protected shooting: number = States.NO_SHOOTING;

    public process() {
        // to implement
    }
    public isAccelerating() {
        return this.acceleration === States.ACCELERATION;
    }
    public isNotAccelerating() {
        return this.acceleration === States.NO_ACCELERATION;
    }
    public isBraking() {
        return this.acceleration === States.BRAKING;
    }
    public isRotatingLeft() {
        return this.rotation === States.LEFT_ROTATION;
    }
    public isRotatingRight() {
        return this.rotation === States.RIGHT_ROTATION;
    }
    public isNotRotating() {
        return this.rotation === States.NO_ROTATION;
    }
    public isShooting() {
        return this.shooting === States.SHOOTING;
    }
}

export class KeyboardControlEngine extends AbstractControlEngine {
    private cursorKeys: Phaser.CursorKeys;
    private shootingKey: Phaser.Key;

    constructor (keyboard: Phaser.Keyboard) {
        super();
        this.cursorKeys = keyboard.createCursorKeys();
        this.shootingKey = keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    }

    public process() {
        if (this.cursorKeys.left.isDown) {
            this.rotation = States.LEFT_ROTATION;
        } else if (this.cursorKeys.right.isDown) {
            this.rotation = States.RIGHT_ROTATION;
        } else {
            this.rotation = States.NO_ROTATION;
        }

        if (this.cursorKeys.up.isDown) {
            this.acceleration = States.ACCELERATION;
        } else if (this.cursorKeys.down.isDown) {
            this.acceleration = States.BRAKING;
        }

        if (this.shootingKey.isDown) {
            this.shooting = States.SHOOTING;
        } else {
            this.shooting = States.NO_SHOOTING;
        }
    }
}

export class GamePadControlEngine  extends AbstractControlEngine {
    private pad: Phaser.SinglePad;

    constructor (pad: Phaser.SinglePad) {
        super();
        this.pad = pad;
        this.pad.addCallbacks(this, {
             onAxis: function(pad, axis, value) {
                 if (axis === 0) {
                     if (value === -1) {
                         this.rotation = States.LEFT_ROTATION;
                     } else if (value === 1) {
                         this.rotation = States.RIGHT_ROTATION;
                     } else {
                         this.rotation = States.NO_ROTATION;
                     }
                 }
                 if (axis === 1) {
                     if (value === -1) {
                         this.acceleration = States.ACCELERATION;
                     } else if (value === 1) {
                         this.acceleration = States.BRAKING;
                     } else {
                         this.acceleration = States.NO_ACCELERATION;
                     }
                 }
             },
             onDown: function(buttonCode, value, padIndex){
                 if (buttonCode === 3) {
                     this.shooting = States.SHOOTING;
                 }
             },
             onUp: function(buttonCode, value, padIndex){
                if (buttonCode === 3) {
                    this.shooting = States.NO_SHOOTING;
                }
            }
         });
    }

    public process() {
        // TODO: nothing to do as handled by callbacks
    }
}

export class DummyControlEngine extends AbstractControlEngine {

    private player: Ship;
    private sprite: Phaser.Sprite;

    public constructor (player: Ship, mySprite: Phaser.Sprite) {
        super();
        this.player = player;
        this.sprite = mySprite;
    }

    public process() {

        // nothing to do in the dummy engine
        if (this.seePlayer() === false) {
            this.acceleration = States.NO_ACCELERATION;
        } else {

            // cf http://phaser.io/examples/v2/p2-physics/accelerate-to-object
            // TODO: this is pretty cool but not very compatible with manual controls!
            let speed = 200;
            let angle = Math.atan2(this.player.getY() - this.sprite.y, this.player.getX() - this.sprite.x);
            this.sprite.body.rotation = angle + Phaser.Math.degToRad(90);
            this.sprite.body.force.x = Math.cos(angle) * speed;
            this.sprite.body.force.y = Math.sin(angle) * speed;

            /*
            let distance = this.getDistanceFromPlayer();
            if (distance > 100) {
                this.acceleration = States.ACCELERATION;
            } else {
                this.acceleration = States.BRAKING;
            }

            if (this.player.getX() > this.sprite.x) {
                this.rotation = States.RIGHT_ROTATION;
            } else if (this.player.getX() < this.sprite.x) {
                this.rotation = States.LEFT_ROTATION;
            } else {
                this.rotation = States.NO_ROTATION;
            }*/
        }
    }

    private seePlayer() {
        let scope = 300;
        return (Math.abs(this.player.getX() - this.sprite.x) < scope)
            && (Math.abs(this.player.getY() - this.sprite.y) < scope);
    }

    private getDistanceFromPlayer() {
        return Math.sqrt(
            Math.pow(this.sprite.x - this.player.getX(), 2) + Math.pow(this.sprite.y - this.player.getY(), 2)
        );
    }
}
