import * as THREE from 'three';
import { MapConfig } from './mapData';
import { DominationFlag } from '../../types/game';
import {
  getAsphaltTexture,
  getConcreteTexture,
  getCorrugatedContainerTexture,
  getTerminalFloorTexture,
  getEstateTileTexture,
  createAtmosphericSky
} from '../textures';

export function buildMap3D(
  scene: THREE.Scene,
  config: MapConfig
): {
  flagMeshes: Map<'A' | 'B' | 'C', { pole: THREE.Mesh; cloth: THREE.Mesh; ring: THREE.Mesh }>;
} {
  // 1. Atmosphere, Sky Dome & Fog
  scene.background = new THREE.Color(config.skyColor);
  scene.fog = new THREE.Fog(config.fogColor, 28, 95);

  const sunDir = new THREE.Vector3(...config.sunPosition).normalize();
  createAtmosphericSky(scene, config.skyColor, config.horizonColor, sunDir);

  // 2. Realistic Studio Lighting Rig
  const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
  sunLight.position.set(...config.sunPosition);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 140;
  sunLight.shadow.camera.left = -45;
  sunLight.shadow.camera.right = 45;
  sunLight.shadow.camera.top = 45;
  sunLight.shadow.camera.bottom = -45;
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 1.35);
  scene.add(hemiLight);

  // 3. Ground Base Surface with Theme-specific Texture
  let groundMat: THREE.MeshStandardMaterial;

  if (config.theme === 'airport') {
    const termTex = getTerminalFloorTexture();
    termTex.repeat.set(12, 10);
    groundMat = new THREE.MeshStandardMaterial({
      map: termTex,
      roughness: 0.25,
      metalness: 0.1
    });
  } else if (config.theme === 'luxury') {
    const estateTex = getEstateTileTexture();
    estateTex.repeat.set(12, 10);
    groundMat = new THREE.MeshStandardMaterial({
      map: estateTex,
      roughness: 0.45,
      metalness: 0.05
    });
  } else if (config.theme === 'industrial') {
    const concTex = getConcreteTexture();
    concTex.repeat.set(10, 10);
    groundMat = new THREE.MeshStandardMaterial({
      map: concTex,
      roughness: 0.55,
      metalness: 0.25
    });
  } else {
    // Urban / Desert
    const aspTex = getAsphaltTexture();
    aspTex.repeat.set(2, 6);
    groundMat = new THREE.MeshStandardMaterial({
      map: aspTex,
      roughness: 0.85,
      metalness: 0.1
    });
  }

  const groundGeo = new THREE.PlaneGeometry(config.size.width + 60, config.size.depth + 60);
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // 4. Map Specific Architectural Geometry
  if (config.id === 'nuketown') {
    buildDetailedNuketown(scene);
  } else if (config.id === 'shipment') {
    buildDetailedShipment(scene);
  } else if (config.id === 'rust') {
    buildDetailedRust(scene);
  } else if (config.id === 'terminal') {
    buildDetailedTerminal(scene);
  } else if (config.id === 'raid') {
    buildDetailedRaid(scene);
  }

  // 5. Surrounding Natural / Industrial Perimeters (No floating in void)
  createSurroundingEnvironment(scene, config);

  // 6. Domination Flags with Animated Fabric & Glowing Base Rings
  const flagMeshes = new Map<'A' | 'B' | 'C', { pole: THREE.Mesh; cloth: THREE.Mesh; ring: THREE.Mesh }>();
  config.dominationFlags.forEach((flag) => {
    const meshes = createDominationFlagVisual(scene, flag);
    flagMeshes.set(flag.id, meshes);
  });

  return { flagMeshes };
}

/* =========================================================================
   1. NUKETOWN 2025 (Strictly Symmetrical Cul-de-Sac)
   ========================================================================= */
