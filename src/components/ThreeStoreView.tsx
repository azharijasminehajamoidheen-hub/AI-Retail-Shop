import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProductItem, ShelfZone, CheckoutCounter } from '../types';
import { 
  Flame, 
  Eye, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RotateCcw, 
  Compass,
  ArrowRight,
  LogOut,
  LogIn,
  Package,
  ShoppingCart,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface ThreeStoreViewProps {
  products: ProductItem[];
  shelfZones: ShelfZone[];
  counters: CheckoutCounter[];
  onSelectProduct?: (product: ProductItem) => void;
  onOpenCounter2?: () => void;
  onReplenishProduct?: (productId: string) => void;
}

export type CameraViewMode = '3D' | 'TOP' | 'FRONT' | 'SIDE' | 'COUNTERS' | 'WAREHOUSE';

export const ThreeStoreView: React.FC<ThreeStoreViewProps> = ({
  products,
  shelfZones,
  counters,
  onSelectProduct,
  onOpenCounter2,
  onReplenishProduct,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'SHELF' | 'COUNTER' | 'ENTRY' | 'EXIT' | 'WAREHOUSE';
    data: any;
  } | null>(null);

  const [activeShelfTabId, setActiveShelfTabId] = useState<string>(shelfZones[0]?.id || 'shelf-aisle-1-beverages');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<CameraViewMode>('3D');
  const [shelfCategoryFilter, setShelfCategoryFilter] = useState<string>('ALL');

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 24, 26));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const heatmapMeshRef = useRef<THREE.Mesh | null>(null);

  // Mouse orbit drag state
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitAngles = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.5,
    radius: 35,
  });

  // Animated shoppers
  const shoppersRef = useRef<
    {
      mesh: THREE.Group;
      x: number;
      z: number;
      targetX: number;
      targetZ: number;
      speed: number;
      stage: number;
      dwellTime: number;
    }[]
  >([]);

  // Helper to create text sprite for clear labels in 3D
  const createTextSprite = (text: string, bgColor = '#1e293b', textColor = '#ffffff', fontSize = 48) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    // Background pill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 108, 20);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(3.5, 0.88, 1);
    return sprite;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 540;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc'); // Crisp slate-50 canvas
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 24, 26);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.65);
    sunLight.position.set(20, 35, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -22;
    sunLight.shadow.camera.right = 22;
    sunLight.shadow.camera.top = 22;
    sunLight.shadow.camera.bottom = -22;
    scene.add(sunLight);

    const softFillLight = new THREE.DirectionalLight(0x93c5fd, 0.3);
    softFillLight.position.set(-20, 20, -20);
    scene.add(softFillLight);

    // 5. Store Floor (36m x 26m)
    const floorGeo = new THREE.PlaneGeometry(38, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle tile grid lines
    const grid = new THREE.GridHelper(38, 38, 0xe2e8f0, 0xf1f5f9);
    grid.position.y = 0.01;
    scene.add(grid);

    // 6. Perimeter Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    // Back wall (Z = -14)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(38, 4.5, 0.5), wallMat);
    backWall.position.set(0, 2.25, -14);
    scene.add(backWall);

    // Left wall (X = -19)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 28), wallMat);
    leftWall.position.set(-19, 2.25, 0);
    scene.add(leftWall);

    // Right wall (X = 19)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 28), wallMat);
    rightWall.position.set(19, 2.25, 0);
    scene.add(rightWall);

    // Backroom / Warehouse Partition (North-West corner)
    const warehouseZone = new THREE.Group();
    warehouseZone.userData = { 
      type: 'WAREHOUSE', 
      data: { name: 'Supermarket Central Backroom Reserve', totalSkus: 24, totalStock: 580, replenishQueue: 3 } 
    };
    const warehouseWall = new THREE.Mesh(new THREE.BoxGeometry(11, 3.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    warehouseWall.position.set(-13, 1.75, -9);
    warehouseZone.add(warehouseWall);

    // Warehouse sign
    const warehouseSign = createTextSprite('📦 BACKROOM RESERVE / WAREHOUSE', '#334155', '#38bdf8', 36);
    warehouseSign.position.set(-13, 3.8, -8.8);
    warehouseZone.add(warehouseSign);

    // Warehouse pallet racks & storage boxes
    for (let p = 0; p < 3; p++) {
      const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.4), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
      pallet.position.set(-16.5 + p * 2.6, 0.15, -11.5);
      warehouseZone.add(pallet);

      for (let bx = 0; bx < 4; bx++) {
        const stackBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.6), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
        stackBox.position.set(-17.2 + p * 2.6 + (bx % 2) * 0.9, 0.7 + Math.floor(bx / 2) * 0.75, -11.5);
        stackBox.castShadow = true;
        warehouseZone.add(stackBox);
      }
    }
    scene.add(warehouseZone);

    // 7. STORE ENTRY (Front-Right: X = 13, Z = 11)
    const entryGroup = new THREE.Group();
    entryGroup.userData = { type: 'ENTRY', data: { name: 'Main Store Entrance', status: 'OPEN', sensor: 'Optical Photocell Active' } };

    // Sliding Glass Doors
    const entryFrameMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.5 });
    const entryLeftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 0.1), glassMat);
    entryLeftDoor.position.set(11.8, 1.5, 12);
    const entryRightDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3, 0.1), glassMat);
    entryRightDoor.position.set(14.2, 1.5, 12);
    const entryPortal = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 0.6), entryFrameMat);
    entryPortal.position.set(13, 3.2, 12);
    entryGroup.add(entryLeftDoor);
    entryGroup.add(entryRightDoor);
    entryGroup.add(entryPortal);

    // Turnstiles (Green indicator)
    const turnstileBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.1), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    turnstileBase.position.set(13, 0.55, 10.5);
    const turnstileArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    turnstileArm.position.set(13, 0.9, 10.5);
    turnstileArm.rotation.y = Math.PI / 4;
    entryGroup.add(turnstileBase);
    entryGroup.add(turnstileArm);

    // Shopping Trolley Corral
    for (let c = 0; c < 4; c++) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.1), new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: false }));
      cart.position.set(16.5, 0.45, 9.5 - c * 1.2);
      entryGroup.add(cart);
    }

    // Floor Decal (Green ENTRY)
    const entryDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.8),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.9 })
    );
    entryDecal.rotation.x = -Math.PI / 2;
    entryDecal.position.set(13, 0.02, 11);
    entryGroup.add(entryDecal);

    // Overhead 3D Sign
    const entrySign = createTextSprite('🟢 STORE ENTRY (IN) • PLEASE TAKE TROLLEY', '#065f46', '#ffffff', 38);
    entrySign.position.set(13, 4.2, 12);
    entryGroup.add(entrySign);
    scene.add(entryGroup);

    // 8. STORE EXIT (Front-Left: X = -13, Z = 11)
    const exitGroup = new THREE.Group();
    exitGroup.userData = { type: 'EXIT', data: { name: 'Main Store Exit', status: 'OPEN', security: 'EAS Anti-Theft Gates Active' } };

    // EAS Anti-Theft Security Pedestals (Dual Gates)
    const easMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const easGate1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.8), easMat);
    easGate1.position.set(-11.5, 0.9, 11.5);
    const easGate2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.8), easMat);
    easGate2.position.set(-14.5, 0.9, 11.5);
    exitGroup.add(easGate1);
    exitGroup.add(easGate2);

    // Security check podium
    const securityDesk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    securityDesk.position.set(-16.2, 0.55, 10.5);
    exitGroup.add(securityDesk);

    // Floor Decal (Red EXIT)
    const exitDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.8),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9 })
    );
    exitDecal.rotation.x = -Math.PI / 2;
    exitDecal.position.set(-13, 0.02, 11);
    exitGroup.add(exitDecal);

    // Overhead 3D Sign
    const exitSign = createTextSprite('🔴 STORE EXIT (OUT) • RECEIPT VERIFICATION', '#991b1b', '#ffffff', 38);
    exitSign.position.set(-13, 4.2, 12);
    exitGroup.add(exitSign);
    scene.add(exitGroup);

    // 9. CHECKOUT COUNTERS: Counter 1, Counter 2, Counter 3
    const countersGroup = new THREE.Group();
    const counterPositions = [
      { id: 1, x: -6, name: 'Counter 1 (Express Checkout)', isExpress: true },
      { id: 2, x: 0, name: 'Counter 2 (Standard Checkout)', isExpress: false },
      { id: 3, x: 6, name: 'Counter 3 (Self-Checkout Station)', isExpress: false, isSelfCheckout: true },
    ];

    counters.forEach((cnt) => {
      const posConfig = counterPositions.find((p) => p.id === cnt.id) || { x: (cnt.id - 2) * 6, isExpress: false, isSelfCheckout: false };
      const cntGroup = new THREE.Group();
      cntGroup.userData = { type: 'COUNTER', data: cnt };

      // Table & Conveyor Desk
      const deskColor = cnt.isOpen 
        ? (cnt.congestionStatus === 'CONGESTED' ? 0xffedd5 : 0xf1f5f9) 
        : 0xe2e8f0;
      const deskMat = new THREE.MeshStandardMaterial({ color: deskColor, roughness: 0.3 });
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 3.8), deskMat);
      desk.position.set(0, 0.525, 0);
      desk.castShadow = true;
      desk.receiveShadow = true;
      cntGroup.add(desk);

      // Black rubber Conveyor Belt or Scan Bed
      const beltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const belt = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 2.6), beltMat);
      belt.position.set(-0.3, 1.075, 0.2);
      cntGroup.add(belt);

      // POS Screen / Touch Terminal
      const monitorMat = new THREE.MeshStandardMaterial({ color: cnt.isOpen ? 0x2563eb : 0x64748b });
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.1), monitorMat);
      monitor.position.set(0.6, 1.35, -1.0);
      monitor.rotation.y = -Math.PI / 8;
      cntGroup.add(monitor);

      // Stanchion Queue Belts / Barrier Posts
      const stanchionMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const stanchion1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0), stanchionMat);
      stanchion1.position.set(-1.4, 0.5, 2.0);
      const stanchion2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0), stanchionMat);
      stanchion2.position.set(1.4, 0.5, 2.0);
      cntGroup.add(stanchion1);
      cntGroup.add(stanchion2);

      // Cashier Avatar (if open and not pure self-checkout)
      if (cnt.isOpen) {
        const cashier = new THREE.Group();
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfcd34d }));
        head.position.y = 1.65;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.8), new THREE.MeshStandardMaterial({ color: cnt.id === 1 ? 0x2563eb : 0x059669 }));
        body.position.y = 1.05;
        cashier.add(head);
        cashier.add(body);
        cashier.position.set(0.8, 0, -0.4);
        cntGroup.add(cashier);
      }

      // Overhead Counter Sign (e.g. "COUNTER 1 - EXPRESS [OPEN]")
      const statusText = cnt.isOpen 
        ? `${cnt.id === 1 ? 'COUNTER 1 (EXPRESS)' : cnt.id === 2 ? 'COUNTER 2 (STANDARD)' : 'COUNTER 3 (SELF-CHECKOUT)'} • QUEUE: ${cnt.currentQueue}`
        : `${cnt.name.toUpperCase()} • CLOSED`;
      const signColor = cnt.isOpen ? (cnt.congestionStatus === 'CONGESTED' ? '#dc2626' : '#1d4ed8') : '#64748b';
      const counterSign = createTextSprite(statusText, signColor, '#ffffff', 32);
      counterSign.position.set(0, 3.4, 0);
      cntGroup.add(counterSign);

      cntGroup.position.set(posConfig.x, 0, 7.5);
      countersGroup.add(cntGroup);
    });
    scene.add(countersGroup);

    // 10. SHELF BAYS & DISTINCT PRODUCTS (Aisles 1, 2, 3, 4)
    const shelvesGroup = new THREE.Group();

    shelfZones.forEach((zone) => {
      const shelfGroup = new THREE.Group();
      shelfGroup.userData = { type: 'SHELF', data: zone };

      // Base Structure / Rack Uprights
      const isCritical = zone.overallAvailabilityPct < 30;
      const isAttention = zone.overallAvailabilityPct < 60;
      const frameColor = 0x334155; // Dark slate steel frame
      const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.3 });

      // Left & Right Upright Pillars
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 0.12), frameMat);
      p1.position.set(-zone.width / 2, 1.5, -zone.depth / 2);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 0.12), frameMat);
      p2.position.set(zone.width / 2, 1.5, -zone.depth / 2);
      const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 0.12), frameMat);
      p3.position.set(-zone.width / 2, 1.5, zone.depth / 2);
      const p4 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.0, 0.12), frameMat);
      p4.position.set(zone.width / 2, 1.5, zone.depth / 2);
      shelfGroup.add(p1, p2, p3, p4);

      // Back panel mesh
      const backPanelMat = new THREE.MeshStandardMaterial({
        color: isCritical ? 0xfecaca : isAttention ? 0xfef08a : 0xf1f5f9,
        roughness: 0.4,
      });
      const backPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.8, zone.depth), backPanelMat);
      backPanel.position.set(0, 1.4, 0);
      shelfGroup.add(backPanel);

      // 3 Shelf Tier Decks
      const tierCount = 3;
      for (let t = 0; t < tierCount; t++) {
        const tierY = 0.65 + t * 0.85;
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(zone.width, 0.08, zone.depth),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.2 })
        );
        deck.position.set(0, tierY, 0);
        deck.castShadow = true;
        deck.receiveShadow = true;
        shelfGroup.add(deck);

        // LED Edge Strip (Status color: Green, Amber, Red)
        const ledMat = new THREE.MeshBasicMaterial({
          color: isCritical ? 0xef4444 : isAttention ? 0xf59e0b : 0x10b981,
        });
        const ledStripLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, zone.depth), ledMat);
        ledStripLeft.position.set(-zone.width / 2 - 0.02, tierY, 0);
        const ledStripRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, zone.depth), ledMat);
        ledStripRight.position.set(zone.width / 2 + 0.02, tierY, 0);
        shelfGroup.add(ledStripLeft, ledStripRight);

        // Populate Category-Specific 3D Product Geometries
        const zoneProducts = products.filter((p) => p.shelfId === zone.id);
        const densityFactor = isCritical ? 2 : isAttention ? 5 : 8;

        for (let itemIdx = 0; itemIdx < densityFactor; itemIdx++) {
          const zOffset = -1.6 + (itemIdx / (densityFactor || 1)) * 3.2;
          const leftProductMesh = createCategory3DItem(zone.category, itemIdx, isCritical);
          leftProductMesh.position.set(-0.5, tierY + 0.22, zOffset);
          shelfGroup.add(leftProductMesh);

          const rightProductMesh = createCategory3DItem(zone.category, itemIdx + 1, isCritical);
          rightProductMesh.position.set(0.5, tierY + 0.22, zOffset);
          shelfGroup.add(rightProductMesh);
        }
      }

      // Overhead 3D Category Signboard
      const signLabel = `${zone.name.toUpperCase()} [${zone.overallAvailabilityPct}%]`;
      const signBg = isCritical ? '#dc2626' : isAttention ? '#d97706' : '#1e293b';
      const shelfSign = createTextSprite(signLabel, signBg, '#ffffff', 30);
      shelfSign.position.set(0, 3.5, 0);
      shelfGroup.add(shelfSign);

      shelfGroup.position.set(zone.x, 0, zone.z);
      shelvesGroup.add(shelfGroup);
    });
    scene.add(shelvesGroup);

    // Helper: Build visually distinctive 3D product items
    function createCategory3DItem(category: string, index: number, critical: boolean): THREE.Group {
      const itemGroup = new THREE.Group();

      if (category === 'Beverages') {
        // Beverage cans & bottles
        const canMat = new THREE.MeshStandardMaterial({
          color: index % 3 === 0 ? 0xef4444 : index % 3 === 1 ? 0x0284c7 : 0x10b981,
          metalness: 0.6,
          roughness: 0.2,
        });
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 12), canMat);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0xd4d4d8 }));
        cap.position.y = 0.2;
        itemGroup.add(can, cap);
      } else if (category === 'Dairy') {
        // Milk Cartons & Yogurt Tubs
        const cartonMat = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0x38bdf8 : 0xffffff });
        const carton = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.24), cartonMat);
        itemGroup.add(carton);
      } else if (category === 'Snacks') {
        // Snack chip bags & chocolate bars
        const bagMat = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0xf59e0b : 0x7c3aed, roughness: 0.3 });
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.18), bagMat);
        bag.rotation.z = (Math.random() - 0.5) * 0.2;
        itemGroup.add(bag);
      } else if (category === 'Grains') {
        // Cereal boxes & rice packs
        const cerealMat = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0xca8a04 : 0x0284c7 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.16), cerealMat);
        itemGroup.add(box);
      } else if (category === 'Bakery') {
        // Sourdough bread loaf & croissants (Warm golden-brown)
        const loafMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
        const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), loafMat);
        loaf.scale.set(1.4, 0.9, 1.1);
        itemGroup.add(loaf);
      } else if (category === 'Household') {
        // Detergent jugs & spray bottles
        const bottleMat = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0x06b6d4 : 0x8b5cf6 });
        const jug = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.4, 0.2), bottleMat);
        const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.14), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        nozzle.position.set(0, 0.24, 0.05);
        itemGroup.add(jug, nozzle);
      } else if (category === 'Produce') {
        // Fresh Apples & Organic fruits
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
        const fruitMat = new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0xdc2626 : 0xeab308 });
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), fruitMat);
        fruit.position.y = 0.12;
        itemGroup.add(crate, fruit);
      } else {
        // Pantry / Condiments Jars
        const jarMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.1 });
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 10), jarMat);
        itemGroup.add(jar);
      }

      return itemGroup;
    }

    // 11. MULTI-ZONE HEATMAP FLOOR OVERLAY
    const heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = 512;
    heatmapCanvas.height = 512;
    const ctx = heatmapCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(0, 0, 512, 512);

      const drawHeatSpot = (cx: number, cy: number, radius: number, alpha = 0.5) => {
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
        grad.addColorStop(0, `rgba(239, 68, 68, ${alpha})`); // Hot red center
        grad.addColorStop(0.4, `rgba(245, 158, 11, ${alpha * 0.7})`); // Amber
        grad.addColorStop(0.7, `rgba(16, 185, 129, ${alpha * 0.3})`); // Emerald
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
      };

      // Hot spots: Aisle 1 Cold Drinks surge, Aisle 2 Snacks, Counter 1 queue line, Entry gate
      drawHeatSpot(140, 160, 110, 0.65); // Aisle 1 Cold Drinks
      drawHeatSpot(210, 170, 90, 0.5);  // Aisle 2 Snacks
      drawHeatSpot(170, 360, 120, 0.7); // Counter 1 Congestion
      drawHeatSpot(390, 420, 80, 0.45); // Entry flow
      drawHeatSpot(370, 170, 85, 0.4);  // Produce Aisle 4
    }
    const heatmapTex = new THREE.CanvasTexture(heatmapCanvas);
    const heatmapMat = new THREE.MeshBasicMaterial({
      map: heatmapTex,
      transparent: true,
      opacity: 0.85,
    });
    const heatmapMesh = new THREE.Mesh(new THREE.PlaneGeometry(37.5, 27.5), heatmapMat);
    heatmapMesh.rotation.x = -Math.PI / 2;
    heatmapMesh.position.y = 0.03;
    heatmapMeshRef.current = heatmapMesh;
    scene.add(heatmapMesh);

    // 12. ANIMATED SHOPPER AVATARS (Trajectory Pathfinding)
    const customersGroup = new THREE.Group();
    scene.add(customersGroup);

    const waypoints = [
      { x: 13, z: 11 },   // 0: Store Entry
      { x: 8.8, z: -4 },  // 1: Produce Aisle 4A
      { x: 3.2, z: -4 },  // 2: Bakery Aisle 3A
      { x: -2.5, z: -4 }, // 3: Snacks Aisle 2A
      { x: -8, z: -4 },   // 4: Cold Drinks Aisle 1A
      { x: -8, z: 3 },    // 5: Dairy Aisle 1B
      { x: -6, z: 8.8 },  // 6: Checkout Counter 1 Queue
      { x: -13, z: 11 },  // 7: Store Exit
    ];

    const shoppersData: any[] = [];
    for (let i = 0; i < 16; i++) {
      const shopperGroup = new THREE.Group();

      // Avatar Geometry
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfcd34d }));
      head.position.y = 1.35;
      const avatarColors = [0x0284c7, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xec4899, 0x06b6d4];
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.26, 0.75), 
        new THREE.MeshStandardMaterial({ color: avatarColors[i % avatarColors.length] })
      );
      body.position.y = 0.85;
      shopperGroup.add(head, body);

      // Mini Cart or Basket
      if (i % 2 === 0) {
        const basket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
        basket.position.set(0.3, 0.5, 0.3);
        shopperGroup.add(basket);
      }

      // Shadow disc
      const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 }));
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.04;
      shopperGroup.add(shadowDisc);

      const startPt = waypoints[i % waypoints.length];
      const startX = startPt.x + (Math.random() - 0.5) * 1.5;
      const startZ = startPt.z + (Math.random() - 0.5) * 1.5;
      shopperGroup.position.set(startX, 0, startZ);

      customersGroup.add(shopperGroup);

      shoppersData.push({
        mesh: shopperGroup,
        x: startX,
        z: startZ,
        targetX: startX,
        targetZ: startZ,
        speed: 0.035 + Math.random() * 0.02,
        stage: i % waypoints.length,
        dwellTime: Math.random() * 60,
      });
    }
    shoppersRef.current = shoppersData;

    // 13. Raycasting Click Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.userData?.type && parent !== scene) {
          parent = parent.parent;
        }

        if (parent && parent.userData?.type) {
          setSelectedEntity({
            type: parent.userData.type,
            data: parent.userData.data,
          });

          if (parent.userData.type === 'SHELF' && parent.userData.data?.id) {
            setActiveShelfTabId(parent.userData.data.id);
          }
        }
      }
    };

    // Pointer Drag for Orbiting
    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      orbitAngles.current.theta -= deltaX * 0.006;
      orbitAngles.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitAngles.current.phi + deltaY * 0.006));

      if (cameraView === '3D') {
        const radius = orbitAngles.current.radius;
        const x = radius * Math.sin(orbitAngles.current.phi) * Math.sin(orbitAngles.current.theta);
        const y = radius * Math.cos(orbitAngles.current.phi);
        const z = radius * Math.sin(orbitAngles.current.phi) * Math.cos(orbitAngles.current.theta);
        targetCamPos.current.set(x, y, z);
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);
    renderer.domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // 14. Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth Camera LERP
      camera.position.lerp(targetCamPos.current, 0.08);
      camera.lookAt(targetCamLook.current);

      // Shopper Movement Update
      shoppersRef.current.forEach((sh) => {
        if (sh.dwellTime > 0) {
          sh.dwellTime -= delta * 15;
          return;
        }

        const dx = sh.targetX - sh.mesh.position.x;
        const dz = sh.targetZ - sh.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.4) {
          sh.stage = (sh.stage + 1) % waypoints.length;
          const nextWp = waypoints[sh.stage];
          sh.targetX = nextWp.x + (Math.random() - 0.5) * 1.8;
          sh.targetZ = nextWp.z + (Math.random() - 0.5) * 1.8;
          // Dwell longer at Beverage shelf and Checkout counter
          sh.dwellTime = sh.stage === 4 || sh.stage === 6 ? 45 + Math.random() * 55 : 12;
        } else {
          sh.mesh.position.x += (dx / dist) * sh.speed;
          sh.mesh.position.z += (dz / dist) * sh.speed;
          sh.mesh.rotation.y = Math.atan2(dx, dz);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 15. Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.domElement.removeEventListener('mousedown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [shelfZones, counters]);

  // Camera View Mode Controller
  useEffect(() => {
    if (!cameraRef.current) return;

    if (cameraView === '3D') {
      // Perspective 3D Orbit View
      targetCamPos.current.set(0, 24, 26);
      targetCamLook.current.set(0, 0, 0);
    } else if (cameraView === 'TOP') {
      // Top View / Warehouse Layout Plan
      targetCamPos.current.set(0, 36, 0.05);
      targetCamLook.current.set(0, 0, 0);
    } else if (cameraView === 'FRONT') {
      // Front View (Looking straight through Entrance, Checkout, and Aisles)
      targetCamPos.current.set(0, 9, 28);
      targetCamLook.current.set(0, 2, 0);
    } else if (cameraView === 'SIDE') {
      // Side View (Looking from East aisle side profiles)
      targetCamPos.current.set(28, 9, 0);
      targetCamLook.current.set(0, 2, 0);
    } else if (cameraView === 'COUNTERS') {
      // Queue & Counter 1/2/3 Focus
      targetCamPos.current.set(0, 6, 15);
      targetCamLook.current.set(0, 1.2, 7.5);
    } else if (cameraView === 'WAREHOUSE') {
      // Backroom Reserve Focus
      targetCamPos.current.set(-13, 8, -2);
      targetCamLook.current.set(-13, 1.5, -9);
    }
  }, [cameraView]);

  // Toggle Heatmap visibility
  useEffect(() => {
    if (heatmapMeshRef.current) {
      heatmapMeshRef.current.visible = showHeatmap;
    }
  }, [showHeatmap]);

  const cokeProduct = products.find((p) => p.sku === 'BEV-COKE-500');
  const counter1 = counters.find((c) => c.id === 1);
  const counter2 = counters.find((c) => c.id === 2);
  const counter3 = counters.find((c) => c.id === 3);

  const activeShelfZone = shelfZones.find((z) => z.id === activeShelfTabId) || shelfZones[0];
  const activeShelfProducts = products.filter((p) => p.shelfId === activeShelfZone?.id);

  const filteredShelfZones = shelfCategoryFilter === 'ALL'
    ? shelfZones
    : shelfZones.filter((z) => z.category.toUpperCase() === shelfCategoryFilter);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Multi-Angle View Controls */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              3D Supermarket & Warehouse Digital Twin
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
              8 SHELF BAYS • 3 COUNTERS • ENTRY/EXIT
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time WebGL spatial twin with dynamic heatmaps, multi-angle camera projections, and shelf-by-shelf inventory diagnostics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Heatmap Toggle */}
          <button
            id="heatmap-toggle-btn"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-xs ${
              showHeatmap
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>{showHeatmap ? 'Heatmap: ACTIVE' : 'Heatmap: HIDDEN'}</span>
          </button>

          {/* Camera View Switcher (3D, Top, Front, Side, Counters, Warehouse) */}
          <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              id="view-3d-btn"
              onClick={() => setCameraView('3D')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cameraView === '3D' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3D Orbit
            </button>
            <button
              id="view-top-btn"
              onClick={() => setCameraView('TOP')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cameraView === 'TOP' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Top View
            </button>
            <button
              id="view-front-btn"
              onClick={() => setCameraView('FRONT')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cameraView === 'FRONT' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Front View
            </button>
            <button
              id="view-side-btn"
              onClick={() => setCameraView('SIDE')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cameraView === 'SIDE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Side View
            </button>
            <button
              id="view-counters-btn"
              onClick={() => setCameraView('COUNTERS')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cameraView === 'COUNTERS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Counters 1-3
            </button>
            <button
              id="view-warehouse-btn"
              onClick={() => setCameraView('WAREHOUSE')}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                cameraView === 'WAREHOUSE' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Backroom
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3D Canvas Viewport & HUD Overlays */}
      <div className="relative w-full h-[540px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Left Banner: Entry & Exit Flow Indicators */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-emerald-300 shadow-xs flex items-center space-x-2 text-xs font-bold text-emerald-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>ENTRY (Front-Right Gate)</span>
          </div>

          <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-rose-300 shadow-xs flex items-center space-x-2 text-xs font-bold text-rose-900">
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>EXIT (Front-Left Gate)</span>
          </div>

          <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-blue-200 shadow-xs flex items-center space-x-2 text-xs font-bold text-blue-900">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Camera: {cameraView} (Click + Drag to Orbit)</span>
          </div>
        </div>

        {/* 3D Floating Alert Action Badges */}
        <div className="absolute top-14 left-3 flex flex-col space-y-2 pointer-events-none">
          {cokeProduct && cokeProduct.visibleAvailabilityPct < 30 && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-amber-300 shadow-xs flex items-center space-x-2.5 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Aisle 1A Low Facing: Coca-Cola (20%)</div>
                <div className="text-[10px] text-slate-500 font-mono font-medium">Recorded: 52 | Backroom: 34 → REPLENISH</div>
              </div>
              {onReplenishProduct && (
                <button
                  onClick={() => onReplenishProduct(cokeProduct.id)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  Restock
                </button>
              )}
            </div>
          )}

          {counter1 && counter1.currentQueue >= 6 && (!counter2 || !counter2.isOpen) && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-rose-300 shadow-xs flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <div>
                <div className="text-xs font-bold text-rose-900">Queue Surge: Counter 1 ({counter1.currentQueue} waiting)</div>
                <div className="text-[10px] text-slate-500 font-mono font-medium">ML Forecast: Open Counter 2</div>
              </div>
              {onOpenCounter2 && (
                <button
                  onClick={onOpenCounter2}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  Open Counter 2
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Legend & Controls */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono">Optimal (&gt;60%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-mono">Attention (30-60%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[11px] font-mono">Critical (&lt;30%)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500 border-l border-slate-200 pl-3">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px]">Click any Shelf / Counter 1-3 / Entry / Exit in 3D to inspect</span>
          </div>
        </div>

        {/* Selected Entity Inspector Modal / Side Card */}
        {selectedEntity && (
          <div className="absolute top-3 right-3 w-84 bg-white p-4 rounded-xl border border-slate-200 shadow-lg z-20 animate-in fade-in slide-in-from-right-4 duration-200 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {selectedEntity.type === 'SHELF' && 'Shelf Zone Details'}
                  {selectedEntity.type === 'COUNTER' && 'Checkout Counter Details'}
                  {selectedEntity.type === 'ENTRY' && 'Store Entrance Gate'}
                  {selectedEntity.type === 'EXIT' && 'Store Exit Gate'}
                  {selectedEntity.type === 'WAREHOUSE' && 'Warehouse Backroom Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Shelf Inspection */}
            {selectedEntity.type === 'SHELF' && (
              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zone Name:</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedEntity.data.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Facing</span>
                    <p className={`text-base font-bold font-mono ${
                      selectedEntity.data.overallAvailabilityPct < 30 ? 'text-rose-600' : selectedEntity.data.overallAvailabilityPct < 60 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {selectedEntity.data.overallAvailabilityPct}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Shopper Traffic</span>
                    <p className="text-base font-bold text-blue-600 font-mono">{selectedEntity.data.trafficLevel}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Products Placed on Shelf</p>
                    <span className="text-[10px] font-mono text-slate-500">
                      {products.filter((p) => p.shelfId === selectedEntity.data.id).length} SKUs
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {products
                      .filter((p) => p.shelfId === selectedEntity.data.id)
                      .map((p) => (
                        <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
                          <div className="flex justify-between font-semibold text-slate-900 text-xs">
                            <span className="truncate max-w-[170px]">{p.name}</span>
                            <span className={`font-mono text-xs ${p.visibleAvailabilityPct < 30 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                              {p.visibleAvailabilityPct}%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex justify-between border-t border-slate-200/50 pt-1">
                            <span>POS: {p.recordedInventoryUnits}</span>
                            <span>Backroom: {p.backroomStockUnits}</span>
                            <span>{p.salesVelocityUnitsPerHour}/hr</span>
                          </div>
                          {p.visibleAvailabilityPct < 30 && onReplenishProduct && (
                            <button
                              onClick={() => onReplenishProduct(p.id)}
                              className="w-full mt-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                            >
                              Replenish Item Now
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Counter Inspection (Counter 1, Counter 2, Counter 3) */}
            {selectedEntity.type === 'COUNTER' && (
              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Counter Identifier:</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedEntity.data.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Queue Length</span>
                    <p className="text-base font-bold font-mono text-slate-900">{selectedEntity.data.currentQueue} customers</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Predicted (10m)</span>
                    <p className="text-base font-bold font-mono text-blue-600">{selectedEntity.data.predictedQueue} customers</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff / Mode:</span>
                  <p className="font-semibold text-slate-900">{selectedEntity.data.staffName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded">
                  <div>Arrival: {selectedEntity.data.arrivalRatePerMin}/min</div>
                  <div>Service: {selectedEntity.data.serviceRatePerMin}/min</div>
                </div>

                {selectedEntity.data.id === 2 && !selectedEntity.data.isOpen && onOpenCounter2 && (
                  <button
                    onClick={() => {
                      onOpenCounter2();
                      setSelectedEntity(null);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer transition-colors shadow-xs"
                  >
                    Open Counter 2 Now
                  </button>
                )}
              </div>
            )}

            {/* Entry / Exit / Warehouse Inspections */}
            {selectedEntity.type === 'ENTRY' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Main Entrance & Trolley Bay</p>
                <p className="text-slate-500 leading-relaxed">
                  Equipped with automated sliding glass gates, turnstile sensors, and trolley corral. Connected to OpenCV footfall ingestion pipeline.
                </p>
                <div className="bg-emerald-50 text-emerald-900 p-2 rounded border border-emerald-200 text-[11px] font-mono">
                  Optical Flow: Inflow +4.2 cust/min
                </div>
              </div>
            )}

            {selectedEntity.type === 'EXIT' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Checkout Exit & Security Portal</p>
                <p className="text-slate-500 leading-relaxed">
                  Equipped with dual RF/EAS anti-theft pedestals, post-payment scan confirmation, and customer flow monitors.
                </p>
                <div className="bg-rose-50 text-rose-900 p-2 rounded border border-rose-200 text-[11px] font-mono">
                  EAS System: Active • Outflow +3.8 cust/min
                </div>
              </div>
            )}

            {selectedEntity.type === 'WAREHOUSE' && (
              <div className="mt-3 space-y-2.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900">Backroom Reserve / Central Stock</p>
                <p className="text-slate-500 leading-relaxed">
                  Palletized storage area holding reserve units for fast aisle restocks.
                </p>
                <div className="bg-slate-50 text-slate-900 p-2 rounded border border-slate-200 text-[11px] font-mono">
                  Total Reserve Units: 580 | Pending Transfers: 1
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Shelf Details Separately (Dedicated Interactive Explorer Section) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Shelf-by-Shelf Separate Details & Product Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Inspect different kinds of products placed on each shelf rack across Aisles 1 to 4
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {['ALL', 'BEVERAGES', 'DAIRY', 'SNACKS', 'GRAINS', 'BAKERY', 'HOUSEHOLD', 'PRODUCE', 'PANTRY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setShelfCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  shelfCategoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shelf Bays Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {filteredShelfZones.map((zone) => {
            const isSelected = zone.id === activeShelfTabId;
            const isCritical = zone.overallAvailabilityPct < 30;
            const isAttention = zone.overallAvailabilityPct < 60;
            const zoneProds = products.filter((p) => p.shelfId === zone.id);

            return (
              <button
                key={zone.id}
                onClick={() => {
                  setActiveShelfTabId(zone.id);
                  setSelectedEntity({ type: 'SHELF', data: zone });
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span>Aisle {zone.aisle}</span>
                  <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500' : isAttention ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {zone.category}
                </div>
                <div className="text-[11px] font-mono font-bold mt-1 flex justify-between">
                  <span className={isCritical ? 'text-rose-600' : isAttention ? 'text-amber-600' : 'text-emerald-600'}>
                    {zone.overallAvailabilityPct}%
                  </span>
                  <span className="text-slate-400 font-normal">{zoneProds.length} items</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Single Shelf Inspector Display */}
        {activeShelfZone && (
          <div className="p-4.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">
                    AISLE {activeShelfZone.aisle} • {activeShelfZone.category.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    {activeShelfZone.name}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Physical 3D Shelf Location: X: {activeShelfZone.x}m, Z: {activeShelfZone.z}m • Traffic Level: {activeShelfZone.trafficLevel}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Shelf Facing</div>
                  <div className={`text-lg font-bold font-mono ${
                    activeShelfZone.overallAvailabilityPct < 30 ? 'text-rose-600' : activeShelfZone.overallAvailabilityPct < 60 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {activeShelfZone.overallAvailabilityPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table for this specific Shelf */}
            <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider font-mono">
                    <th className="py-2.5 px-3">Product Name & SKU</th>
                    <th className="py-2.5 px-3">Shelf Tier Placement</th>
                    <th className="py-2.5 px-3">Camera Facing %</th>
                    <th className="py-2.5 px-3">POS Recorded</th>
                    <th className="py-2.5 px-3">Backroom Reserve</th>
                    <th className="py-2.5 px-3">Sales Velocity</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 font-medium text-slate-800">
                  {activeShelfProducts.map((p) => {
                    const isLow = p.visibleAvailabilityPct < 30;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{p.sku}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {p.shelfLocation}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${isLow ? 'bg-rose-500' : p.visibleAvailabilityPct < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${p.visibleAvailabilityPct}%` }}
                              />
                            </div>
                            <span className={`font-mono text-xs font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              {p.visibleAvailabilityPct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          {p.recordedInventoryUnits} units
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {p.backroomStockUnits > 0 ? (
                            <span className="text-emerald-700 font-semibold">{p.backroomStockUnits} units in backroom</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">0 in backroom</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {p.salesVelocityUnitsPerHour} units/hr
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isLow && onReplenishProduct ? (
                            <button
                              onClick={() => onReplenishProduct(p.id)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                            >
                              Restock
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold font-mono">OPTIMAL ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Checkout Counters 1, 2, and 3 Status Summary Bar */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
            Checkout Counters Status (Counter 1, Counter 2, Counter 3)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Counter 1 */}
          <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900 uppercase tracking-wide">Counter 1 (Express)</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono text-[10px]">CONGESTED</span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {counter1?.currentQueue || 7} <span className="text-xs font-normal text-slate-600">waiting</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Staff: {counter1?.staffName || 'Priya R.'} • Arrival: 5.2/min
            </div>
          </div>

          {/* Counter 2 */}
          <div className={`p-3.5 rounded-lg border ${counter2?.isOpen ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50/60'}`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900 uppercase tracking-wide">Counter 2 (Standard)</span>
              <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${counter2?.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {counter2?.isOpen ? 'OPEN' : 'STANDBY'}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {counter2?.isOpen ? counter2.currentQueue : 0} <span className="text-xs font-normal text-slate-600">waiting</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1 flex justify-between items-center">
              <span>Staff: {counter2?.staffName || 'Ramesh K.'}</span>
              {!counter2?.isOpen && onOpenCounter2 && (
                <button
                  onClick={onOpenCounter2}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Open
                </button>
              )}
            </div>
          </div>

          {/* Counter 3 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900 uppercase tracking-wide">Counter 3 (Self-Checkout)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">ACTIVE</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {counter3?.currentQueue || 2} <span className="text-xs font-normal text-slate-600">waiting</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Automated Scan & Go • Attendant Monitored
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
