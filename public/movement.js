// movement.js
import { player, keys, GRAVITY } from './player.js';
import { isCollidingWithBlock } from './collision.js';
import { playerYawObject } from './camera.js';

/**
 * Check collisions, apply gravity, move player each frame.
 */
export function updateMovement() {
  // Forward vector from yaw only
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyEuler(new THREE.Euler(0, playerYawObject.rotation.y, 0));
  forward.normalize();

  // Right vector
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

  // Movement from keys
  let move = new THREE.Vector3();
  if (keys['w']) move.addScaledVector(forward, player.speed);
  if (keys['s']) move.addScaledVector(forward, -player.speed);
  if (keys['a']) move.addScaledVector(right, -player.speed);
  if (keys['d']) move.addScaledVector(right, player.speed);

  // Jump
  if (keys[' ']) {
    if (player.onGround) {
      player.velocity.y = player.jumpStrength;
      player.onGround = false;
    }
  }

  // Gravity
  player.velocity.y -= GRAVITY;

  // Axis-by-axis checks
  const oldX = player.position.x;
  const oldY = player.position.y;
  const oldZ = player.position.z;

  // X
  player.position.x += move.x;
  if (isCollidingWithBlock(player.position.x, player.position.y, player.position.z)) {
    player.position.x = oldX;
  }

  // Z
  player.position.z += move.z;
  if (isCollidingWithBlock(player.position.x, player.position.y, player.position.z)) {
    player.position.z = oldZ;
  }

  // Y
  player.position.y += player.velocity.y;
  if (isCollidingWithBlock(player.position.x, player.position.y, player.position.z)) {
    // If going down => ground
    if (player.velocity.y < 0) {
      player.onGround = true;
    }
    player.position.y = oldY;
    player.velocity.y = 0;
  } else {
    player.onGround = false;
  }

  // Update camera rig
  playerYawObject.position.set(
    player.position.x,
    player.position.y + player.height,
    player.position.z
  );
}
