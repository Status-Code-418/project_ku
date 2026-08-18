import * as THREE from 'three';
import { WeatherType } from './weatherService';

export class ParticleSystem {
  points: THREE.Points;
  private velocities: Float32Array;
  private type: 'leaves' | 'rain' | 'snow';

  constructor(type: 'leaves' | 'rain' | 'snow', count: number) {
    this.type = type;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const leafColors = [
      new THREE.Color(0xd4a373), // warm yellow
      new THREE.Color(0xa3b18a), // pale green
      new THREE.Color(0xda8a67)  // orange
    ];

    for (let i = 0; i < count; i++) {
      // spread in a cylinder/box around tree
      positions[i * 3] = (Math.random() - 0.5) * 15; // x
      positions[i * 3 + 1] = Math.random() * 15 + 2;   // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15; // z

      if (type === 'leaves') {
        this.velocities[i * 3] = (Math.random() - 0.5) * 0.02; 
        this.velocities[i * 3 + 1] = -Math.random() * 0.02 - 0.01;
        this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        const color = leafColors[Math.floor(Math.random() * leafColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      } else if (type === 'rain') {
        this.velocities[i * 3] = 0; 
        this.velocities[i * 3 + 1] = -Math.random() * 0.2 - 0.2;
        this.velocities[i * 3 + 2] = 0;
      } else if (type === 'snow') {
        this.velocities[i * 3] = (Math.random() - 0.5) * 0.01; 
        this.velocities[i * 3 + 1] = -Math.random() * 0.02 - 0.01;
        this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (type === 'leaves') {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    let material: THREE.PointsMaterial;
    if (type === 'leaves') {
      material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });
    } else if (type === 'rain') {
      material = new THREE.PointsMaterial({
        color: 0x88bbff,
        size: 0.05,
        transparent: true,
        opacity: 0.6
      });
    } else {
      material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8
      });
    }

    this.points = new THREE.Points(geometry, material);
  }

  update(time: number, windSpeed: number = 1.0) {
    const positions = this.points.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];

      const vx = this.velocities[i * 3];
      const vy = this.velocities[i * 3 + 1];
      const vz = this.velocities[i * 3 + 2];

      // Update position
      y += vy;
      
      if (this.type === 'leaves' || this.type === 'snow') {
        x += vx + Math.sin(time + i) * 0.01 * windSpeed;
        z += vz + Math.cos(time + i) * 0.01 * windSpeed;
      }

      // Reset if below ground
      if (y < 0) {
        y = Math.random() * 10 + 5;
        x = (Math.random() - 0.5) * 15;
        z = (Math.random() - 0.5) * 15;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