function buildDetailedNuketown(scene: THREE.Scene) {
  // Paved central road with asphalt texture & yellow dashed median
  const roadGeo = new THREE.PlaneGeometry(16, 44);
  const roadTex = getAsphaltTexture();
  roadTex.repeat.set(1, 4);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 0);
  road.receiveShadow = true;
  scene.add(road);

  // Sidewalk curbs on West and East
  const curbGeo = new THREE.BoxGeometry(2.4, 0.22, 44);
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.7 });
  const wCurb = new THREE.Mesh(curbGeo, curbMat);
  wCurb.position.set(-9.2, 0.11, 0);
  wCurb.receiveShadow = true;
  scene.add(wCurb);

  const eCurb = new THREE.Mesh(curbGeo, curbMat);
  eCurb.position.set(9.2, 0.11, 0);
  eCurb.receiveShadow = true;
  scene.add(eCurb);

  // West Green House (Allies Base)
  createDetailedHouse(scene, -16, 0, 0x22543d, 0x143224, 0xd4a373, 'Maison Verte', true);

  // East Yellow House (Enemies Base - Mirrored)
  createDetailedHouse(scene, 16, 0, 0xb45309, 0x78350f, 0xfde68a, 'Maison Jaune', false);

  // Central Yellow School Bus (Diagonal Mid-North Cover)
  createSchoolBus(scene, 0, -5, 11, 3.2, 3.2, 0xd97706);

  // Armored Delivery Truck (Diagonal Mid-South Cover)
  createDeliveryTruck(scene, 0, 5, 9.5, 3.0, 3.2, 0x2563eb);

  // Concrete Jersey Barriers for cover
  createJerseyBarrier(scene, -4.5, 0, 0);
  createJerseyBarrier(scene, 4.5, 0, 0);

  // Streetlamps with volumetric glow
  createStreetlamp(scene, -8.5, -14);
  createStreetlamp(scene, 8.5, -14);
  createStreetlamp(scene, -8.5, 14);
  createStreetlamp(scene, 8.5, 14);

  // Backyard vinyl picket fences
  createPicketFence(scene, -16, -18, 20, 'ew');
  createPicketFence(scene, -16, 18, 20, 'ew');
  createPicketFence(scene, 16, -18, 20, 'ew');
  createPicketFence(scene, 16, 18, 20, 'ew');
}

/* =========================================================================
   2. SHIPMENT 2025 (4-Quadrant Rotational Symmetry)
   ========================================================================= */
function buildDetailedShipment(scene: THREE.Scene) {
  // Wet reflective concrete dock with yellow boundary hazard lines
  const dockGeo = new THREE.PlaneGeometry(46, 46);
  const dockTex = getConcreteTexture();
  dockTex.repeat.set(4, 4);
  const dockMat = new THREE.MeshStandardMaterial({
    map: dockTex,
    roughness: 0.35,
    metalness: 0.4
  });
  const dock = new THREE.Mesh(dockGeo, dockMat);
  dock.rotation.x = -Math.PI / 2;
  dock.position.y = 0.02;
  dock.receiveShadow = true;
  scene.add(dock);

  // 4 Corner Stacked Container Hubs (NW, NE, SW, SE)
  const colors = [
    { c: '#dc2626', s: 'RED-409' },
    { c: '#2563eb', s: 'BLU-812' },
    { c: '#15803d', s: 'GRN-301' },
    { c: '#d97706', s: 'YEL-774' }
  ];

  // NW Corner Stacks
  createStackedContainers(scene, -12, -12, colors[0].c, colors[0].s);
  // NE Corner Stacks
  createStackedContainers(scene, 12, -12, colors[1].c, colors[1].s);
  // SW Corner Stacks
  createStackedContainers(scene, -12, 12, colors[2].c, colors[2].s);
  // SE Corner Stacks
  createStackedContainers(scene, 12, 12, colors[3].c, colors[3].s);

  // Center Open Crossing Containers (Traversable interior tunnels)
  createOpenTunnelContainer(scene, 0, -4, 0); // North tunnel
  createOpenTunnelContainer(scene, 0, 4, 0); // South tunnel
  createOpenTunnelContainer(scene, -4, 0, Math.PI / 2); // West tunnel
  createOpenTunnelContainer(scene, 4, 0, Math.PI / 2); // East tunnel

  // Elevated Steel Catwalks with Stairs
  createElevatedCatwalk(scene, -16, 0, 18, 'z');
  createElevatedCatwalk(scene, 16, 0, 18, 'z');

  // Heavy Industrial Crane Towers in 4 Corners
  createPortCraneTower(scene, -18, -18);
  createPortCraneTower(scene, 18, -18);
  createPortCraneTower(scene, -18, 18);
  createPortCraneTower(scene, 18, 18);
}

/* =========================================================================
   3. RUST REFINERY (Symmetrical Multi-Tier Oil Rig)
   ========================================================================= */
function buildDetailedRust(scene: THREE.Scene) {
  // Sand-covered gravel foundation
  const baseGeo = new THREE.PlaneGeometry(54, 54);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.95,
    metalness: 0.1
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.rotation.x = -Math.PI / 2;
  baseMesh.position.y = 0.02;
  baseMesh.receiveShadow = true;
  scene.add(baseMesh);

  // Central 3-Tier Oil Rig Tower with Trusses
  createCentralOilTower(scene);

  // Symmetrical Access Ramps (North & South)
  createRustRamp(scene, 0, -5.5, 0);
  createRustRamp(scene, 0, 5.5, Math.PI);

  // 4 Fuel Silo Towers at (±14, ±14)
  createFuelSilo(scene, -14, -14);
  createFuelSilo(scene, 14, -14);
  createFuelSilo(scene, -14, 14);
  createFuelSilo(scene, 14, 14);

  // Overhead Industrial Pipelines crossing North-South & East-West
  createOverheadPipes(scene, -14, 14, -14, 14);

  // Military Sandbag Bunkers in Spawns
  createSandbagBunker(scene, 0, -20);
  createSandbagBunker(scene, 0, 20);
}

