// camera.js
import { player } from './player.js';

// We'll define global references so other files can access if needed
export let camera;
export let playerYawObject;
export let playerPitchObject;

export function initCamera(scene) {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  playerYawObject = new THREE.Object3D();
  playerPitchObject = new THREE.Object3D();

  playerYawObject.add(playerPitchObject);
  playerPitchObject.add(camera);

  scene.add(playerYawObject);

  // Initialize the camera rig at player position
  playerYawObject.position.copy(player.position);
  playerYawObject.position.y = player.position.y + player.height;
}

/**
 * Called on mouse move, rotates the yaw/pitch objects.
 */
export function onMouseMove(event) {
  if (document.pointerLockElement) {
    // Yaw (left/right)
    playerYawObject.rotation.y -= event.movementX * 0.002;

    // Pitch (up/down)
    playerPitchObject.rotation.x -= event.movementY * 0.002;

    // Clamp pitch between -90 and +90 degrees
    const maxPitch = Math.PI / 2;
    if (playerPitchObject.rotation.x < -maxPitch) {
      playerPitchObject.rotation.x = -maxPitch;
    }
    if (playerPitchObject.rotation.x > maxPitch) {
      playerPitchObject.rotation.x = maxPitch;
    }
  }
}
