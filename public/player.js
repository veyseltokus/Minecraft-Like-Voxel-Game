// Player info
export const player = {
    // Spawn a bit above ground, so you can see falling.
    position: new THREE.Vector3(0, 2, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0.09,
    onGround: false,

    // Player is now 1.8 blocks tall.
    height: 1.8,

    // Jump strength stays the same; feel free to adjust if desired.
    jumpStrength: 0.09,

    // Collision radius (horizontal "width" around the player).
    radius: 0.3
};

// Adjusted gravity so the player falls slower
export const GRAVITY = 0.0012;

export const keys = {};