/* =========================================================================
   4. TERMINAL 2025 (Modern Symmetrical Airport Concourse)
   ========================================================================= */
function buildDetailedTerminal(scene: THREE.Scene) {
  // Polished Terrazzo Concourse floor
  const floorGeo = new THREE.PlaneGeometry(58, 42);
  const floorTex = getTerminalFloorTexture();
  floorTex.repeat.set(10, 8);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.2,
    metalness: 0.15
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  // Modern Steel & Glass Airport Roof Canopy
  createAirportCeiling(scene, 58, 42);

  // West Departure Gate Wing (Allies)
  createAirportGateLounge(scene, -20, 0, 'PORTE A-12', true);

  // East Arrival Gate Wing (Enemies)
  createAirportGateLounge(scene, 20, 0, 'PORTE B-08', false);

  // Central Rotunda: Dual Luggage Carousel Systems & Flight Boards
  createLuggageCarousel(scene, 0, -3.5);
  createLuggageCarousel(scene, 0, 3.5);
  createFlightInformationBoard(scene, 0, 0);

  // Side Corridors: North Duty-Free Shops & South Baggage Stacks
  createAirportDutyFreeShop(scene, 0, -15);
  createAirportSecurityCheck(scene, -10, 0);
  createAirportSecurityCheck(scene, 10, 0);

  // Airport Terminal Bench Seating Rows
  createTerminalBenches(scene, -6, -8);
  createTerminalBenches(scene, 6, -8);
  createTerminalBenches(scene, -6, 8);
  createTerminalBenches(scene, 6, 8);
}

/* =========================================================================
   5. RAID ESTATE (Mediterranean Luxury Villa & Courtyard)
   ========================================================================= */
function buildDetailedRaid(scene: THREE.Scene) {
  // Terracotta Courtyard Pavement
  const courtGeo = new THREE.PlaneGeometry(62, 44);
  const courtTex = getEstateTileTexture();
  courtTex.repeat.set(12, 9);
  const courtMat = new THREE.MeshStandardMaterial({
    map: courtTex,
    roughness: 0.45,
    metalness: 0.1
  });
  const court = new THREE.Mesh(courtGeo, courtMat);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.02;
  court.receiveShadow = true;
  scene.add(court);

  // Center Roman Pool with Turquoise Water
  createRomanSwimmingPool(scene, 0, 0, 14, 8);

  // North Villa Main Residence (Allies Side)
  createVillaMansion(scene, 0, -18, 'North Villa', true);

  // South Guest Villa & Terrace (Enemies Side)
  createVillaMansion(scene, 0, 18, 'South Villa', false);

  // West Flank: Covered Colonnade Gallery with Marble Pillars
  createVillaColonnade(scene, -18, 0, 24);

  // East Flank: Luxury Sports Car Garage & Breezeway
  createVillaGarage(scene, 18, 0);

  // Decorative Palm Trees & Planters at Courtyard Corners
  createPalmTreePlanter(scene, -8, -9);
  createPalmTreePlanter(scene, 8, -9);
  createPalmTreePlanter(scene, -8, 9);
  createPalmTreePlanter(scene, 8, 9);
}

/* =========================================================================
   DETAILED ARCHITECTURAL PROCEDURAL GENERATORS (3-12 PARTS PER MODEL)
   ========================================================================= */

