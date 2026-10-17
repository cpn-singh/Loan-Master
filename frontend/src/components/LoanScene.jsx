import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { WalletCards } from "lucide-react";

// Draws the animated hero card with Three.js and cleans up its GPU resources.
export default function LoanScene() {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer;
    let timer;
    let raf = 0;
    let resizeObserver;
    let pointerX = 0;
    let pointerY = 0;
    const objects = [];
    const disposeObject = (object) =>
      object.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material)
          (Array.isArray(child.material)
            ? child.material
            : [child.material]
          ).forEach((material) => material.dispose());
      });
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0.25, 8.4);
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xd9f0e5, 0x142a2c, 2.1));
      const key = new THREE.DirectionalLight(0xfff2d8, 4.2);
      key.position.set(-3, 4, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new THREE.PointLight(0x70e6bc, 35, 9, 2);
      rim.position.set(3, 1.3, 2.8);
      scene.add(rim);
      const fill = new THREE.PointLight(0x80aaff, 16, 8, 2);
      fill.position.set(-3, -1.8, 2);
      scene.add(fill);

      const roundedShape = (width, height, radius) => {
        const x = -width / 2;
        const y = -height / 2;
        const s = new THREE.Shape();
        s.moveTo(x + radius, y);
        s.lineTo(x + width - radius, y);
        s.quadraticCurveTo(x + width, y, x + width, y + radius);
        s.lineTo(x + width, y + height - radius);
        s.quadraticCurveTo(
          x + width,
          y + height,
          x + width - radius,
          y + height,
        );
        s.lineTo(x + radius, y + height);
        s.quadraticCurveTo(x, y + height, x, y + height - radius);
        s.lineTo(x, y + radius);
        s.quadraticCurveTo(x, y, x + radius, y);
        return s;
      };
      const textTexture = (label, color = "#eaf5ee", size = 48) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = color;
        context.font = `700 ${size}px Manrope, Arial`;
        context.fillText(label, 18, 84);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
      };
      const card = new THREE.Group();
      card.position.set(-0.08, 0.24, 0.25);
      card.rotation.set(-0.2, -0.28, -0.04);
      const cardGeometry = new THREE.ExtrudeGeometry(
        roundedShape(3.65, 2.28, 0.24),
        {
          depth: 0.13,
          bevelEnabled: true,
          bevelSegments: 5,
          steps: 1,
          bevelSize: 0.055,
          bevelThickness: 0.045,
          curveSegments: 12,
        },
      );
      cardGeometry.center();
      const cardMesh = new THREE.Mesh(
        cardGeometry,
        new THREE.MeshPhysicalMaterial({
          color: 0x145541,
          metalness: 0.35,
          roughness: 0.25,
          clearcoat: 0.92,
          clearcoatRoughness: 0.17,
        }),
      );
      cardMesh.castShadow = true;
      cardMesh.receiveShadow = true;
      card.add(cardMesh);
      const logoTexture = textTexture("LOANWISE", "#d8eee0", 40);
      const logo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.42, 0.36),
        new THREE.MeshBasicMaterial({
          map: logoTexture,
          transparent: true,
          toneMapped: false,
        }),
      );
      logo.position.set(-0.78, 0.68, 0.11);
      card.add(logo);
      const cardLabelTexture = textTexture(
        "YOUR LOAN. IN CLEAR VIEW.",
        "#a9cfb6",
        19,
      );
      const cardLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.25, 0.28),
        new THREE.MeshBasicMaterial({
          map: cardLabelTexture,
          transparent: true,
          toneMapped: false,
        }),
      );
      cardLabel.position.set(-0.36, -0.67, 0.11);
      card.add(cardLabel);
      const gold = new THREE.MeshPhysicalMaterial({
        color: 0xd4b276,
        metalness: 0.82,
        roughness: 0.24,
        clearcoat: 0.7,
      });
      const chip = new THREE.Mesh(
        new THREE.ExtrudeGeometry(roundedShape(0.55, 0.42, 0.07), {
          depth: 0.028,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.015,
          bevelThickness: 0.012,
        }),
        gold,
      );
      chip.position.set(-1.27, -0.03, 0.095);
      card.add(chip);
      const chipLines = new THREE.Group();
      for (let n = 0; n < 3; n++) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.012, 0.009),
          new THREE.MeshStandardMaterial({
            color: 0x927342,
            metalness: 0.55,
            roughness: 0.38,
          }),
        );
        line.position.set(-1.27, 0.08 - n * 0.14, 0.126);
        chipLines.add(line);
      }
      card.add(chipLines);
      const contactless = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(
            0.14 + i * 0.085,
            0.012,
            8,
            40,
            Math.PI * 0.72,
          ),
          new THREE.MeshStandardMaterial({
            color: 0xc4e2d0,
            metalness: 0.25,
            roughness: 0.38,
          }),
        );
        arc.rotation.z = -Math.PI * 0.36;
        arc.position.x = i * 0.035;
        contactless.add(arc);
      }
      contactless.position.set(1.25, -0.02, 0.12);
      card.add(contactless);
      scene.add(card);
      objects.push(card);

      const coinStack = new THREE.Group();
      coinStack.position.set(1.55, -0.8, 0.05);
      for (let i = 0; i < 4; i++) {
        const coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.12, 64, 1),
          gold,
        );
        coin.rotation.x = Math.PI / 2;
        coin.position.set(i % 2 ? 0.06 : 0, i * 0.09, i * 0.13);
        coin.castShadow = true;
        coin.receiveShadow = true;
        coinStack.add(coin);
      }
      const rupeeTexture = textTexture("₹", "#f6dfad", 84);
      const rupee = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.48),
        new THREE.MeshBasicMaterial({
          map: rupeeTexture,
          transparent: true,
          toneMapped: false,
        }),
      );
      rupee.position.set(0.04, 0.17, 0.61);
      coinStack.add(rupee);
      scene.add(coinStack);
      objects.push(coinStack);

      const bars = new THREE.Group();
      bars.position.set(-2.12, -0.95, -0.65);
      const barMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x5ab78d,
        metalness: 0.42,
        roughness: 0.28,
        clearcoat: 0.75,
      });
      [0.5, 0.92, 1.3, 1.72].forEach((height, index) => {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, height, 0.2),
          barMaterial,
        );
        bar.position.set(index * 0.32, height / 2, 0);
        bar.castShadow = true;
        bars.add(bar);
      });
      scene.add(bars);
      objects.push(bars);

      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const context = shadowCanvas.getContext("2d");
      const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 62);
      gradient.addColorStop(0, "rgba(1,16,12,.44)");
      gradient.addColorStop(1, "rgba(1,16,12,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(5.7, 2.4),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(shadowCanvas),
          transparent: true,
          depthWrite: false,
        }),
      );
      shadow.position.set(0.05, -1.48, -0.15);
      scene.add(shadow);
      objects.push(shadow);

      const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        camera.aspect = width / height;
        camera.position.z = width < 560 ? 9.5 : 8.4;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();
      const move = (event) => {
        const rect = host.getBoundingClientRect();
        pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      host.addEventListener("pointermove", move, { passive: true });
      timer = new THREE.Timer();
      timer.connect(document);
      const animate = () => {
        timer.update();
        const time = timer.getElapsed();
        card.position.y = 0.24 + Math.sin(time * 0.78) * 0.08;
        card.rotation.y += (-0.28 + pointerX * 0.12 - card.rotation.y) * 0.035;
        card.rotation.x += (-0.2 + pointerY * 0.08 - card.rotation.x) * 0.035;
        coinStack.rotation.y = Math.sin(time * 0.5) * 0.11 + pointerX * 0.045;
        bars.rotation.y = -0.12 + pointerX * 0.035;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();
      host._loanSceneCleanup = () =>
        host.removeEventListener("pointermove", move);
    } catch {
      setFailed(true);
    }
    return () => {
      cancelAnimationFrame(raf);
      timer?.dispose();
      resizeObserver?.disconnect();
      host._loanSceneCleanup?.();
      objects.forEach(disposeObject);
      renderer?.dispose();
      if (renderer?.domElement.parentNode === host)
        host.removeChild(renderer.domElement);
    };
  }, []);
  return (
    <div className="loan-scene" ref={hostRef}>
      {failed && (
        <div className="scene-fallback">
          <WalletCards size={48} />
          <span>Every step, in clear view.</span>
        </div>
      )}
    </div>
  );
}
