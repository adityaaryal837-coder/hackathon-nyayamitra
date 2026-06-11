'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCanvasProps {
  imageSrc: string;
  type: 'statue' | 'hammer';
}

const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ imageSrc, type }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Texture Loader
    const textureLoader = new THREE.TextureLoader();
    let mesh: THREE.Mesh | null = null;
    let particles: THREE.Points | null = null;

    // Set configuration based on image type
    // We target the scales of justice for the statue, and the hand/gavel for the hammer
    const config = {
      center: type === 'statue' ? new THREE.Vector2(0.32, 0.65) : new THREE.Vector2(0.5, 0.45),
      radius: type === 'statue' ? 0.25 : 0.35,
      amplitude: type === 'statue' ? 0.02 : 0.035,
      speed: type === 'statue' ? 1.8 : 2.5,
    };

    textureLoader.load(
      imageSrc,
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        // Custom Shader Material for localized cinemagraph warping
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uCenter: { value: config.center },
            uRadius: { value: config.radius },
            uAmplitude: { value: config.amplitude },
            uSpeed: { value: config.speed },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform vec2 uCenter;
            uniform float uRadius;
            uniform float uAmplitude;
            uniform float uSpeed;
            varying vec2 vUv;

            void main() {
              vec2 uv = vUv;
              
              // Calculate distance to animation center in UV space
              float dist = distance(uv, uCenter);
              
              // Calculate smooth weight based on radius
              float weight = smoothstep(uRadius, 0.0, dist);
              
              // Apply vertical displacement to create cinemagraph movement
              float wave = sin(uTime * uSpeed) * uAmplitude * weight;
              uv.y += wave;

              // Apply secondary subtle horizontal wobble for organic balance feel
              if (weight > 0.0) {
                uv.x += cos(uTime * uSpeed * 0.8) * (uAmplitude * 0.25) * weight;
              }

              vec4 color = texture2D(uTexture, uv);
              
              // Soft vignette/overlay for law portal serious design
              float distToCenter = distance(vUv, vec2(0.5));
              color.rgb *= (1.0 - distToCenter * 0.35);
              
              gl_FragColor = color;
            }
          `,
          transparent: true,
        });

        // Determine size of plane keeping aspect ratio of background container
        const aspect = texture.image.width / texture.image.height;
        const containerAspect = width / height;
        
        let planeW = 6;
        let planeH = 6 / aspect;

        if (containerAspect > aspect) {
          // container is wider than image aspect
          planeW = 4.5 * containerAspect;
          planeH = planeW / aspect;
        } else {
          planeH = 4.5;
          planeW = planeH * aspect;
        }

        const geometry = new THREE.PlaneGeometry(planeW, planeH, 32, 32);
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      },
      undefined,
      (err) => {
        console.error('Failed to load Three.js image texture:', err);
      }
    );

    // 5. Dust Particles (Glowing ambient effect)
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Spread particles in a 3D box
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3 + 1; // Float in front of plane
      speeds[i] = 0.1 + Math.random() * 0.4;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xC5A880, // Gold glow
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 6. Animation loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Update shader uniforms
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.uTime.value = elapsedTime;
      }

      // Animate dust particles
      if (particles) {
        const positionAttr = particles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          let y = positionAttr.getY(i);
          y += 0.002 * speeds[i]; // Float upwards
          
          // Reset if float past top boundary
          if (y > 3) {
            y = -3;
          }
          positionAttr.setY(i, y);

          // Subtle horizontal drift
          let x = positionAttr.getX(i);
          x += Math.sin(elapsedTime + i) * 0.001;
          positionAttr.setX(i, x);
        }
        positionAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose geometry and materials
      if (mesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }

      if (particles) {
        particles.geometry.dispose();
        if (Array.isArray(particles.material)) {
          particles.material.forEach(m => m.dispose());
        } else {
          particles.material.dispose();
        }
      }
    };
  }, [imageSrc, type]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity duration-1000"
    />
  );
};

export default ThreeCanvas;