function createDetailedHouse(
  scene: THREE.Scene,
  x: number,
  z: number,
  wallColor: number,
  trimColor: number,
  roofColor: number,
  _label: string,
  isFacingEast: boolean
) {
  const houseGroup = new THREE.Group();
  houseGroup.position.set(x, 0, z);

  // 1. Concrete Foundation
  const foundMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.4, 18.2), foundMat);
  foundation.position.y = 0.2;
  foundation.receiveShadow = true;
  houseGroup.add(foundation);

  // 2. Ground Floor Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.65 });
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.2, 17.6), wallMat);
  groundFloor.position.y = 2.0;
  groundFloor.castShadow = true;
  groundFloor.receiveShadow = true;
  houseGroup.add(groundFloor);

  // 3. Second Floor Upper Walls
  const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(9.2, 3.0, 14.0), wallMat);
  upperFloor.position.set(0, 5.1, 0);
  upperFloor.castShadow = true;
  upperFloor.receiveShadow = true;
  houseGroup.add(upperFloor);

  // 4. Second Floor Sniper Balcony
  const balconyX = isFacingEast ? 4.8 : -4.8;
  const balcFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.2, 5.0),
    new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.7 })
  );
  balcFloor.position.set(balconyX, 3.7, 0);
  houseGroup.add(balcFloor);

  // Balcony Safety Railing
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
  const railing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 5.0), railMat);
  railing.position.set(balconyX + (isFacingEast ? 1.15 : -1.15), 4.25, 0);
  houseGroup.add(railing);

  // 5. Gabled Roof with Eaves
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.75 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 2.2, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 7.7, 0);
  roof.castShadow = true;
  houseGroup.add(roof);

  // 6. Tinted Glass Windows with White Trim
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.75
  });

  const winX = isFacingEast ? 4.85 : -4.85;
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 2.2), glassMat);
  win1.position.set(winX, 5.2, 0);
  houseGroup.add(win1);

  // Ground floor windows
  const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.8), glassMat);
  win2.position.set(winX, 2.2, -4.5);
  houseGroup.add(win2);

  const win3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.8), glassMat);
  win3.position.set(winX, 2.2, 4.5);
  houseGroup.add(win3);

  // 7. Chimney on Roof
  const chim = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 3.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
  );
  chim.position.set(isFacingEast ? -2.2 : 2.2, 7.5, -3.5);
  chim.castShadow = true;
  houseGroup.add(chim);

  scene.add(houseGroup);
}

function createSchoolBus(
  scene: THREE.Scene,
  x: number,
  z: number,
  length: number,
  width: number,
  height: number,
  color: number
) {
  const bus = new THREE.Group();
  bus.position.set(x, 0, z);
  bus.rotation.y = 0.25;

  // 1. Chassis Frame
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.5 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, length), chassisMat);
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  bus.add(chassis);

  // 2. Yellow Bus Body
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.8, length), bodyMat);
  body.position.y = height / 2 + 0.3;
  body.castShadow = true;
  body.receiveShadow = true;
  bus.add(body);

  // 3. Black Accent Rub-Rails along sides
  const railMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
  const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, length), railMat);
  leftRail.position.set(-width / 2 - 0.04, 1.2, 0);
  bus.add(leftRail);

  const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, length), railMat);
  rightRail.position.set(width / 2 + 0.04, 1.2, 0);
  bus.add(rightRail);

  // 4. Tinted Window Glass Bands
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85
  });
  const winBandL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, length - 1.2), glassMat);
  winBandL.position.set(-width / 2 - 0.04, height / 2 + 0.4, 0);
  bus.add(winBandL);

  const winBandR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, length - 1.2), glassMat);
  winBandR.position.set(width / 2 + 0.04, height / 2 + 0.4, 0);
  bus.add(winBandR);

  // 5. Heavy Rubber Wheels (6 wheels)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 16);

  const wheelPositions = [
    [-width / 2 - 0.1, 0.48, -length / 2 + 1.8],
    [width / 2 + 0.1, 0.48, -length / 2 + 1.8],
    [-width / 2 - 0.1, 0.48, length / 2 - 1.8],
    [width / 2 + 0.1, 0.48, length / 2 - 1.8],
    [-width / 2 - 0.1, 0.48, length / 2 - 2.8],
    [width / 2 + 0.1, 0.48, length / 2 - 2.8]
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    bus.add(wheel);
  });

  scene.add(bus);
}

function createDeliveryTruck(
  scene: THREE.Scene,
  x: number,
  z: number,
  length: number,
  width: number,
  height: number,
  color: number
) {
  const truck = new THREE.Group();
  truck.position.set(x, 0, z);
  truck.rotation.y = -0.3;

  // 1. Truck Cab
  const cabMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.5, 3.2), cabMat);
  cab.position.set(0, height / 2, -length / 2 + 1.6);
  cab.castShadow = true;
  truck.add(cab);

  // Windshield
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, 1.1, 0.1), glassMat);
  windshield.position.set(0, height - 0.8, -length / 2 + 0.05);
  truck.add(windshield);

  // 2. Cargo Box (White Corrugated)
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
  const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, height + 0.2, length - 3.4), boxMat);
  cargoBox.position.set(0, (height + 0.2) / 2 + 0.4, 1.6);
  cargoBox.castShadow = true;
  cargoBox.receiveShadow = true;
  truck.add(cargoBox);

  // 3. Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 16);
  [
    [-width / 2 - 0.1, 0.48, -length / 2 + 1.6],
    [width / 2 + 0.1, 0.48, -length / 2 + 1.6],
    [-width / 2 - 0.1, 0.48, length / 2 - 1.2],
    [width / 2 + 0.1, 0.48, length / 2 - 1.2]
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    truck.add(wheel);
  });

  scene.add(truck);
}

