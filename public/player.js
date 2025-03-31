// Player info
export const player = {
    // Spawn a bit above ground, so you can see falling.
    position: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0.09,
    onGround: false,

    // Player is now 1.2522 blocks tall.
    height: 1.2522,

    // Jump strength stays the same; feel free to adjust if desired.
    jumpStrength: 0.08,

    // Collision radius (horizontal "width" around the player).
    radius: 0.3
};

// Adjusted gravity so the player falls slower
export const GRAVITY = 0.0019;

export const keys = {};