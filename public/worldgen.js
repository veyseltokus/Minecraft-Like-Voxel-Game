// worldgen.js
import { Perlin } from './perlin.js';
import { CHUNK_SIZE } from './world.js';

const CHUNK_HEIGHT = 64;
const perlin = new Perlin(Math.random());

// Noise scales for each biome
const DESERT_FREQ = 0.03; // Slightly higher freq to make dunes
const DESERT_AMP  = 4;    // Shallow dunes
const PLAINS_FREQ = 0.01; // Large-scale gentle rolling
const PLAINS_AMP  = 6;    
const HILLS_FREQ  = 0.015; 
const HILLS_AMP   = 20;   // Taller amplitude

// Let’s define block IDs matching your BLOCK_TYPES array indices:
const BLOCK_GRASS = 0;
const BLOCK_DIRT  = 1;
const BLOCK_STONE = 2;
const BLOCK_WATER = 3; // optional
const BLOCK_SAND  = 6; // let's say you add SAND = 6 in your array
// etc. Add more as needed!

/**
 * Generate the chunk's 3D block array (size: CHUNK_SIZE x CHUNK_HEIGHT x CHUNK_SIZE).
 */
export function generateChunkData(cx, cz) {
  const blocks = [];
  for (let x = 0; x < CHUNK_SIZE; x++) {
    blocks[x] = [];
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      blocks[x][y] = new Array(CHUNK_SIZE).fill(-1); // Initialize to air
    }
  }

  // Fill in terrain
  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;

      // 1) Determine biome mixing
      const biomeVal = getBiomeNoise(wx, wz); // in [-1..1]
      // We'll map [-1..1] -> [0..1], then define ranges for each biome
      const b = (biomeVal + 1) * 0.5; // now 0..1

      // We can define e.g.:
      //   [0..0.33) => desert
      //   [0.33..0.66) => plains
      //   [0.66..1] => hills
      // but to get smoother transitions, let's do a small "blend band"
      const biomeWeights = getBiomeWeights(b);

      // 2) For each biome, compute a "candidate" height, then combine them 
      const desertHeight = getDesertHeight(wx, wz);
      const plainsHeight = getPlainsHeight(wx, wz);
      const hillsHeight  = getHillsHeight(wx, wz);

      // Weighted average:
      const terrainHeight = Math.round(
        desertHeight * biomeWeights.desert +
        plainsHeight * biomeWeights.plains +
        hillsHeight  * biomeWeights.hills
      );

      // 3) Fill blocks up to that height
      for (let wy = 0; wy <= terrainHeight; wy++) {
        // We'll choose top block by whichever biome is most dominant
        //  (largest weight).
        // Or you can do a weighted blend of the top blocks as well. 
        // We'll keep it simple:
        const topBiome = getDominantBiome(biomeWeights);

        // pickBlockForBiome() => top block depends on biome
        let blockID = pickBlockForBiome(topBiome, wy, terrainHeight);

        // If below top, we might do dirt or stone
        // but let's do a simple layering:
        // top layer => grass or sand
        // next ~3 layers => dirt or sand
        // below => stone
        // We'll do that in pickBlockForBiome() or below:

        blocks[lx][wy][lz] = blockID;
      }
    }
  }

  return blocks;
}

/**
 * Return a low-frequency noise in [-1..1] to determine overall biome changes.
 */
function getBiomeNoise(x, z) {
  // Try a very low frequency so large swaths form each biome
  // e.g. 0.001 => 1 "biome wave" every 1000 blocks
  return perlin.noise(x * 0.001, z * 0.001, 0);
}

/**
 * Given the mapped biome value b in [0..1], 
 * return an object with weights for each of the three biomes:
 * desert, plains, hills
 * using a small blend zone around boundaries: 0.33 and 0.66
 */