function createStackedContainers(scene: THREE.Scene, x: number, z: number, colorHex: string, stencil: string) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const tex = getCorrugatedContainerTexture(colorHex, stencil);
  const contMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.4,
    metalness: 0.6
  });

  // Bottom Container 1
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.7, 7.2), contMat);
  c1.position.set(-1.8, 1.35, 0);
  c1.castShadow = true;
  c1.receiveShadow = true;
  group.add(c1);

  // Bottom Container 2
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.7, 7.2), contMat);
  c2.position.set(1.8, 1.35, 0);
  c2.castShadow = true;
  c2.receiveShadow = true;
  group.add(c2);

  // Stacked Upper Container 3
  const c3 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.7, 7.2), contMat);
  c3.position.set(0, 4.05, 0);
  c3.castShadow = true;
  c3.receiveShadow = true;
  group.add(c3);

  scene.add(group);
}

function createOpenTunnelContainer(scene: THREE.Scene, x: number, z: number, rotY: number) {
  const tunnel = new THREE.Group();
  tunnel.position.set(x, 0, z);
  tunnel.rotation.y = rotY;

  const mat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 6.4), mat);
  floor.position.y = 0.08;
  tunnel.add(floor);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 6.4), mat);
  roof.position.y = 2.65;
  roof.castShadow = true;
  tunnel.add(roof);

  // Left Wall
  const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 6.4), mat);
  leftW.position.set(-1.22, 1.35, 0);
  leftW.castShadow = true;
  tunnel.add(leftW);

  // Right Wall
  const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 6.4), mat);
  rightW.position.set(1.22, 1.35, 0);
  rightW.castShadow = true;
  tunnel.add(rightW);

  scene.add(tunnel);
}

function createElevatedCatwalk(scene: THREE.Scene, x: number, z: number, length: number, axis: 'x' | 'z') {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

  // Catwalk Platform
  const w = axis === 'x' ? length : 1.8;
  const d = axis === 'x' ? 1.8 : length;
  const plat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), metalMat);
  plat.position.y = 2.8;
  plat.castShadow = true;
  plat.receiveShadow = true;
  group.add(plat);

  // Support Pillars every 6m
  for (let offset = -length / 2 + 1; offset <= length / 2 - 1; offset += 5.5) {
    const px = axis === 'x' ? offset : 0;
    const pz = axis === 'x' ? 0 : offset;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), metalMat);
    leg.position.set(px, 1.4, pz);
    leg.castShadow = true;
    group.add(leg);
  }

  // Safety Handrail
  const railMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.6, roughness: 0.4 });
  const railL = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.08), railMat);
  railL.position.set(0, 3.7, axis === 'x' ? 0.85 : 0);
  group.add(railL);

  scene.add(group);
}

function createCentralOilTower(scene: THREE.Scene) {
  const tower = new THREE.Group();
  tower.position.set(0, 0, 0);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });

  // 4 Main Structural Corner Truss Columns
  const trussGeo = new THREE.CylinderGeometry(0.18, 0.28, 9.5, 8);
  [
    [-2.2, 4.75, -2.2],
    [2.2, 4.75, -2.2],
    [-2.2, 4.75, 2.2],
    [2.2, 4.75, 2.2]
  ].forEach(([px, py, pz]) => {
    const truss = new THREE.Mesh(trussGeo, steelMat);
    truss.position.set(px, py, pz);
    truss.castShadow = true;
    tower.add(truss);
  });

  // Level 1 Mid Catwalk Platform (3.5m high)
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.2, 6.4), steelMat);
  l1.position.y = 3.5;
  l1.castShadow = true;
  l1.receiveShadow = true;
  tower.add(l1);

  // Level 2 Upper Sniper Platform (7.2m high)
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 4.8), steelMat);
  l2.position.y = 7.2;
  l2.castShadow = true;
  l2.receiveShadow = true;
  tower.add(l2);

  // Central Vertical Exhaust Flare Stack
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 11, 12), rustMat);
  stack.position.set(0, 5.5, 0);
  stack.castShadow = true;
  tower.add(stack);

  // Top Flashing Red Aviation Beacon
  const beaconLight = new THREE.PointLight(0xef4444, 2.5, 15);
  beaconLight.position.set(0, 11.2, 0);
  tower.add(beaconLight);

  scene.add(tower);
}

function createRustRamp(scene: THREE.Scene, x: number, z: number, rotY: number) {
  const ramp = new THREE.Group();
  ramp.position.set(x, 0, z);
  ramp.rotation.y = rotY;

  const mat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
  const plane = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 6.8), mat);
  plane.rotation.x = 0.52; // incline ramp up to 3.5m
  plane.position.set(0, 1.75, 0);
  plane.castShadow = true;
  plane.receiveShadow = true;
  ramp.add(plane);

  scene.add(ramp);
}

