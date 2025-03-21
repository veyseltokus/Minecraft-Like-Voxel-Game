// worldMesher.js

export function buildChunkMesh(chunk, BLOCK_TYPES) {
  const group = new THREE.Group();

  const { blocks, cx, cz } = chunk;
  const size   = blocks.length;       // X,Z = chunk size (16 by default)
  const height = blocks[0].length;    // Y = chunk height (64 by default)

  // World offset so chunk "zero" lines up in the correct place
  const worldX = cx * size;
  const worldZ = cz * size;

  // 1) Group block positions by their blockID
  //    We'll store them so that for each blockID, we have an array of {x,y,z} of positions
  const blockPositionsByType = new Map(); 
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < size; z++) {
        const blockID = blocks[x][y][z];
        if (blockID < 0) continue; // air

        if (!blockPositionsByType.has(blockID)) {
          blockPositionsByType.set(blockID, []);
        }
        blockPositionsByType.get(blockID).push({ x, y, z });
      }
    }
  }

  // 2) For each block type, create ONE InstancedMesh with
  //    as many instances as blocks of that type
  blockPositionsByType.forEach((positions, blockID) => {
    const color = BLOCK_TYPES[blockID].color;

    // Create geometry & material for this block type
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color });

    const meshCount = positions.length;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, meshCount);

    // We must set a matrix for each instance
    const dummy = new THREE.Object3D();
    for (let i = 0; i < meshCount; i++) {
      const pos = positions[i];
      dummy.position.set(
        worldX + pos.x + 0.5,
        pos.y + 0.5,
        worldZ + pos.z + 0.5
      );
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    // Optionally set color per instance if you want variation
    // instancedMesh.setColorAt(i, someColor);

    group.add(instancedMesh);
  });

  return group;
}
