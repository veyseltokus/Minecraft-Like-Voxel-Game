// perlin.js
// Minimal Perlin implementation. 
// Based on permutations approach from Ken Perlin's reference code.

export class Perlin {
    constructor(seed = 0) {
      this.permutation = new Uint8Array(512);
      this.generatePermutation(seed);
    }
  
    generatePermutation(seed) {
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        p[i] = i;
      }
  
      // Simple LCG or similar to shuffle based on 'seed'
      let random = mulberry32(seed * 10000);
      for (let i = 255; i > 0; i--) {
        const index = Math.floor(random() * (i + 1));
        [p[i], p[index]] = [p[index], p[i]];
      }
  
      // Duplicate
      for (let i = 0; i < 512; i++) {
        this.permutation[i] = p[i & 255];
      }
    }
  
    // The noise function
    noise(x, y, z) {
      const floorX = Math.floor(x) & 255;
      const floorY = Math.floor(y) & 255;
      const floorZ = Math.floor(z) & 255;
  
      const X = x - Math.floor(x);
      const Y = y - Math.floor(y);
      const Z = z - Math.floor(z);
  
      const A  = this.permutation[floorX] + floorY;
      const AA = this.permutation[A] + floorZ;
      const AB = this.permutation[A + 1] + floorZ;
      const B  = this.permutation[floorX + 1] + floorY;
      const BA = this.permutation[B] + floorZ;
      const BB = this.permutation[B + 1] + floorZ;
  
      return lerp(
        lerp(
          lerp( grad(this.permutation[AA], X, Y, Z),
                grad(this.permutation[BA], X - 1, Y, Z),
                fade(X)
          ),
          lerp( grad(this.permutation[AB], X, Y - 1, Z),
                grad(this.permutation[BB], X - 1, Y - 1, Z),
                fade(X)
          ),
          fade(Y)
        ),
        lerp(
          lerp( grad(this.permutation[AA + 1], X, Y, Z - 1),
                grad(this.permutation[BA + 1], X - 1, Y, Z - 1),
                fade(X)
          ),
          lerp( grad(this.permutation[AB + 1], X, Y - 1, Z - 1),
                grad(this.permutation[BB + 1], X - 1, Y - 1, Z - 1),
                fade(X)
          ),
          fade(Y)
        ),
        fade(Z)
      );
    }
  }
  
  /** Helpers for Perlin: fade, grad, lerp, etc. */
  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a, b, t) {
    return a + t * (b - a);
  }
  function grad(hash, x, y, z) {
    switch(hash & 15) {
      case 0:  return  x + y;
      case 1:  return -x + y;
      case 2:  return  x - y;
      case 3:  return -x - y;
      case 4:  return  x + z;
      case 5:  return -x + z;
      case 6:  return  x - z;
      case 7:  return -x - z;
      case 8:  return  y + z;
      case 9:  return -y + z;
      case 10: return  y - z;
      case 11: return -y - z;
      case 12: return  x + y;
      case 13: return -x + y;
      case 14: return  x - y;
      case 15: return -x - y;
      default: return 0; // never happens
    }
  }
  
  /** A small seeded random generator */
  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  