function createFuelSilo(scene: THREE.Scene, x: number, z: number) {
  const silo = new THREE.Group();
  silo.position.set(x, 0, z);

  const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 6.0, 20), siloMat);
  body.position.y = 3.0;
  body.castShadow = true;
  body.receiveShadow = true;
  silo.add(body);

  // Dome cap
  const cap = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), siloMat);
  cap.position.y = 6.0;
  cap.castShadow = true;
  silo.add(cap);

  // Access ladder on side
  const ladMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.0, 0.08), ladMat);
  ladder.position.set(0, 3.0, 2.45);
  silo.add(ladder);

  scene.add(silo);
}

function createOverheadPipes(scene: THREE.Scene, minX: number, maxX: number, minZ: number, maxZ: number) {
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 });
  const pipeGeo = new THREE.CylinderGeometry(0.25, 0.25, maxX - minX, 12);

  const pipe1 = new THREE.Mesh(pipeGeo, pipeMat);
  pipe1.rotation.z = Math.PI / 2;
  pipe1.position.set(0, 4.5, minZ);
  pipe1.castShadow = true;
  scene.add(pipe1);

  const pipe2 = new THREE.Mesh(pipeGeo, pipeMat);
  pipe2.rotation.z = Math.PI / 2;
  pipe2.position.set(0, 4.5, maxZ);
  pipe2.castShadow = true;
  scene.add(pipe2);
}

function createAirportCeiling(scene: THREE.Scene, width: number, depth: number) {
  // Glass and Steel Truss Ceiling canopy
  const canopy = new THREE.Group();
  canopy.position.set(0, 7.8, 0);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

  // Main Cross Girders
  for (let z = -depth / 2 + 5; z <= depth / 2 - 5; z += 9) {
    const girder = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.35), steelMat);
    girder.position.z = z;
    canopy.add(girder);
  }

  // Soft Airport Downlights
  for (let x = -width / 4; x <= width / 4; x += width / 4) {
    for (let z = -depth / 4; z <= depth / 4; z += depth / 4) {
      const downlight = new THREE.PointLight(0xf8fafc, 1.2, 14);
      downlight.position.set(x, -0.4, z);
      canopy.add(downlight);
    }
  }

  scene.add(canopy);
}

function createAirportGateLounge(
  scene: THREE.Scene,
  x: number,
  z: number,
  gateCode: string,
  _isFacingEast: boolean
) {
  const gate = new THREE.Group();
  gate.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0.9
  });

  // Elevated Boarding Mezzanine Balcony
  const mezzanine = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 14), wallMat);
  mezzanine.position.set(0, 3.8, 0);
  mezzanine.castShadow = true;
  mezzanine.receiveShadow = true;
  gate.add(mezzanine);

  // Glass Curtain Wall
  const glassWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6.5, 14), glassMat);
  glassWall.position.set(4.2, 3.25, 0);
  gate.add(glassWall);

  // Illuminated Gate Stencil Sign
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256;
  signCanvas.height = 64;
  const sCtx = signCanvas.getContext('2d')!;
  sCtx.fillStyle = '#0f172a';
  sCtx.fillRect(0, 0, 256, 64);
  sCtx.fillStyle = '#38bdf8';
  sCtx.font = 'bold 30px sans-serif';
  sCtx.fillText(gateCode, 24, 44);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.8, 3.2),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  sign.position.set(0, 5.2, 0);
  gate.add(sign);

  scene.add(gate);
}

function createLuggageCarousel(scene: THREE.Scene, x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

  // Chrome Guard Rails
  const base = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.65, 3.2), chromeMat);
  base.position.y = 0.32;
  base.castShadow = true;
  group.add(base);

  // Moving Rubber Slat Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.1, 2.6), rubberMat);
  belt.position.y = 0.68;
  group.add(belt);

  // Suitcases on Belt (Cover)
  const colors = [0xdc2626, 0x2563eb, 0x16a34a, 0x4b5563];
  [-2.2, -0.8, 0.8, 2.2].forEach((cx, idx) => {
    const caseMat = new THREE.MeshStandardMaterial({ color: colors[idx % colors.length], roughness: 0.5 });
    const luggage = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.85), caseMat);
    luggage.position.set(cx, 0.9, 0);
    luggage.castShadow = true;
    group.add(luggage);
  });

  scene.add(group);
}

function createFlightInformationBoard(scene: THREE.Scene, x: number, z: number) {
  const board = new THREE.Group();
  board.position.set(x, 4.8, z);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('DEPARTURES / DEPARTS', 20, 32);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '16px monospace';
  ctx.fillText('AF 409  PARIS CDG    ON TIME  GATE A12', 20, 68);
  ctx.fillText('DL 812  NEW YORK JFK ON TIME  GATE B08', 20, 96);

  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.2, 0.25),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  board.add(mesh);

  scene.add(board);
}

