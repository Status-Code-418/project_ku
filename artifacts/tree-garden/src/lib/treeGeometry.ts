import * as THREE from 'three';
import { GrowthStage } from '../hooks/useGardenState';

// TODO: replace with GLB when user provides file (use THREE.GLTFLoader)
export function createTree(stage: GrowthStage): THREE.Group {
  const treeGroup = new THREE.Group();

  // Materials
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033, // brown
    roughness: 0.9,
  });

  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2d5a27, // deep green
    roughness: 0.8,
  });

  if (stage === 0) { // Seed / tiny sprout
    const stemGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 5);
    const stem = new THREE.Mesh(stemGeom, foliageMaterial);
    stem.position.y = 0.1;
    treeGroup.add(stem);
    
    const leafGeom = new THREE.SphereGeometry(0.08, 5, 5);
    const leaf = new THREE.Mesh(leafGeom, foliageMaterial);
    leaf.position.y = 0.2;
    treeGroup.add(leaf);
    
  } else if (stage === 1) { // Sprout
    const trunkGeom = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 7);
    const trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
    trunk.position.y = 0.3;
    treeGroup.add(trunk);
    
    const foliageGeom = new THREE.SphereGeometry(0.3, 7, 7);
    const foliage = new THREE.Mesh(foliageGeom, foliageMaterial);
    foliage.position.y = 0.7;
    treeGroup.add(foliage);
    
  } else if (stage === 2) { // Sapling
    const trunkGeom = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8);
    const trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
    trunk.position.y = 0.6;
    treeGroup.add(trunk);
    
    const foliageGeom1 = new THREE.SphereGeometry(0.5, 8, 8);
    const foliage1 = new THREE.Mesh(foliageGeom1, foliageMaterial);
    foliage1.position.set(0, 1.3, 0);
    treeGroup.add(foliage1);
    
    const foliageGeom2 = new THREE.SphereGeometry(0.4, 8, 8);
    const foliage2 = new THREE.Mesh(foliageGeom2, foliageMaterial);
    foliage2.position.set(0.2, 1.1, 0.2);
    treeGroup.add(foliage2);
    
  } else if (stage === 3) { // Young Tree
    const trunkGeom = new THREE.CylinderGeometry(0.2, 0.25, 2.0, 8);
    const trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
    trunk.position.y = 1.0;
    treeGroup.add(trunk);
    
    // Add multiple branches/foliage spheres
    const fPositions = [
      [0, 2.2, 0, 0.8],
      [0.4, 1.8, 0.4, 0.6],
      [-0.5, 1.9, 0.2, 0.6],
      [0.2, 1.7, -0.5, 0.5]
    ];
    
    fPositions.forEach(([x, y, z, r]) => {
      const g = new THREE.SphereGeometry(r, 8, 8);
      const m = new THREE.Mesh(g, foliageMaterial);
      m.position.set(x, y, z);
      treeGroup.add(m);
    });
    
  } else if (stage === 4) { // Mature Tree
    const trunkGeom = new THREE.CylinderGeometry(0.4, 0.5, 3.5, 12);
    const trunk = new THREE.Mesh(trunkGeom, trunkMaterial);
    trunk.position.y = 1.75;
    treeGroup.add(trunk);
    
    const fPositions = [
      [0, 3.8, 0, 1.5],
      [1.0, 3.0, 0.8, 1.2],
      [-1.2, 3.2, 0.5, 1.1],
      [0.5, 2.8, -1.0, 1.0],
      [-0.8, 2.6, -0.8, 0.9],
      [0.0, 4.5, 0.0, 1.0]
    ];
    
    fPositions.forEach(([x, y, z, r]) => {
      const g = new THREE.SphereGeometry(r, 12, 12);
      const m = new THREE.Mesh(g, foliageMaterial);
      m.position.set(x, y, z);
      // Give slightly different green shades to foliage
      const shadeMaterial = foliageMaterial.clone();
      const colorOffset = (Math.random() - 0.5) * 0.1;
      shadeMaterial.color.offsetHSL(colorOffset, 0, colorOffset * 0.5);
      m.material = shadeMaterial;
      treeGroup.add(m);
    });
  }

  // Cast shadows
  treeGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return treeGroup;
}
