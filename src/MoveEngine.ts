
export interface IMoveEngine {
    process();
    isAccelerating();
    isNotAccelerating();
    isBraking();
    isRotatingLeft();
    isRotatingRight();
    isNotRotating();
}

class States {
    public static NO_ROTATION: number = 0;
    public static LEFT_ROTATION: number = -1;
    public static RIGHT_ROTATION: number = 1;
    public static NO_ACCELERATION: number = 0;
    public static ACCELERATION: number = 1;
    public static BRAKING: number = -1;
}

abstract class AbstractMoveEngine implements IMoveEngine {
    protected rotation: number = States.NO_ROTATION;
    protected acceleration: number = States.NO_ACCELERATION;

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
}

export class KeyboardMoveEngine extends AbstractMoveEngine {
    private cursors: Phaser.CursorKeys;

    constructor (cursors: Phaser.CursorKeys) {
        super();
        this.cursors = cursors;
    }

    public process() {
        if (this.cursors.left.isDown) {
            this.rotation = States.LEFT_ROTATION;
        } else if (this.cursors.right.isDown) {
            this.rotation = States.RIGHT_ROTATION;
        } else {
            this.rotation = States.NO_ROTATION;
        }

        if (this.cursors.up.isDown) {
            this.acceleration = States.ACCELERATION;
        } else if (this.cursors.down.isDown) {
            this.acceleration = States.BRAKING;
        }
    }
}

export class GamePadEngine  extends AbstractMoveEngine {
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
         });
    }

    public process() {
        // TODO: nothing to do as handled by callbacks
    }
}