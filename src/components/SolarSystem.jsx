import React from "react";
import { useRef } from "react";
import { useEffect } from "react";
import * as THREE from "three";
import { celestialData } from "../data/celestialData";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function SolarSystem() {
  const mountRef = useRef();
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const celestialRef = useRef({});
  const controlsRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    cameraRef.current.position.set(0, 30, 50);
    cameraRef.current.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1.5);
    scene.add(sunLight);

    setTimeout(() => {
      controlsRef.current = new OrbitControls(
        cameraRef.current,
        renderer.domElement
      );
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
      controlsRef.current.enableZoom = true;
    }, 100);

    createStars(scene);

    Object.entries(celestialData).forEach(([id, planet]) => {
      const planetObj = createPlanet(id, planet);
      scene.add(planetObj);

      // Create orbit line for planet (except sun)
      if (id !== "sun") {
        const orbitLine = createOrbitLine(planet.orbitRadius);
        sceneRef.current.add(orbitLine);
      }

      // Create moons if any
      //   if (planet.moons && planet.moons.length > 0) {
      //     planet.moons.forEach((moonData, index) => {
      //       const moon = createMoon(`${id}-moon-${index}`, moonData, planetObj);
      //       // Moon orbits are managed in the animation loop
      //     });
      //   }
    });

    let startTime = Date.now(); // Store initial time
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta(); // Get the time difference since the last frame
      Object.entries(celestialData).forEach(([id, data]) => {
        const celestialObj = celestialRef.current[id];

        if (celestialObj) {
          celestialObj.rotation.y += data.rotationSpeed;

          if (id !== "sun") {
            const time = Date.now() * 0.1;
            const angle = time * data.orbitSpeed;

            celestialObj.position.x = Math.cos(angle) * data.orbitRadius;
            celestialObj.position.z = Math.sin(angle) * data.orbitRadius;
          }
        }
      });
      //   const sunObject = celestialRef.current["sun"];
      //   if (sunObject) {
      //     sunObject.rotation.y += 0.5 * delta;
      //   }

      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(sceneRef.current, cameraRef.current);
    }

    animate();
    renderer.render(sceneRef.current, cameraRef.current);
  }, []);

  const createMoon = (id, data, parentPlanet) => {
    const geometry = new THREE.SphereGeometry(data.radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.5,
      metalness: 0.2,
    });

    const moon = new THREE.Mesh(geometry, material);
    moon.userData = { id, type: "moon" };

    // Store reference for animation
    celestialRef.current[id] = moon;

    // Add to scene
    sceneRef.current.add(moon);

    return moon;
  };

  const createPlanet = (id, data) => {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    let material;

    if (data.emissive) {
      material = new THREE.MeshBasicMaterial({ color: data.color });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.5,
        metalness: 0.2,
      });
    }

    const planet = new THREE.Mesh(geometry, material);
    group.add(planet);
    const wireFrameGeometry = new THREE.WireframeGeometry(geometry);
    const wireFrameMaterial = new THREE.LineBasicMaterial({ color: "#e5e5e5" });
    const wireFrame = new THREE.LineSegments(
      wireFrameGeometry,
      wireFrameMaterial
    );
    group.add(wireFrame);
    group.position.set(...data.position);
    group.userData = { id, type: "planet" };

    // Store reference for animation
    celestialRef.current[id] = group;

    return group;
  };

  return <div ref={mountRef}></div>;
}

const createStars = (scene) => {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
  });

  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
  );
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
};

const createOrbitLine = (radius) => {
  const segments = 64;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius)
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x444444,
    transparent: true,
    opacity: 0.3,
  });

  return new THREE.Line(geometry, material);
};

export default SolarSystem;
