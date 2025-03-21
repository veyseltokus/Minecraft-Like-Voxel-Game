import { buildChunkMesh } from './worldMesher.js';  // Face-culling mesher
import { generateChunkData } from './worldgen.js';  // Procedural terrain

// world.js
export const world = new Map();


export const BLOCK_TYPES = [
  { color: 0x003300 }, // grass
  { color: 0x8B4513 }, // dirt
  { color: 0xA9A9A9 }, // stone
  { color: 0x0000ff }, // water
  { color: 0xffffff }, // snow
  { color: 0xff00ff }, // purple
  { color: 0xdebf90 }, // sand (added at index=6)
  // etc.
];
export const CHUNK_SIZE = 16;
export const RENDER_DISTANCE = 6;

// This is our single authoritative chunk storage
const chunkStorage = new Map();

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

export function getChunk(cx, cz) {
  return chunkStorage.get(chunkKey(cx, cz)) || null;
}

export function hasChunk(cx, cz) {
  return chunkStorage.has(chunkKey(cx, cz));
}

/**
 * Make sure chunk at (cx,cz) exists: if missing, generate it and add to scene.
 */
export function ensureChunkExists(cx, cz, scene) {
  const key = chunkKey(cx, cz);
  if (chunkStorage.has(key)) {
    return; // Already created
  }

  // 1) Generate terrain data for this chunk
  const blocks = generateChunkData(cx, cz);

  // 2) Build chunk object
  const chunk = {
    cx,
    cz,
    blocks,
    mesh: null
  };

  // 3) Build the chunk's group of block meshes
  const mesh = buildChunkMesh(chunk, BLOCK_TYPES);
  scene.add(mesh);

  chunk.mesh = mesh;

  // 4) Store in chunkStorage for retrieval by collisions, etc.
  chunkStorage.set(key, chunk);
}

/**
 * After changing any block data in a chunk, call this to rebuild its meshes.
 */
function rebuildChunkMesh(chunk, scene) {
  if (chunk.mesh) {
    scene.remove(chunk.mesh);
    // If you want, dispose geometry/material for memory cleanup:
    chunk.mesh.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });
  }
  const newMesh = buildChunkMesh(chunk, BLOCK_TYPES);
  scene.add(newMesh);
  chunk.mesh = newMesh;
}

/**
 * Convert (worldX, worldZ) to chunk coords and local voxel coords.
 */
function worldToChunkCoords(x, z) {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cz = Math.floor(z / CHUNK_SIZE);
  const lx = x - cx * CHUNK_SIZE;
  const lz = z - cz * CHUNK_SIZE;
  return { cx, cz, lx, lz };
}

/**
 * Return block ID at (x,y,z). -1 if air or if chunk not loaded.
 */
export function getBlock(x, y, z) {
  // Simple vertical bounds check
  if (y < 0 || y >= 64) {
    return -1;
  }

  const { cx, cz, lx, lz } = worldToChunkCoords(x, z);
  const chunk = getChunk(cx, cz);
  if (!chunk) {
    return -1;
  }
  // Access chunk.blocks[lx][y][lz], assuming chunk height = 64
  return chunk.blocks[lx][y][lz];
}

/**
 * Place a block (blockType) at (x,y,z) and rebuild chunk.
 */
export function addBlock(x, y, z, blockType, scene) {
  if (y < 0 || y >= 64) return;

  const { cx, cz, lx, lz } = worldToChunkCoords(x, z);
  let chunk = getChunk(cx, cz);
  if (!chunk) {
    ensureChunkExists(cx, cz, scene);
    chunk = getChunk(cx, cz);
    if (!chunk) return;
  }
  chunk.blocks[lx][y][lz] = blockType;
  rebuildChunkMesh(chunk, scene);
}

/**
 * Remove the block at (x,y,z) by setting it to -1, then rebuild.
 */
export function removeBlock(x, y, z, scene) {
  if (y < 0 || y >= 64) return;

  const { cx, cz, lx, lz } = worldToChunkCoords(x, z);
  const chunk = getChunk(cx, cz);
  if (!chunk) return;

  chunk.blocks[lx][y][lz] = -1;
  rebuildChunkMesh(chunk, scene);
}

/**
 * Load/generate all chunks within RENDER_DISTANCE around (px,pz).
 * (Optional: also unload chunks that are too far away.)
 */
export function updateWorld(px, pz, scene) {
  const cx = Math.floor(px / CHUNK_SIZE);
  const cz = Math.floor(pz / CHUNK_SIZE);

  const inRangeKeys = new Set();

  // Generate all chunks in RENDER_DISTANCE
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      const key = chunkKey(cx + dx, cz + dz);
      inRangeKeys.add(key);
      // create if missing
      ensureChunkExists(cx + dx, cz + dz, scene);
    }
  }

  // Unload chunks not in inRangeKeys
  for (const existingKey of chunkStorage.keys()) {
    if (!inRangeKeys.has(existingKey)) {
      const chunk = chunkStorage.get(existingKey);
      if (chunk && chunk.mesh) {
        scene.remove(chunk.mesh);
        // dispose geometry, materials, etc. if you like
        chunk.mesh.traverse(obj => {
          if (obj.isMesh) {
            obj.geometry.dispose();
            obj.material.dispose();
          }
        });
      }
      chunkStorage.delete(existingKey);
    }
  }
}