function createAirportDutyFreeShop(scene: THREE.Scene, x: number, z: number) {
  const shop = new THREE.Group();
  shop.position.set(x, 0, z);

  const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const displayCase = new THREE.Mesh(new THREE.BoxGeometry(14, 2.4, 2.2), mat);
  displayCase.position.y = 1.2;
  displayCase.castShadow = true;
  shop.add(displayCase);

  scene.add(shop);
}

function createAirportSecurityCheck(scene: THREE.Scene, x: number, z: number) {
  const arch = new THREE.Group();
  arch.position.set(x, 0, z);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

  // Arch Legs
  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.8), metalMat);
  leg1.position.set(-0.8, 1.2, 0);
  arch.add(leg1);

  const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.8), metalMat);
  leg2.position.set(0.8, 1.2, 0);
  arch.add(leg2);

  // Arch Top Bar with Green Scanner Light
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.8), metalMat);
  top.position.set(0, 2.35, 0);
  arch.add(top);

  const greenLight = new THREE.PointLight(0x22c55e, 1.2, 4);
  greenLight.position.set(0, 2.2, 0);
  arch.add(greenLight);

  scene.add(arch);
}

function createTerminalBenches(scene: THREE.Scene, x: number, z: number) {
  const bench = new THREE.Group();
  bench.position.set(x, 0, z);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.85), chromeMat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  bench.add(seat);

  scene.add(bench);
}

function createRomanSwimmingPool(scene: THREE.Scene, x: number, z: number, w: number, d: number) {
  const pool = new THREE.Group();
  pool.position.set(x, 0, z);

  // White Marble Coping Rim
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.2, d + 1.2), rimMat);
  rim.position.y = 0.1;
  rim.receiveShadow = true;
  pool.add(rim);

  // Turquoise Water Surface
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.05,
    metalness: 0.3,
    transparent: true,
    opacity: 0.82
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(w, d), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.12;
  pool.add(water);

  // Cabana Sun Loungers along Pool Deck
  [-w / 3, 0, w / 3].forEach((lx) => {
    const loungerMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 });
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.2), loungerMat);
    l1.position.set(lx, 0.25, -d / 2 - 1.8);
    l1.castShadow = true;
    pool.add(l1);

    const l2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.2), loungerMat);
    l2.position.set(lx, 0.25, d / 2 + 1.8);
    l2.castShadow = true;
    pool.add(l2);
  });

  scene.add(pool);
}

function createVillaMansion(
  scene: THREE.Scene,
  x: number,
  z: number,
  _title: string,
  _isFacingSouth: boolean
) {
  const villa = new THREE.Group();
  villa.position.set(x, 0, z);

  const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.8
  });

  // Main Stucco Villa Block
  const block = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 9), stuccoMat);
  block.position.y = 2.75;
  block.castShadow = true;
  block.receiveShadow = true;
  villa.add(block);

  // Terracotta Tile Hip Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(17, 2.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 6.9, 0);
  roof.castShadow = true;
  villa.add(roof);

  // Second Floor Sniper Balcony
  const balc = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.25, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
  );
  balc.position.set(0, 3.8, 4.6);
  villa.add(balc);

  // Glass French Doors
  const doors = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.1), glassMat);
  doors.position.set(0, 4.9, 4.5);
  villa.add(doors);

  scene.add(villa);
}

function createVillaColonnade(scene: THREE.Scene, x: number, z: number, length: number) {
  const colGroup = new THREE.Group();
  colGroup.position.set(x, 0, z);

  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });

  // Marble Pillars
  for (let pz = -length / 2 + 2; pz <= length / 2 - 2; pz += 4.5) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.2, 16), marbleMat);
    pillar.position.set(0, 2.1, pz);
    pillar.castShadow = true;
    colGroup.add(pillar);
  }

  // Roof Beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, length), marbleMat);
  beam.position.y = 4.4;
  beam.castShadow = true;
  colGroup.add(beam);

  scene.add(colGroup);
}

function createVillaGarage(scene: THREE.Scene, x: number, z: number) {
  const garage = new THREE.Group();
  garage.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

  // Garage building shell
  const b = new THREE.Mesh(new THREE.BoxGeometry(8, 4.2, 16), wallMat);
  b.position.y = 2.1;
  b.castShadow = true;
  garage.add(b);

  // Twin Roll-up Doors
  const door1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 5.2), doorMat);
  door1.position.set(-4.05, 1.4, -4);
  garage.add(door1);

  const door2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 5.2), doorMat);
  door2.position.set(-4.05, 1.4, 4);
  garage.add(door2);

  scene.add(garage);
}

