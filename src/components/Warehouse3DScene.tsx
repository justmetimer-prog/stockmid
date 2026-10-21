import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Play,
  Pause,
  Camera,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  MapPin,
  Info,
  Maximize2,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';

interface WorkerActor {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Mesh;
  name: string;
  role: string;
  action: string;
  path: THREE.Vector3[];
  currentWayPoint: number;
  speed: number;
  walkCycle: number;
  scannerLaser?: THREE.Line;
  hasScanner?: boolean;
}

interface ForkliftActor {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  forksGroup: THREE.Group;
  mastPiston: THREE.Mesh;
  driverHead: THREE.Mesh;
  currentWayPoint: number;
  speed: number;
  liftCycle: number;
}

interface HandJackActor {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  currentWayPoint: number;
  speed: number;
}

// Procedural Texture Generators
function createIndustrialFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Smooth industrial gray epoxy floor
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle concrete mottling
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Expansion joint grid (slabs of 256x256 px)
  ctx.strokeStyle = '#141822';
  ctx.lineWidth = 3;
  for (let x = 0; x <= 1024; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += 256) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#111827';
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x - 8, 64);
    ctx.lineTo(x - 24, 64);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBoxLabelTexture(title: string, barcodeNum: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Cardboard brown base
  ctx.fillStyle = '#9c6644';
  ctx.fillRect(0, 0, 256, 256);

  // White shipping label sticker
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(20, 30, 216, 130);

  // Label Header
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('STOCKPLUS WMS', 30, 55);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(title.slice(0, 20), 30, 75);

  // Barcode lines
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 28; i++) {
    const x = 30 + i * 7;
    const w = (i % 3 === 0 ? 3 : 2);
    ctx.fillRect(x, 90, w, 40);
  }

  ctx.font = 'bold 11px monospace';
  ctx.fillText(barcodeNum, 30, 145);

  // Fragile stamp (red)
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 180, 80, 30);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('FRAGILE', 42, 200);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const Warehouse3DScene: React.FC = () => {
  const { language, t, products, setSelectedProductForBarcode, setScannedProduct, setIsScannerOpen } = useInventory();
  const mountRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isDockOpen, setIsDockOpen] = useState<boolean>(true);
  const [isDaylight, setIsDaylight] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'RACK' | 'WORKER' | 'FORKLIFT' | 'DOCK';
    title: string;
    description: string;
    zone?: string;
    locationCode?: string;
    items?: Product[];
    role?: string;
    action?: string;
  } | null>(null);

  // Internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(true);
  const speedRef = useRef<number>(1);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.HemisphereLight | null>(null);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 640;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f1523);
    scene.fog = new THREE.FogExp2(0x0f1523, 0.012);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 1000);
    camera.position.set(38, 26, 44);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 6;
    controls.maxDistance = 110;
    controls.target.set(0, 2.5, 0);

    // 5. Studio Environment reflections
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('RoomEnvironment fallback', e);
    }

    // 6. Realistic Lighting Rig
    const ambLight = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.85);
    scene.add(ambLight);
    ambientLightRef.current = ambLight;

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(25, 42, 30);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 140;
      sunLight.shadow.camera.left = -45;
      sunLight.shadow.camera.right = 45;
      sunLight.shadow.camera.top = 45;
      sunLight.shadow.camera.bottom = -45;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);
    dirLightRef.current = sunLight;

    // Overhead High-Bay Warehouse LED lights
    const createHighBayLamp = (x: number, y: number, z: number) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(x, y, z);

      // Hanging cable
      const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, 3);
      const cableMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.position.y = 1.5;
      lampGroup.add(cable);

      // Bell reflector
      const bellGeo = new THREE.ConeGeometry(0.8, 0.6, 16, 1, true);
      const bellMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.rotation.x = Math.PI;
      lampGroup.add(bell);

      // Glowing lens
      const lensGeo = new THREE.CircleGeometry(0.7, 16);
      const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.y = -0.28;
      lampGroup.add(lens);

      // Local spotlight
      const spot = new THREE.SpotLight(0xfffaed, 0.6, 22, Math.PI / 3.2, 0.4, 1);
      spot.position.set(0, -0.3, 0);
      spot.target.position.set(0, -10, 0);
      lampGroup.add(spot);
      lampGroup.add(spot.target);

      scene.add(lampGroup);
    };

    // Install 6 high bay lamps over aisles
    createHighBayLamp(-14, 15, -15);
    createHighBayLamp(-14, 15, 15);
    createHighBayLamp(0, 15, -15);
    createHighBayLamp(0, 15, 15);
    createHighBayLamp(14, 15, -15);
    createHighBayLamp(14, 15, 15);

    // 7. Polished Concrete Industrial Floor
    const floorGeo = new THREE.PlaneGeometry(90, 90);
    const floorTexture = createIndustrialFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.45,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Hazard Stripes & Safety Walkways
    const hazardTex = createHazardStripeTexture();
    hazardTex.repeat.set(16, 1);

    const hazardStripMat = new THREE.MeshBasicMaterial({ map: hazardTex });

    const createSafetyBorder = (x: number, z: number, length: number, rotY: number = 0) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.35), hazardStripMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = rotY;
      mesh.position.set(x, 0.02, z);
      scene.add(mesh);
    };

    // Main central roadway safety lines
    createSafetyBorder(0, -4.5, 65, Math.PI / 2);
    createSafetyBorder(0, 4.5, 65, Math.PI / 2);

    // Zebra pedestrian crossing
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = -3.5; i <= 3.5; i += 1.2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3), zebraMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i, 0.025, 0);
      scene.add(stripe);
    }

    // 8. Warehouse Architecture: Steel Trusses & Industrial Roof
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
    const createTrussBeam = (zPos: number) => {
      const trussGroup = new THREE.Group();
      trussGroup.position.set(0, 16, zPos);

      // Horizontal top beam
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(86, 0.4, 0.4), trussMat);
      trussGroup.add(topBeam);

      // Horizontal lower chord
      const lowBeam = new THREE.Mesh(new THREE.BoxGeometry(86, 0.4, 0.4), trussMat);
      lowBeam.position.y = -2.2;
      trussGroup.add(lowBeam);

      // Diagonal zig-zag web struts
      for (let x = -40; x <= 40; x += 4) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), trussMat);
        strut.position.set(x, -1.1, 0);
        strut.rotation.z = Math.PI / 4.2;
        trussGroup.add(strut);
      }

      // Vertical support columns at perimeter walls
      const colGeo = new THREE.BoxGeometry(0.6, 18, 0.6);
      const colL = new THREE.Mesh(colGeo, trussMat);
      colL.position.set(-42, -7, 0);
      trussGroup.add(colL);

      const colR = new THREE.Mesh(colGeo, trussMat);
      colR.position.set(42, -7, 0);
      trussGroup.add(colR);

      scene.add(trussGroup);
    };

    createTrussBeam(-35);
    createTrussBeam(-12);
    createTrussBeam(12);
    createTrussBeam(35);

    // Industrial Back Wall with Loading Docks
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(86, 18, 1), wallMat);
    backWall.position.set(0, 9, -44);
    scene.add(backWall);

    // Loading Dock Roller Doors (أبواب رول للشحن والتفريغ)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const createLoadingBay = (xPos: number, dockNum: number) => {
      const bayGroup = new THREE.Group();
      bayGroup.position.set(xPos, 0, -43.4);

      // Steel frame
      const frameGeo = new THREE.BoxGeometry(7, 8, 0.4);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.y = 4;
      bayGroup.add(frame);

      // Corrugated door surface
      const doorGeo = new THREE.BoxGeometry(6.2, 7.4, 0.2);
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.y = 3.8;
      bayGroup.add(door);

      // Dock number sign
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 128;
      signCanvas.height = 64;
      const sctx = signCanvas.getContext('2d')!;
      sctx.fillStyle = '#f59e0b';
      sctx.fillRect(0, 0, 128, 64);
      sctx.fillStyle = '#0f172a';
      sctx.font = 'bold 36px monospace';
      sctx.textAlign = 'center';
      sctx.textBaseline = 'middle';
      sctx.fillText(`DOCK ${dockNum}`, 64, 32);

      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: signTex }));
      signMesh.position.set(0, 8.4, 0.25);
      bayGroup.add(signMesh);

      // Hydraulic dock bumper blocks
      const bumperGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
      const bumperMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
      const bL = new THREE.Mesh(bumperGeo, bumperMat);
      bL.position.set(-3.2, 0.6, 0.3);
      bayGroup.add(bL);

      const bR = new THREE.Mesh(bumperGeo, bumperMat);
      bR.position.set(3.2, 0.6, 0.3);
      bayGroup.add(bR);

      bayGroup.userData = {
        type: 'DOCK',
        title: `${language === 'ar' ? 'بوابة الشحن والتفريغ' : 'Quai de Chargement'} #${dockNum}`,
        description: language === 'ar'
          ? 'منطقة مجهزة لاستقبال شاحنات التوريد وصرف الطلبيات الخارجية مع رافعات هيدروليكية.'
          : 'Zone de réception et d\'expédition pour semi-remorques avec niveleur de quai.',
      };

      scene.add(bayGroup);
    };

    createLoadingBay(-20, 1);
    createLoadingBay(0, 2);
    createLoadingBay(20, 3);

    // 9. Realistic Pallet Racks (Orange Beams, Blue Uprights, EURO Pallets, Boxes)
    const rackUprightMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.4 }); // Blue frames
    const rackBeamMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.5, roughness: 0.4 });    // Orange beams
    const palletWoodMat = new THREE.MeshStandardMaterial({ color: 0xa87948, roughness: 0.85 });               // Euro Pallet wood
    const crashPostMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4 });  // Safety yellow crash protector

    const createRealisticRack = (
      zoneCode: 'A' | 'B' | 'C' | 'D',
      aisleNum: string,
      shelfCode: string,
      posX: number,
      posZ: number,
      rotationY: number = 0
    ) => {
      const rackGroup = new THREE.Group();
      rackGroup.position.set(posX, 0, posZ);
      rackGroup.rotation.y = rotationY;

      const rackLength = 11;
      const rackHeight = 8.5;
      const rackDepth = 2.4;

      // Vertical Upright Ladder Frames
      const pillarPositions = [-rackLength / 2, 0, rackLength / 2];
      pillarPositions.forEach((px) => {
        // Front & Rear legs
        [-rackDepth / 2, rackDepth / 2].forEach((pz) => {
          const legGeo = new THREE.BoxGeometry(0.18, rackHeight, 0.18);
          const leg = new THREE.Mesh(legGeo, rackUprightMat);
          leg.position.set(px, rackHeight / 2, pz);
          leg.castShadow = !isSoftwareGl;
          rackGroup.add(leg);
        });

        // Diagonal bracing between front & rear legs
        for (let y = 1; y < rackHeight - 1; y += 1.6) {
          const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, rackDepth * 1.05), rackUprightMat);
          brace.position.set(px, y, 0);
          brace.rotation.x = Math.PI / 4;
          rackGroup.add(brace);
        }
      });

      // Yellow Steel Crash Protector at End of Aisle
      [-rackLength / 2, rackLength / 2].forEach((px) => {
        const crash = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12), crashPostMat);
        crash.position.set(px, 0.6, rackDepth / 2 + 0.3);
        crash.castShadow = !isSoftwareGl;
        rackGroup.add(crash);
      });

      // 4 Heavy-Duty Shelf Beam Levels
      const levels = [1.4, 3.4, 5.4, 7.4];
      levels.forEach((lvlY, lvlIdx) => {
        // Front orange beam
        const bF = new THREE.Mesh(new THREE.BoxGeometry(rackLength, 0.18, 0.12), rackBeamMat);
        bF.position.set(0, lvlY, rackDepth / 2);
        rackGroup.add(bF);

        // Rear orange beam
        const bR = new THREE.Mesh(new THREE.BoxGeometry(rackLength, 0.18, 0.12), rackBeamMat);
        bR.position.set(0, lvlY, -rackDepth / 2);
        rackGroup.add(bR);

        // Pallet Deck grids
        const deck = new THREE.Mesh(new THREE.BoxGeometry(rackLength - 0.2, 0.06, rackDepth - 0.2), floorMat);
        deck.position.set(0, lvlY - 0.04, 0);
        rackGroup.add(deck);

        // Place Euro Pallets & Merchandise on this level
        const palletSlots = [-4, -2.4, -0.8, 0.8, 2.4, 4];
        palletSlots.forEach((slotX, slotIdx) => {
          // Euro Pallet base
          const palletGroup = new THREE.Group();
          palletGroup.position.set(slotX, lvlY + 0.08, 0);

          // Top boards
          const topBoard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 1.3), palletWoodMat);
          palletGroup.add(topBoard);
          // Pallet blocks
          [-0.5, 0, 0.5].forEach((bx) => {
            [-0.5, 0, 0.5].forEach((bz) => {
              const block = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.15), palletWoodMat);
              block.position.set(bx, -0.08, bz);
              palletGroup.add(block);
            });
          });

          rackGroup.add(palletGroup);

          // Merchandise on Pallet
          const itemType = (slotIdx + lvlIdx) % 3;
          if (itemType === 0) {
            // Stack of labelled cardboard boxes
            const boxTex = createBoxLabelTexture(`${zoneCode}-${shelfCode}`, `628100${lvlIdx}${slotIdx}9`);
            const boxMat = new THREE.MeshStandardMaterial({ map: boxTex, roughness: 0.7 });

            for (let bx = -0.3; bx <= 0.3; bx += 0.6) {
              for (let bz = -0.3; bz <= 0.3; bz += 0.6) {
                const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), boxMat);
                box.position.set(slotX + bx, lvlY + 0.38, bz);
                box.castShadow = !isSoftwareGl;
                rackGroup.add(box);
              }
            }
          } else if (itemType === 1) {
            // Industrial Steel Oil / Chemical Drums (Zone C or general)
            const drumMat = new THREE.MeshStandardMaterial({
              color: zoneCode === 'C' ? 0xd97706 : 0x0284c7,
              metalness: 0.75,
              roughness: 0.35,
            });
            [-0.32, 0.32].forEach((dx) => {
              [-0.32, 0.32].forEach((dz) => {
                const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.95, 16), drumMat);
                drum.position.set(slotX + dx, lvlY + 0.6, dz);
                drum.castShadow = !isSoftwareGl;
                rackGroup.add(drum);
              });
            });
          } else {
            // Heavy machinery part crate / wrapped pallet
            const crateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.6 });
            const crate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 1.15), crateMat);
            crate.position.set(slotX, lvlY + 0.6, 0);
            crate.castShadow = !isSoftwareGl;
            rackGroup.add(crate);
          }
        });
      });

      // Bilingual Aisle & Zone Overhead Signboard
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512;
      signCanvas.height = 128;
      const sctx = signCanvas.getContext('2d')!;

      sctx.fillStyle = '#0f172a';
      sctx.fillRect(0, 0, 512, 128);
      sctx.strokeStyle = '#f59e0b';
      sctx.lineWidth = 6;
      sctx.strokeRect(3, 3, 506, 122);

      sctx.fillStyle = '#f59e0b';
      sctx.font = 'bold 44px sans-serif';
      sctx.textAlign = 'center';
      sctx.fillText(`ZONE ${zoneCode} · ${shelfCode}`, 256, 54);

      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 28px sans-serif';
      sctx.fillText(`AISLE ${aisleNum} · ممر ${aisleNum}`, 256, 98);

      const signTex = new THREE.CanvasTexture(signCanvas);
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 0.95),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
      );
      sign.position.set(0, rackHeight + 0.8, 0);
      rackGroup.add(sign);

      // Attach actual real products stored in this zone/shelf
      const matchingProducts = products.filter(
        (p) =>
          p.location.zone.includes(zoneCode) ||
          p.location.shelf === shelfCode ||
          p.location.aisle === aisleNum
      );

      rackGroup.userData = {
        type: 'RACK',
        zone: `Zone ${zoneCode}`,
        locationCode: `${zoneCode}-${shelfCode}`,
        title: `${language === 'ar' ? 'رف التخزين' : 'Rayonnage'} Zone ${zoneCode} (${shelfCode})`,
        description:
          language === 'ar'
            ? `رف فولاذي ثقيل متعدد الطوابق · الممر ${aisleNum} · عدد السلع المسجلة: ${matchingProducts.length}`
            : `Rayonnage lourd 4 niveaux · Allée ${aisleNum} · Articles stockés : ${matchingProducts.length}`,
        items: matchingProducts,
      };

      scene.add(rackGroup);
      return rackGroup;
    };

    // Instantiate complete realistic warehouse rack layout
    // Left Aisle (Zone A & B)
    createRealisticRack('A', '01', 'A-1', -16, -20);
    createRealisticRack('A', '02', 'A-2', -16, -5);
    createRealisticRack('B', '01', 'B-1', -16, 12);
    createRealisticRack('B', '02', 'B-2', -16, 27);

    // Right Aisle (Zone C & D)
    createRealisticRack('C', '01', 'C-1', 16, -20);
    createRealisticRack('C', '02', 'C-2', 16, -5);
    createRealisticRack('D', '01', 'D-1', 16, 12);
    createRealisticRack('D', '02', 'D-2', 16, 27);

    // 10. REAL WAREHOUSE WORKERS (Composite 8-Part Realistic Humans)
    const createRealisticWorker = (
      name: string,
      role: string,
      action: string,
      startPos: THREE.Vector3,
      patrolPath: THREE.Vector3[],
      vestColorHex: number,
      hasBarcodeScanner: boolean = false
    ): WorkerActor => {
      const workerGroup = new THREE.Group();
      workerGroup.position.copy(startPos);

      // Materials
      const bootMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.9 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
      const vestMat = new THREE.MeshStandardMaterial({ color: vestColorHex, roughness: 0.5 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xdca97a, roughness: 0.7 });
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.2 });

      // Torso with Safety Vest
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.36), vestMat);
      torso.position.y = 1.32;
      torso.castShadow = !isSoftwareGl;
      workerGroup.add(torso);

      // 3M Silver reflective cross bands on vest
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
      const stripeH = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.38), stripeMat);
      stripeH.position.y = 1.3;
      workerGroup.add(stripeH);

      // Head & Hard Hat Helmet
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), skinMat);
      head.position.y = 1.9;
      workerGroup.add(head);

      // Helmet with brim visor
      const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.44), helmetMat);
      helmet.position.set(0, 2.06, 0.03);
      workerGroup.add(helmet);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.22, 0.78, 0.24);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.16, 0.52, 0);
      leftLeg.castShadow = !isSoftwareGl;
      workerGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.16, 0.52, 0);
      rightLeg.castShadow = !isSoftwareGl;
      workerGroup.add(rightLeg);

      // Steel-toe Work Boots
      const bootGeo = new THREE.BoxGeometry(0.24, 0.2, 0.34);
      const bL = new THREE.Mesh(bootGeo, bootMat);
      bL.position.set(-0.16, 0.1, 0.05);
      workerGroup.add(bL);

      const bR = new THREE.Mesh(bootGeo, bootMat);
      bR.position.set(0.16, 0.1, 0.05);
      workerGroup.add(bR);

      // Arms
      const armGeo = new THREE.BoxGeometry(0.15, 0.65, 0.16);
      const leftArm = new THREE.Mesh(armGeo, vestMat);
      leftArm.position.set(-0.38, 1.3, 0);
      workerGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, vestMat);
      rightArm.position.set(0.38, 1.3, 0);
      workerGroup.add(rightArm);

      // Barcode Scanner or Clipboard
      let laserLine: THREE.Line | undefined;
      if (hasBarcodeScanner) {
        // Handheld Barcode Scanner Gun (مسدس باركود ليزري)
        const gunGroup = new THREE.Group();
        const gunBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.15, 0.25),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
        );
        gunGroup.add(gunBody);
        gunGroup.position.set(0.38, 1.15, 0.35);
        gunGroup.rotation.x = -Math.PI / 6;
        workerGroup.add(gunGroup);

        // Visible Red Laser Beam scanning shelves
        const laserMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
        const laserGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 4.5),
        ]);
        laserLine = new THREE.Line(laserGeo, laserMat);
        laserLine.position.set(0.38, 1.18, 0.45);
        workerGroup.add(laserLine);
      } else {
        // Inspection Tablet / Checklist
        const tablet = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.38, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
        );
        tablet.position.set(0.3, 1.25, 0.3);
        tablet.rotation.x = -Math.PI / 4;
        workerGroup.add(tablet);
      }

      workerGroup.userData = {
        type: 'WORKER',
        title: `${language === 'ar' ? 'عامل المستودع' : 'Opérateur'} : ${name}`,
        role,
        action,
        description: `${role} · ${action}`,
      };

      scene.add(workerGroup);

      return {
        group: workerGroup,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        head,
        name,
        role,
        action,
        path: patrolPath,
        currentWayPoint: 0,
        speed: 0.04,
        walkCycle: Math.random() * Math.PI * 2,
        scannerLaser: laserLine,
        hasScanner: hasBarcodeScanner,
      };
    };

    // 3 Real Human Workers with Realistic Schedules
    const workers: WorkerActor[] = [
      createRealisticWorker(
        language === 'ar' ? 'سالم الكعبي' : 'Salim Al-Kaabi',
        language === 'ar' ? 'فاحص جرد بالباركود' : 'Contrôleur Inventaire Barcode',
        language === 'ar' ? 'يمسح باركود شحنات المحركات الكهربائية بممر Zone A' : 'Scanne les codes-barres des racks Zone A',
        new THREE.Vector3(-8, 0, -18),
        [
          new THREE.Vector3(-8, 0, -22),
          new THREE.Vector3(-8, 0, -4),
          new THREE.Vector3(-14, 0, -4),
          new THREE.Vector3(-14, 0, -22),
        ],
        0xf97316, // Fluorescent Orange
        true      // Has active laser scanner
      ),
      createRealisticWorker(
        language === 'ar' ? 'خالد المنصور' : 'Khaled Mansour',
        language === 'ar' ? 'محضر طلبيات وشحن' : 'Préparateur de Commandes',
        language === 'ar' ? 'يجهز وصل إخراج طلبيات مصنع الأمل' : 'Prépare le bon d\'expédition Atelier',
        new THREE.Vector3(8, 0, 10),
        [
          new THREE.Vector3(8, 0, 8),
          new THREE.Vector3(8, 0, 26),
          new THREE.Vector3(14, 0, 26),
          new THREE.Vector3(14, 0, 8),
        ],
        0x10b981, // Neon Green
        false
      ),
      createRealisticWorker(
        language === 'ar' ? 'ياسين بوزيد' : 'Yassine Bouzid',
        language === 'ar' ? 'مشرف السلامة والتحميل' : 'Superviseur de Quai',
        language === 'ar' ? 'يتفقد بوابات الشحن والتفريغ والتأكد من التخزين الآمن' : 'Inspecte les quais de chargement et l\'arrimage',
        new THREE.Vector3(0, 0, -32),
        [
          new THREE.Vector3(-18, 0, -36),
          new THREE.Vector3(18, 0, -36),
          new THREE.Vector3(18, 0, -28),
          new THREE.Vector3(-18, 0, -28),
        ],
        0x0284c7, // Industrial Blue
        false
      ),
    ];

    // 11. REAL INDUSTRIAL FORKLIFT TRUCK WITH DRIVER (Heavy Electric Reach Truck)
    const createRealisticForklift = (): ForkliftActor => {
      const forkGroup = new THREE.Group();
      forkGroup.position.set(0, 0, 24);

      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.5 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });

      // Chassis Counterweight Body
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 3.4), yellowMat);
      chassis.position.y = 1.1;
      chassis.castShadow = !isSoftwareGl;
      forkGroup.add(chassis);

      // Rear hazard warning chevron plate
      const rearBumper = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.4), hazardStripMat);
      rearBumper.position.set(0, 0.9, 1.72);
      rearBumper.rotation.y = Math.PI;
      forkGroup.add(rearBumper);

      // Cabin Roll Cage Frame
      const cagePostGeo = new THREE.BoxGeometry(0.12, 1.8, 0.12);
      [
        [-0.9, -0.8],
        [-0.9, 0.8],
        [0.9, -0.8],
        [0.9, 0.8],
      ].forEach(([cx, cz]) => {
        const post = new THREE.Mesh(cagePostGeo, darkMat);
        post.position.set(cx, 2.4, cz);
        forkGroup.add(post);
      });

      // Protective Overhead Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.8), darkMat);
      roof.position.set(0, 3.3, 0);
      forkGroup.add(roof);

      // Driver Human Character in Cabin
      const driverGroup = new THREE.Group();
      driverGroup.position.set(0, 1.8, -0.1);

      const driverTorso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      driverGroup.add(driverTorso);

      const driverHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), new THREE.MeshStandardMaterial({ color: 0xdca97a }));
      driverHead.position.y = 0.45;
      driverGroup.add(driverHead);

      const driverHat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.36), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      driverHat.position.set(0, 0.58, 0.02);
      driverGroup.add(driverHat);

      forkGroup.add(driverGroup);

      // Two-Stage Hydraulic Lifting Mast
      const mastGeo = new THREE.BoxGeometry(0.16, 4.2, 0.16);
      const mastL = new THREE.Mesh(mastGeo, steelMat);
      mastL.position.set(-0.7, 2.5, -1.9);
      forkGroup.add(mastL);

      const mastR = new THREE.Mesh(mastGeo, steelMat);
      mastR.position.set(0.7, 2.5, -1.9);
      forkGroup.add(mastR);

      // Moving Fork Carriage & Prongs
      const forksGroup = new THREE.Group();
      forksGroup.position.set(0, 0.4, -2.0);

      // Carriage cross plate
      const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.1), steelMat);
      forksGroup.add(carriage);

      // Solid steel fork tines
      const prongGeo = new THREE.BoxGeometry(0.14, 0.08, 1.8);
      const pL = new THREE.Mesh(prongGeo, steelMat);
      pL.position.set(-0.45, -0.35, -0.9);
      forksGroup.add(pL);

      const pR = new THREE.Mesh(prongGeo, steelMat);
      pR.position.set(0.45, -0.35, -0.9);
      forksGroup.add(pR);

      // Pallet loaded on the forks
      const palletOnForks = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.3), palletWoodMat);
      palletOnForks.position.set(0, -0.22, -0.9);
      forksGroup.add(palletOnForks);

      // Cargo on pallet (Large electrical motor box)
      const cargoTex = createBoxLabelTexture('MOT-3PH-INDUSTRIAL', '6281002938101');
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1.1), new THREE.MeshStandardMaterial({ map: cargoTex, roughness: 0.6 }));
      cargo.position.set(0, 0.35, -0.9);
      cargo.castShadow = !isSoftwareGl;
      forksGroup.add(cargo);

      forkGroup.add(forksGroup);

      // Hydraulic center cylinder piston
      const pistonGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8);
      const mastPiston = new THREE.Mesh(pistonGeo, steelMat);
      mastPiston.position.set(0, 2.4, -1.9);
      forkGroup.add(mastPiston);

      // 4 Heavy-duty wheels
      const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 18);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheels: THREE.Mesh[] = [];

      [
        [-1.15, 0.48, -1.1],
        [1.15, 0.48, -1.1],
        [-1.15, 0.48, 1.1],
        [1.15, 0.48, 1.1],
      ].forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, darkMat);
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = !isSoftwareGl;
        forkGroup.add(wheel);
        wheels.push(wheel);
      });

      // Front Headlights
      const headL = new THREE.PointLight(0xfff3db, 0.8, 10);
      headL.position.set(-0.7, 2.0, -1.8);
      forkGroup.add(headL);

      const headR = new THREE.PointLight(0xfff3db, 0.8, 10);
      headR.position.set(0.7, 2.0, -1.8);
      forkGroup.add(headR);

      forkGroup.userData = {
        type: 'FORKLIFT',
        title: language === 'ar' ? 'رافعة شوكية صناعية (Linde E25)' : 'Chariot Élévateur Frontal Electrique',
        role: language === 'ar' ? 'نقل ومناولة المنصات الثقيلة' : 'Transfert palettes lourdes',
        description:
          language === 'ar'
            ? 'قدرة رفع تصل إلى 2.5 طن حتى ارتفاع 8 أمتار، تعمل بالبطارية الكهربائية داخل الممر الرئيسي.'
            : 'Capacité de 2,5 tonnes jusqu\'à 8 mètres de levée. Circulation allée centrale.',
      };

      scene.add(forkGroup);

      return {
        group: forkGroup,
        wheels,
        forksGroup,
        mastPiston,
        driverHead,
        currentWayPoint: 0,
        speed: 0.055,
        liftCycle: 0,
      };
    };

    const forklift = createRealisticForklift();
    const forkliftPath = [
      new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(0, 0, -28),
      new THREE.Vector3(0, 0, 30),
    ];

    // 12. RAYCASTING INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && !curr.userData?.type) {
          curr = curr.parent;
        }

        if (curr && curr.userData?.type) {
          setSelectedEntity({
            type: curr.userData.type,
            title: curr.userData.title || 'عنصر في المستودع',
            description: curr.userData.description || '',
            zone: curr.userData.zone,
            locationCode: curr.userData.locationCode,
            items: curr.userData.items,
            role: curr.userData.role,
            action: curr.userData.action,
          });
        }
      }
    };

    renderer.domElement.addEventListener('click', handlePointerClick);

    // 13. ANIMATION LOOP
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPlayingRef.current) {
        const simSpeed = speedRef.current;

        // Workers realistic kinematics
        workers.forEach((w) => {
          const targetWp = w.path[w.currentWayPoint];
          const dist = w.group.position.distanceTo(targetWp);

          if (dist < 0.35) {
            w.currentWayPoint = (w.currentWayPoint + 1) % w.path.length;
          } else {
            const dir = targetWp.clone().sub(w.group.position).normalize();
            w.group.position.addScaledVector(dir, w.speed * simSpeed);

            // Smooth rotation
            const targetAngle = Math.atan2(dir.x, dir.z);
            w.group.rotation.y = THREE.MathUtils.lerp(w.group.rotation.y, targetAngle, 0.1);

            // Leg & arm walking cycle
            w.walkCycle += 9 * dt * simSpeed;
            const swing = Math.sin(w.walkCycle) * 0.45;
            w.leftLeg.rotation.x = swing;
            w.rightLeg.rotation.x = -swing;
            w.leftArm.rotation.x = -swing;
            if (!w.hasScanner) {
              w.rightArm.rotation.x = swing * 0.5;
            }

            // Head subtle movement
            w.head.rotation.y = Math.sin(w.walkCycle * 0.5) * 0.15;

            // Animate scanning laser pulse if equipped
            if (w.scannerLaser) {
              const laserPulse = (Math.sin(w.walkCycle * 2) + 1) * 0.5;
              (w.scannerLaser.material as THREE.LineBasicMaterial).opacity = 0.4 + laserPulse * 0.6;
            }
          }
        });

        // Forklift driving & smooth hydraulic pallet lifting
        const fTarget = forkliftPath[forklift.currentWayPoint];
        const fDist = forklift.group.position.distanceTo(fTarget);

        if (fDist < 0.6) {
          forklift.currentWayPoint = (forklift.currentWayPoint + 1) % forkliftPath.length;
        } else {
          const fDir = fTarget.clone().sub(forklift.group.position).normalize();
          forklift.group.position.addScaledVector(fDir, forklift.speed * simSpeed);
          const fAngle = Math.atan2(fDir.x, fDir.z);
          forklift.group.rotation.y = THREE.MathUtils.lerp(forklift.group.rotation.y, fAngle, 0.08);

          // Rotate wheels
          forklift.wheels.forEach((wh: THREE.Mesh) => {
            wh.rotation.x += 4.5 * dt * simSpeed;
          });

          // Gentle hydraulic lifting oscillation
          forklift.liftCycle += dt * 0.8 * simSpeed;
          const liftHeight = 0.4 + (Math.sin(forklift.liftCycle) + 1) * 0.8;
          forklift.forksGroup.position.y = liftHeight;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handlePointerClick);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [language, products]);

  // Lighting Mode (Daylight vs Night Shift)
  const toggleDaylight = () => {
    setIsDaylight((prev) => {
      const next = !prev;
      if (dirLightRef.current && ambientLightRef.current && sceneRef.current) {
        if (next) {
          dirLightRef.current.intensity = 1.4;
          dirLightRef.current.color.setHex(0xfff5e6);
          ambientLightRef.current.intensity = 0.85;
          sceneRef.current.background = new THREE.Color(0x0f1523);
          if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0x0f1523);
        } else {
          // Warm industrial night shift mode
          dirLightRef.current.intensity = 0.35;
          dirLightRef.current.color.setHex(0x38bdf8);
          ambientLightRef.current.intensity = 0.45;
          sceneRef.current.background = new THREE.Color(0x070b12);
          if (sceneRef.current.fog) sceneRef.current.fog.color.setHex(0x070b12);
        }
      }
      return next;
    });
  };

  // Camera presets
  const setCameraPreset = (preset: 'overhead' | 'worker' | 'aisle' | 'firstperson') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (preset === 'overhead') {
      camera.position.set(0, 52, 45);
      controls.target.set(0, 0, 0);
    } else if (preset === 'worker') {
      camera.position.set(-6, 3.2, -14);
      controls.target.set(-16, 2.5, -20);
    } else if (preset === 'aisle') {
      camera.position.set(0, 4.5, 36);
      controls.target.set(0, 3, -15);
    } else if (preset === 'firstperson') {
      camera.position.set(0, 2.0, 5);
      controls.target.set(0, 2.0, -35);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-[660px] rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Info Badges (Clean, Zero Distraction) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs text-slate-200 backdrop-blur-md flex items-center gap-2.5 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="font-bold">{language === 'ar' ? 'المستودع الفعلي المباشر (Real WMS 3D)' : 'Entrepôt Réel 3D Live'}</span>
          <span className="text-slate-500">·</span>
          <span className="text-amber-400 font-mono text-[11px]">3 عمال · 1 رافعة · 4 مناطق</span>
        </div>
      </div>

      {/* Daylight / Shift Lighting Toggle */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={toggleDaylight}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-300 hover:text-amber-400 backdrop-blur-md shadow-lg transition-colors text-xs flex items-center gap-1.5"
          title={isDaylight ? 'تبديل إلى وردية العمل الليلية' : 'تبديل إلى إضاءة النهار'}
        >
          {isDaylight ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          <span className="hidden sm:inline">{isDaylight ? (language === 'ar' ? 'نهاري' : 'Jour') : (language === 'ar' ? 'ليلي' : 'Nuit')}</span>
        </button>
      </div>

      {/* Detailed Entity Inspector Modal on Click */}
      {selectedEntity && (
        <div className="absolute top-16 right-4 z-20 max-w-sm w-full p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 text-right rtl:text-right ltr:text-left backdrop-blur-md shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Info className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">{selectedEntity.title}</h4>
                {selectedEntity.locationCode && (
                  <span className="text-[10px] text-amber-400 font-mono">[{selectedEntity.locationCode}]</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{selectedEntity.description}</p>

          {/* If Rack was clicked: Show products list currently stored there */}
          {selectedEntity.type === 'RACK' && selectedEntity.items && selectedEntity.items.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 block">
                {language === 'ar' ? 'السلع المخزنة في هذا الرف:' : 'Articles stockés dans ce rayon :'}
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {selectedEntity.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block truncate max-w-[170px]">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.barcode}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              onClick={() => setSelectedEntity(null)}
              className="px-3 py-1.5 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
            >
              {language === 'ar' ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      )}

      {/* Interaction Hint */}
      <div className="absolute bottom-24 right-4 z-10 pointer-events-none hidden sm:block">
        <span className="text-[11px] text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-md shadow-sm">
          💡 {language === 'ar' ? 'انقر على أي رف، رافعة أو عامل للاطلاع على المهام المباشرة' : 'Cliquez sur un rack, chariot ou opérateur pour inspecter'}
        </span>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-3xl transition-transform duration-300 ${
          isDockOpen ? 'translate-y-0' : 'translate-y-[calc(100%-28px)]'
        }`}
      >
        {/* Collapse Handle */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsDockOpen(!isDockOpen)}
            className="px-4 py-1 rounded-t-lg bg-slate-900/95 border-t border-x border-slate-700/70 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md"
          >
            {isDockOpen ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إخفاء لوحة التحكم' : 'Masquer les contrôles'}</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'لوحة التحكم والكاميرا' : 'Contrôles Caméra'}</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Body */}
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md">
          {/* Play / Pause & Speed */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-slate-800 text-amber-400 border border-amber-500/30'
              }`}
              title={isPlaying ? t.pauseSim : t.playSim}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? t.pauseSim : t.playSim}</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    speedMultiplier === spd ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Camera View Angle Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCameraPreset('overhead')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-[11px] font-medium"
            >
              {t.overheadView}
            </button>

            <button
              onClick={() => setCameraPreset('aisle')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-[11px] font-medium"
            >
              {t.aisleView}
            </button>

            <button
              onClick={() => setCameraPreset('firstperson')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-[11px] font-medium"
            >
              {language === 'ar' ? 'منظور الممر الواقعي' : 'Vue Allée Réelle'}
            </button>

            <button
              onClick={() => setCameraPreset('worker')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-[11px] font-medium"
            >
              {t.workerView}
            </button>
          </div>

          {/* Live Actors Counter */}
          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Users className="w-3.5 h-3.5" />
              <span>3 {language === 'ar' ? 'عمال ميدانيون' : 'opérateurs'}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Compass className="w-3.5 h-3.5" />
              <span>1 {language === 'ar' ? 'رافعة شوكية' : 'chariot'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