function getBiomeWeights(b) {
  // Hard-coded boundaries:
  const desertCenter = 0.1667; // mid of [0..0.33]
  const plainsCenter = 0.5;    // mid of [0.33..0.66]
  const hillsCenter  = 0.8333; // mid of [0.66..1]

  // We'll do a triangular weighting approach:
  const dDist = Math.abs(b - desertCenter);
  const pDist = Math.abs(b - plainsCenter);
  const hDist = Math.abs(b - hillsCenter);

  // Some max radius to define a 0 weight
  const radius = 0.1667; // ~1/6 => each biome's "region"
  // We convert distance to a weight in [0..1], 
  // weight = 1 - (distance/radius), clamp at 0
  let wDesert = 1 - (dDist / radius);
  let wPlains = 1 - (pDist / radius);
  let wHills  = 1 - (hDist / radius);

  wDesert = Math.max(0, wDesert);
  wPlains = Math.max(0, wPlains);
  wHills  = Math.max(0, wHills);

  // Normalize so sum=1 (unless all are 0, which can't happen if b in [0..1])
  const sum = wDesert + wPlains + wHills;
  if (sum > 0) {
    wDesert /= sum;
    wPlains /= sum;
    wHills  /= sum;
  } else {
    // fallback: all desert
    wDesert = 1;
  }

  return { desert: wDesert, plains: wPlains, hills: wHills };
}

/**
 * Return the single biome name with the largest weight
 */
function getDominantBiome(weights) {
  if (weights.desert >= weights.plains && weights.desert >= weights.hills) {
    return 'desert';
  }
  if (weights.plains >= weights.hills) {
    return 'plains';
  }
  return 'hills';
}

/**
 * Return "desert style" terrain height for (x,z)
 */
function getDesertHeight(x, z) {
  // Maybe small amplitude dunes
  // offset by some base height so it's not near bedrock
  const n = perlin.noise(x * DESERT_FREQ, z * DESERT_FREQ, 1); // seed=1
  const h = (n * DESERT_AMP) + 32; // center around y=32
  return h;
}

/**
 * Return "plains style" terrain height
 */
function getPlainsHeight(x, z) {
  // Gentle rolling
  const n = perlin.noise(x * PLAINS_FREQ, z * PLAINS_FREQ, 2);
  const h = (n * PLAINS_AMP) + 30;
  return h;
}

/**
 * Return "hills style" terrain height
 */
function getHillsHeight(x, z) {
  // Larger amplitude
  const n = perlin.noise(x * HILLS_FREQ, z * HILLS_FREQ, 3);
  const h = (n * HILLS_AMP) + 28;
  return h;
}

/**
 * Pick the top-layer block for the given biome,
 * plus logic for deeper layers (dirt vs. stone, etc.)
 * `wy` is the current fill level, `terrainHeight` is the top
 */
function pickBlockForBiome(biome, wy, terrainHeight) {
  // Distance from top
  const distFromTop = terrainHeight - wy;

  switch(biome) {
    case 'desert':
      // Top block = sand, next few blocks also sand, then stone
      if (distFromTop === 0) {
        return BLOCK_SAND; 
      }
      if (distFromTop < 4) {
        return BLOCK_SAND; 
      }
      return BLOCK_STONE;

    case 'plains':
      // Top = grass, next 3 layers = dirt, rest stone
      if (distFromTop === 0) {
        return BLOCK_GRASS;
      }
      if (distFromTop < 4) {
        return BLOCK_DIRT;
      }
      return BLOCK_STONE;

    case 'hills':
      // Same layering as plains, just bigger hills. 
      // Could do something else (maybe some gravel, etc.)
      if (distFromTop === 0) {
        return BLOCK_GRASS;
      }
      if (distFromTop < 4) {
        return BLOCK_DIRT;
      }
      return BLOCK_STONE;
  }

  // fallback
  return BLOCK_STONE;
}

/**
 * If you want to quickly get the surface height for the player's spawn:
 */
export function getSurfaceHeight(x, z) {
  // Weighted approach:
  const b = (getBiomeNoise(x, z) + 1) * 0.5; // map to [0..1]
  const weights = getBiomeWeights(b);
  const hd = getDesertHeight(x, z);
  const hp = getPlainsHeight(x, z);
  const hh = getHillsHeight(x, z);

  const height = Math.round(
    hd * weights.desert + 
    hp * weights.plains + 
    hh * weights.hills
  );
  return Math.max(0, Math.min(63, height));
}