function createPalmTreePlanter(scene: THREE.Scene, x: number, z: number) {
  const planter = new THREE.Group();
  planter.position.set(x, 0, z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.7 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 0.9, 12), stoneMat);
  pot.position.y = 0.45;
  pot.castShadow = true;
  planter.add(pot);

  // Palm Trunk
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 4.2, 8), woodMat);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  planter.add(trunk);

  // Palm Fronds (Canopy)
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 4), leafMat);
    leaf.rotation.z = 1.1;
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.position.set(0, 4.6, 0);
    leaf.castShadow = true;
    planter.add(leaf);
  }

  scene.add(planter);
}

function createJerseyBarrier(scene: THREE.Scene, x: number, y: number, z: number) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.75 });
  const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.05, 2.8), mat);
  barrier.position.set(x, y + 0.52, z);
  barrier.castShadow = true;
  barrier.receiveShadow = true;
  scene.add(barrier);
}

function createStreetlamp(scene: THREE.Scene, x: number, z: number) {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.2 });

  // Post
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.5, 8), metalMat);
  pole.position.y = 2.75;
  pole.castShadow = true;
  lamp.add(pole);

  // Arm & Light Fixture
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.6), metalMat);
  head.position.set(0, 5.5, 0.25);
  lamp.add(head);

  // Warm Pool of Light
  const light = new THREE.PointLight(0xfef08a, 1.8, 12);
  light.position.set(0, 5.2, 0.25);
  lamp.add(light);

  scene.add(lamp);
}

function createPicketFence(scene: THREE.Scene, x: number, z: number, length: number, dir: 'ew' | 'ns') {
  const fence = new THREE.Group();
  fence.position.set(x, 0, z);

  const mat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
  const w = dir === 'ew' ? length : 0.15;
  const d = dir === 'ew' ? 0.15 : length;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), mat);
  mesh.position.y = 0.6;
  mesh.castShadow = true;
  fence.add(mesh);

  scene.add(fence);
}

function createPortCraneTower(scene: THREE.Scene, x: number, z: number) {
  const crane = new THREE.Group();
  crane.position.set(x, 0, z);

  const mat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.3 });
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 14, 8), mat);
  leg.position.y = 7;
  leg.castShadow = true;
  crane.add(leg);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 0.5), mat);
  arm.position.set(0, 14, 0);
  crane.add(arm);

  scene.add(crane);
}

function createSandbagBunker(scene: THREE.Scene, x: number, z: number) {
  const bunker = new THREE.Group();
  bunker.position.set(x, 0, z);

  const bagMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.95 });
  const bags = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 1.2), bagMat);
  bags.position.y = 0.5;
  bags.castShadow = true;
  bunker.add(bags);

  scene.add(bunker);
}

function createSurroundingEnvironment(scene: THREE.Scene, config: MapConfig) {
  const pGroup = new THREE.Group();
  const halfW = config.size.width / 2 + 6;
  const halfD = config.size.depth / 2 + 6;

  // Perimeter wall blocks
  const wallMat = new THREE.MeshStandardMaterial({
    color: config.theme === 'desert' ? 0x78350f : 0x334155,
    roughness: 0.9
  });

  const h = 4.5;
  // North Wall
  const nW = new THREE.Mesh(new THREE.BoxGeometry(config.size.width + 16, h, 1.5), wallMat);
  nW.position.set(0, h / 2, -halfD);
  pGroup.add(nW);

  // South Wall
  const sW = new THREE.Mesh(new THREE.BoxGeometry(config.size.width + 16, h, 1.5), wallMat);
  sW.position.set(0, h / 2, halfD);
  pGroup.add(sW);

  // West Wall
  const wW = new THREE.Mesh(new THREE.BoxGeometry(1.5, h, config.size.depth + 16), wallMat);
  wW.position.set(-halfW, h / 2, 0);
  pGroup.add(wW);

  // East Wall
  const eW = new THREE.Mesh(new THREE.BoxGeometry(1.5, h, config.size.depth + 16), wallMat);
  eW.position.set(halfW, h / 2, 0);
  pGroup.add(eW);

  scene.add(pGroup);
}

function createDominationFlagVisual(
  scene: THREE.Scene,
  flag: DominationFlag
): { pole: THREE.Mesh; cloth: THREE.Mesh; ring: THREE.Mesh } {
  const group = new THREE.Group();
  group.position.set(...flag.position);

  // Metal Pole
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 12), poleMat);
  pole.position.y = 2.1;
  pole.castShadow = true;
  group.add(pole);

  // Fabric Flag
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    side: THREE.DoubleSide
  });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85), clothMat);
  cloth.position.set(0.72, 3.65, 0);
  group.add(cloth);

  // Capture Zone Ring
  const ringGeo = new THREE.RingGeometry(flag.radius - 0.2, flag.radius, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  scene.add(group);
  return { pole, cloth, ring };
}
