import { MapId, DominationFlag, WeaponPickupDef } from '../../types/game';

export interface BoundingBox3D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
}

export interface SpawnPoint {
  position: [number, number, number];
  rotationY: number;
}

export interface MapConfig {
  id: MapId;
  name: string;
  subtitle: string;
  size: { width: number; depth: number };
  theme: 'urban' | 'industrial' | 'desert' | 'airport' | 'luxury';
  skyColor: number;
  horizonColor: number;
  fogColor: number;
  groundColor: number;
  sunPosition: [number, number, number];
  alliesSpawns: SpawnPoint[];
  enemiesSpawns: SpawnPoint[];
  dominationFlags: DominationFlag[];
  weaponPickups: WeaponPickupDef[];
  collisionBoxes: BoundingBox3D[];
}

export const MAPS: Record<MapId, MapConfig> = {
  nuketown: {
    id: 'nuketown',
    name: 'Nuketown 2025',
    subtitle: 'Cul-de-sac d\'essai militaire à symétrie parfaite : Maison Verte vs Maison Jaune avec bus central',
    size: { width: 64, depth: 44 },
    theme: 'urban',
    skyColor: 0x4a90e2,
    horizonColor: 0x93c5fd,
    fogColor: 0xc8ddf5,
    groundColor: 0x2d3748,
    sunPosition: [0, 48, 30], // Centered sun angle for identical lighting on both teams
    alliesSpawns: [
      { position: [-25, 1.5, 0], rotationY: Math.PI / 2 },
      { position: [-24, 1.5, -8], rotationY: Math.PI / 2 },
      { position: [-24, 1.5, 8], rotationY: Math.PI / 2 },
      { position: [-26, 1.5, -4], rotationY: Math.PI / 2 },
      { position: [-26, 1.5, 4], rotationY: Math.PI / 2 }
    ],
    enemiesSpawns: [
      { position: [25, 1.5, 0], rotationY: -Math.PI / 2 },
      { position: [24, 1.5, -8], rotationY: -Math.PI / 2 },
      { position: [24, 1.5, 8], rotationY: -Math.PI / 2 },
      { position: [26, 1.5, -4], rotationY: -Math.PI / 2 },
      { position: [26, 1.5, 4], rotationY: -Math.PI / 2 }
    ],
    dominationFlags: [
      {
        id: 'A',
        name: 'Jardin Maison Verte',
        position: [-18, 0, 0],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'B',
        name: 'Carrefour des Véhicules',
        position: [0, 0, 0],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'C',
        name: 'Jardin Maison Jaune',
        position: [18, 0, 0],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      }
    ],
    weaponPickups: [
      {
        id: 'nuke_sniper_allies',
        weaponId: 'sniper',
        name: 'Barrett .50 (Balcon Vert)',
        position: [-16, 3.8, 0],
        respawnTimeSeconds: 22
      },
      {
        id: 'nuke_sniper_enemies',
        weaponId: 'sniper',
        name: 'Barrett .50 (Balcon Jaune)',
        position: [16, 3.8, 0],
        respawnTimeSeconds: 22
      },
      {
        id: 'nuke_shotgun_mid',
        weaponId: 'shotgun',
        name: 'Trench 12G (Bus Central)',
        position: [0, 0, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'nuke_ammo_west',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions (Jardin Ouest)',
        position: [-22, 0, 12],
        respawnTimeSeconds: 15
      },
      {
        id: 'nuke_ammo_east',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions (Jardin Est)',
        position: [22, 0, -12],
        respawnTimeSeconds: 15
      }
    ],
    collisionBoxes: [
      { minX: -21, maxX: -11, minZ: -9, maxZ: 9, minY: 0, maxY: 7 }, // West Green House
      { minX: 11, maxX: 21, minZ: -9, maxZ: 9, minY: 0, maxY: 7 }, // East Yellow House
      { minX: -2.2, maxX: 2.2, minZ: -10, maxZ: -1, minY: 0, maxY: 3.5 }, // Central Bus
      { minX: -2.2, maxX: 2.2, minZ: 1, maxZ: 10, minY: 0, maxY: 3.5 }, // Central Truck
      { minX: -22, maxX: -10, minZ: -18, maxZ: -13, minY: 0, maxY: 3 }, // West Garage
      { minX: 10, maxX: 22, minZ: 13, maxZ: 18, minY: 0, maxY: 3 } // East Garage
    ]
  },

  shipment: {
    id: 'shipment',
    name: 'Shipment 2025',
    subtitle: 'Arène portuaire ultra-nerveuse à 4 quadrants symétriques et couloirs de conteneurs croisés',
    size: { width: 48, depth: 48 },
    theme: 'industrial',
    skyColor: 0x1e293b,
    horizonColor: 0x334155,
    fogColor: 0x0f172a,
    groundColor: 0x1f2937,
    sunPosition: [25, 45, 25],
    alliesSpawns: [
      { position: [0, 1.5, 20], rotationY: Math.PI },
      { position: [-8, 1.5, 19], rotationY: Math.PI },
      { position: [8, 1.5, 19], rotationY: Math.PI },
      { position: [-14, 1.5, 18], rotationY: Math.PI },
      { position: [14, 1.5, 18], rotationY: Math.PI }
    ],
    enemiesSpawns: [
      { position: [0, 1.5, -20], rotationY: 0 },
      { position: [-8, 1.5, -19], rotationY: 0 },
      { position: [8, 1.5, -19], rotationY: 0 },
      { position: [-14, 1.5, -18], rotationY: 0 },
      { position: [14, 1.5, -18], rotationY: 0 }
    ],
    dominationFlags: [
      {
        id: 'A',
        name: 'Docks Nord',
        position: [0, 0, -14],
        radius: 3.8,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'B',
        name: 'Croisement Central',
        position: [0, 0, 0],
        radius: 3.8,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'C',
        name: 'Docks Sud',
        position: [0, 0, 14],
        radius: 3.8,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      }
    ],
    weaponPickups: [
      {
        id: 'ship_shotgun_mid',
        weaponId: 'shotgun',
        name: 'Trench 12G (Centre Port)',
        position: [0, 0, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'ship_mp5_west',
        weaponId: 'mp5',
        name: 'MP5 SMG (Passerelle Ouest)',
        position: [-16, 2.9, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'ship_mp5_east',
        weaponId: 'mp5',
        name: 'MP5 SMG (Passerelle Est)',
        position: [16, 2.9, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'ship_ammo_north',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Nord',
        position: [0, 0, -17],
        respawnTimeSeconds: 15
      },
      {
        id: 'ship_ammo_south',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Sud',
        position: [0, 0, 17],
        respawnTimeSeconds: 15
      }
    ],
    collisionBoxes: [
      { minX: -16, maxX: -7, minZ: -16, maxZ: -7, minY: 0, maxY: 5.6 }, // NW Stacks
      { minX: 7, maxX: 16, minZ: -16, maxZ: -7, minY: 0, maxY: 5.6 }, // NE Stacks
      { minX: -16, maxX: -7, minZ: 7, maxZ: 16, minY: 0, maxY: 5.6 }, // SW Stacks
      { minX: 7, maxX: 16, minZ: 7, maxZ: 16, minY: 0, maxY: 5.6 }, // SE Stacks
      { minX: -4, maxX: 4, minZ: -5, maxZ: -2, minY: 0, maxY: 2.8 }, // Mid-North Cross container
      { minX: -4, maxX: 4, minZ: 2, maxZ: 5, minY: 0, maxY: 2.8 } // Mid-South Cross container
    ]
  },

  rust: {
    id: 'rust',
    name: 'Rust Refinery',
    subtitle: 'Raffinerie pétrolière ensablée avec tour centrale à 3 étages et 4 silos d\'angle symétriques',
    size: { width: 56, depth: 56 },
    theme: 'desert',
    skyColor: 0xd97706,
    horizonColor: 0xfde68a,
    fogColor: 0xfbbf24,
    groundColor: 0x92400e,
    sunPosition: [0, 50, 30],
    alliesSpawns: [
      { position: [0, 1.5, 22], rotationY: Math.PI },
      { position: [-9, 1.5, 21], rotationY: Math.PI },
      { position: [9, 1.5, 21], rotationY: Math.PI },
      { position: [-16, 1.5, 19], rotationY: Math.PI },
      { position: [16, 1.5, 19], rotationY: Math.PI }
    ],
    enemiesSpawns: [
      { position: [0, 1.5, -22], rotationY: 0 },
      { position: [-9, 1.5, -21], rotationY: 0 },
      { position: [9, 1.5, -21], rotationY: 0 },
      { position: [-16, 1.5, -19], rotationY: 0 },
      { position: [16, 1.5, -19], rotationY: 0 }
    ],
    dominationFlags: [
      {
        id: 'A',
        name: 'Silos Nord',
        position: [0, 0, -16],
        radius: 3.8,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'B',
        name: 'Plateforme Tour',
        position: [0, 0, 0],
        radius: 4.2,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'C',
        name: 'Silos Sud',
        position: [0, 0, 16],
        radius: 3.8,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      }
    ],
    weaponPickups: [
      {
        id: 'rust_sniper_tower',
        weaponId: 'sniper',
        name: 'Barrett .50 (Sommet Tour)',
        position: [0, 7.2, 0],
        respawnTimeSeconds: 25
      },
      {
        id: 'rust_shotgun_mid',
        weaponId: 'shotgun',
        name: 'Trench 12G (Sous-sol Tour)',
        position: [0, 0, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'rust_ammo_north',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Nord',
        position: [0, 0, -19],
        respawnTimeSeconds: 15
      },
      {
        id: 'rust_ammo_south',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Sud',
        position: [0, 0, 19],
        respawnTimeSeconds: 15
      }
    ],
    collisionBoxes: [
      { minX: -4, maxX: 4, minZ: -4, maxZ: 4, minY: 0, maxY: 9 }, // Tower Base
      { minX: -17, maxX: -11, minZ: -17, maxZ: -11, minY: 0, maxY: 6 }, // NW Silo
      { minX: 11, maxX: 17, minZ: -17, maxZ: -11, minY: 0, maxY: 6 }, // NE Silo
      { minX: -17, maxX: -11, minZ: 11, maxZ: 17, minY: 0, maxY: 6 }, // SW Silo
      { minX: 11, maxX: 17, minZ: 11, maxZ: 17, minY: 0, maxY: 6 } // SE Silo
    ]
  },

  terminal: {
    id: 'terminal',
    name: 'Terminal 2025',
    subtitle: 'Concourse d\'aéroport international à double hall symétrique : Portes d\'embarquement et carrousels bagages',
    size: { width: 62, depth: 46 },
    theme: 'airport',
    skyColor: 0x38bdf8,
    horizonColor: 0xbae6fd,
    fogColor: 0xe0f2fe,
    groundColor: 0x475569,
    sunPosition: [0, 48, 25],
    alliesSpawns: [
      { position: [-24, 1.5, 0], rotationY: Math.PI / 2 },
      { position: [-23, 1.5, -8], rotationY: Math.PI / 2 },
      { position: [-23, 1.5, 8], rotationY: Math.PI / 2 },
      { position: [-25, 1.5, -4], rotationY: Math.PI / 2 },
      { position: [-25, 1.5, 4], rotationY: Math.PI / 2 }
    ],
    enemiesSpawns: [
      { position: [24, 1.5, 0], rotationY: -Math.PI / 2 },
      { position: [23, 1.5, -8], rotationY: -Math.PI / 2 },
      { position: [23, 1.5, 8], rotationY: -Math.PI / 2 },
      { position: [25, 1.5, -4], rotationY: -Math.PI / 2 },
      { position: [25, 1.5, 4], rotationY: -Math.PI / 2 }
    ],
    dominationFlags: [
      {
        id: 'A',
        name: 'Hall Portes Ouest',
        position: [-17, 0, 0],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'B',
        name: 'Rotonde Centrale',
        position: [0, 0, 0],
        radius: 4.2,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'C',
        name: 'Hall Portes Est',
        position: [17, 0, 0],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      }
    ],
    weaponPickups: [
      {
        id: 'term_sniper_west',
        weaponId: 'sniper',
        name: 'Barrett .50 (Mezzanine Ouest)',
        position: [-19, 3.8, 0],
        respawnTimeSeconds: 22
      },
      {
        id: 'term_sniper_east',
        weaponId: 'sniper',
        name: 'Barrett .50 (Mezzanine Est)',
        position: [19, 3.8, 0],
        respawnTimeSeconds: 22
      },
      {
        id: 'term_shotgun_mid',
        weaponId: 'shotgun',
        name: 'Trench 12G (Carrousel Central)',
        position: [0, 0, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'term_ammo_north',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Duty-Free',
        position: [0, 0, -15],
        respawnTimeSeconds: 15
      },
      {
        id: 'term_ammo_south',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Bagages',
        position: [0, 0, 15],
        respawnTimeSeconds: 15
      }
    ],
    collisionBoxes: [
      { minX: -26, maxX: -20, minZ: -12, maxZ: 12, minY: 0, maxY: 6 }, // West Gate Lounge
      { minX: 20, maxX: 26, minZ: -12, maxZ: 12, minY: 0, maxY: 6 }, // East Gate Lounge
      { minX: -4, maxX: 4, minZ: -3, maxZ: 3, minY: 0, maxY: 1.5 }, // Central Carousel
      { minX: -12, maxX: 12, minZ: -18, maxZ: -12, minY: 0, maxY: 4.5 }, // North Duty-Free Corridor
      { minX: -12, maxX: 12, minZ: 12, maxZ: 18, minY: 0, maxY: 4.5 } // South Baggage Claim
    ]
  },

  raid: {
    id: 'raid',
    name: 'Raid Estate',
    subtitle: 'Villa méditerranéenne de luxe à symétrie parfaite : Piscine romaine centrale et galeries à colonnes',
    size: { width: 66, depth: 48 },
    theme: 'luxury',
    skyColor: 0x0284c7,
    horizonColor: 0x7dd3fc,
    fogColor: 0xdbeafe,
    groundColor: 0x78350f,
    sunPosition: [0, 50, 25],
    alliesSpawns: [
      { position: [0, 1.5, 21], rotationY: Math.PI },
      { position: [-8, 1.5, 20], rotationY: Math.PI },
      { position: [8, 1.5, 20], rotationY: Math.PI },
      { position: [-15, 1.5, 18], rotationY: Math.PI },
      { position: [15, 1.5, 18], rotationY: Math.PI }
    ],
    enemiesSpawns: [
      { position: [0, 1.5, -21], rotationY: 0 },
      { position: [-8, 1.5, -20], rotationY: 0 },
      { position: [8, 1.5, -20], rotationY: 0 },
      { position: [-15, 1.5, -18], rotationY: 0 },
      { position: [15, 1.5, -18], rotationY: 0 }
    ],
    dominationFlags: [
      {
        id: 'A',
        name: 'Terrasse Nord',
        position: [0, 0, -16],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'B',
        name: 'Piscine & Cabana',
        position: [0, 0, 0],
        radius: 4.2,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      },
      {
        id: 'C',
        name: 'Terrasse Sud',
        position: [0, 0, 16],
        radius: 4.0,
        owner: null,
        captureProgress: 0,
        capturingTeam: null
      }
    ],
    weaponPickups: [
      {
        id: 'raid_sniper_north',
        weaponId: 'sniper',
        name: 'Barrett .50 (Balcon Nord)',
        position: [0, 3.8, -17],
        respawnTimeSeconds: 22
      },
      {
        id: 'raid_sniper_south',
        weaponId: 'sniper',
        name: 'Barrett .50 (Balcon Sud)',
        position: [0, 3.8, 17],
        respawnTimeSeconds: 22
      },
      {
        id: 'raid_shotgun_pool',
        weaponId: 'shotgun',
        name: 'Trench 12G (Bord Piscine)',
        position: [0, 0, 0],
        respawnTimeSeconds: 20
      },
      {
        id: 'raid_ammo_west',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Galerie',
        position: [-18, 0, 0],
        respawnTimeSeconds: 15
      },
      {
        id: 'raid_ammo_east',
        weaponId: 'ammo_crate',
        name: 'Caisse Munitions Garage',
        position: [18, 0, 0],
        respawnTimeSeconds: 15
      }
    ],
    collisionBoxes: [
      { minX: -14, maxX: 14, minZ: -23, maxZ: -14, minY: 0, maxY: 6 }, // North Villa Wing
      { minX: -14, maxX: 14, minZ: 14, maxZ: 23, minY: 0, maxY: 6 }, // South Guest Wing
      { minX: -24, maxX: -16, minZ: -10, maxZ: 10, minY: 0, maxY: 4.5 }, // West Colonnade
      { minX: 16, maxX: 24, minZ: -10, maxZ: 10, minY: 0, maxY: 4.5 } // East Sports Garage
    ]
  }
};
