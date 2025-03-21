// collision.js
import { player } from './player.js';
import { getBlock } from './world.js';

export function isCollidingWithBlock(px, py, pz) {
  // Player's bounding box in world coords
  const minX = px - 0.3;
  const maxX = px + 0.3;
  const minY = py;
  const maxY = py + 1.8;
  const minZ = pz - 0.3;
  const maxZ = pz + 0.3;

  // Convert bounding box to voxel coordinates, then iterate
  const startX = Math.floor(minX);
  const endX   = Math.floor(maxX);
  const startY = Math.floor(minY);
  const endY   = Math.floor(maxY);
  const startZ = Math.floor(minZ);
  const endZ   = Math.floor(maxZ);

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      for (let z = startZ; z <= endZ; z++) {
        const blockID = getBlock(x, y, z);
        if (blockID >= 0) {
          // It's a solid block => collision
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Check if placing a block at (bx,by,bz) would overlap the player bounding box.
 */
export function blockIntersectsPlayer(bx, by, bz) {
  const blockMinX = bx - 0.5;
  const blockMaxX = bx + 0.5;
  const blockMinY = by - 0.5;
  const blockMaxY = by + 0.5;
  const blockMinZ = bz - 0.5;
  const blockMaxZ = bz + 0.5;

  const px = player.position.x;
  const py = player.position.y;
  const pz = player.position.z;

  const playerMinX = px - player.radius;
  const playerMaxX = px + player.radius;
  const playerMinY = py;
  const playerMaxY = py + player.height;
  const playerMinZ = pz - player.radius;
  const playerMaxZ = pz + player.radius;

  const overlapX = (blockMinX <= playerMaxX) && (blockMaxX >= playerMinX);
  const overlapY = (blockMinY <= playerMaxY) && (blockMaxY >= playerMinY);
  const overlapZ = (blockMinZ <= playerMaxZ) && (blockMaxZ >= playerMinZ);

  return (overlapX && overlapY && overlapZ);
}
