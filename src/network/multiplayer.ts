import { Peer, DataConnection } from 'peerjs';
import { MatchFormat, MapId, Team, WeaponId, CamoId, NetworkPeerInfo, RoomState } from '../types/game';

export interface NetworkPacket {
  type:
    | 'JOIN_REQUEST'
    | 'ROOM_STATE'
    | 'SET_READY'
    | 'SET_TEAM'
    | 'SET_NAME'
    | 'START_MATCH'
    | 'PLAYER_STATE'
    | 'PLAYER_FIRE'
    | 'PLAYER_DAMAGE'
    | 'PICKUP_TAKEN'
    | 'CHAT_MESSAGE';
  payload: any;
  senderId: string;
}

export type NetworkEventCallback = (packet: NetworkPacket) => void;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

export class MultiplayerNetwork {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  public isHost: boolean = false;
  public localPeerId: string = '';
  public localPlayerName: string = 'Soldat';
  public roomCode: string = '';
  public roomState: RoomState | null = null;

  private onEventCallback: NetworkEventCallback | null = null;

  constructor(playerName: string) {
    this.localPlayerName = playerName || 'Opérateur';
    this.localPeerId = 'player_' + Math.random().toString(36).substring(2, 8);
  }

  public setOnEvent(cb: NetworkEventCallback) {
    this.onEventCallback = cb;
  }

  public getLocalTeam(): Team {
    if (!this.roomState) return this.isHost ? 'allies' : 'enemies';
    const me = this.roomState.peers.find((p) => p.id === this.localPeerId);
    return me?.team || (this.isHost ? 'allies' : 'enemies');
  }

  public updatePlayerName(newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    this.localPlayerName = trimmed;

    if (this.roomState) {
      const me = this.roomState.peers.find((p) => p.id === this.localPeerId);
      if (me) {
        me.name = trimmed;
      }
      if (this.isHost) {
        this.broadcastRoomState();
      } else {
        this.sendPacket({
          type: 'SET_NAME',
          senderId: this.localPeerId,
          payload: { name: trimmed }
        });
      }
    }
  }

  // Create a new room as Host
  public async createRoom(
    roomCode: string,
    format: MatchFormat,
    mapId: MapId
  ): Promise<{ success: boolean; error?: string }> {
    this.isHost = true;
    this.roomCode = roomCode.toUpperCase().trim();
    const hostPeerId = `mcod-${this.roomCode}`;
    this.localPeerId = hostPeerId;

    this.roomState = {
      code: this.roomCode,
      format,
      mapId,
      isStarted: false,
      hostId: hostPeerId,
      peers: [
        {
          id: hostPeerId,
          name: this.localPlayerName,
          team: 'allies',
          isHost: true,
          isReady: true,
          selectedWeapon: 'm4a1',
          selectedCamo: 'standard',
          ping: 12
        }
      ]
    };

    // Setup local BroadcastChannel for tab-to-tab instant testing
    this.setupBroadcastChannel();

    return new Promise((resolve) => {
      try {
        this.peer = new Peer(hostPeerId, {
          debug: 1,
          config: {
            iceServers: ICE_SERVERS
          }
        });

        this.peer.on('open', (id) => {
          this.localPeerId = id;
          if (this.roomState) {
            this.roomState.hostId = id;
            if (this.roomState.peers.length > 0) {
              this.roomState.peers[0].id = id;
              this.roomState.peers[0].name = this.localPlayerName;
            }
          }
          resolve({ success: true });
        });

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.warn('PeerJS note:', err.message);
          resolve({ success: true });
        });
      } catch (e: any) {
        resolve({ success: true });
      }
    });
  }

  // Join an existing room via Code
  public async joinRoom(roomCode: string): Promise<{ success: boolean; error?: string }> {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase().trim();
    this.setupBroadcastChannel();

    return new Promise((resolve) => {
      try {
        this.peer = new Peer({
          debug: 1,
          config: {
            iceServers: ICE_SERVERS
          }
        });

        this.peer.on('open', (myId) => {
          this.localPeerId = myId;
          const hostPeerId = `mcod-${this.roomCode}`;
          const conn = this.peer!.connect(hostPeerId, { reliable: true });
          this.hostConnection = conn;

          const onConnected = () => {
            this.sendPacket({
              type: 'JOIN_REQUEST',
              senderId: this.localPeerId,
              payload: {
                id: this.localPeerId,
                name: this.localPlayerName,
                team: 'enemies',
                selectedWeapon: 'm4a1',
                selectedCamo: 'standard'
              }
            });
            resolve({ success: true });
          };

          if (conn.open) {
            onConnected();
          } else {
            conn.on('open', onConnected);
          }

          conn.on('data', (data: any) => {
            this.handlePacket(data as NetworkPacket);
          });

          conn.on('error', (e) => {
            console.warn('Connection warning:', e);
            resolve({ success: true });
          });

          // Fallback timeout in case WebRTC takes time
          setTimeout(() => {
            resolve({ success: true });
          }, 2500);
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error:', err);
          resolve({ success: true });
        });
      } catch {
        resolve({ success: true });
      }
    });
  }

  private setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel(`minicod_room_${this.roomCode}`);
      this.broadcastChannel.onmessage = (event) => {
        const packet = event.data as NetworkPacket;
        if (packet.senderId !== this.localPeerId) {
          this.handlePacket(packet);
        }
      };
    } catch {
      // fallback
    }
  }

  private handleIncomingConnection(conn: DataConnection) {
    const onOpen = () => {
      this.connections.set(conn.peer, conn);

      // Send initial room state
      if (this.roomState) {
        try {
          conn.send({
            type: 'ROOM_STATE',
            senderId: this.localPeerId,
            payload: this.roomState
          });

          // If game already started, catch up the joining player immediately
          if (this.roomState.isStarted) {
            conn.send({
              type: 'START_MATCH',
              senderId: this.localPeerId,
              payload: {
                mapId: this.roomState.mapId,
                format: this.roomState.format
              }
            });
          }
        } catch (e) {
          console.warn('Send error on incoming connection:', e);
        }
      }
    };

    if (conn.open) {
      onOpen();
    } else {
      conn.on('open', onOpen);
    }

    conn.on('data', (data: any) => {
      if (!this.connections.has(conn.peer)) {
        this.connections.set(conn.peer, conn);
      }
      this.handlePacket(data as NetworkPacket);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.roomState) {
        this.roomState.peers = this.roomState.peers.filter((p) => p.id !== conn.peer);
        this.broadcastRoomState();
      }
    });

    conn.on('error', (err) => {
      console.warn('Connection error with peer:', conn.peer, err);
    });
  }

  private handlePacket(packet: NetworkPacket) {
    if (this.isHost) {
      if (packet.type === 'JOIN_REQUEST') {
        if (this.roomState) {
          const peerId = packet.payload.id || packet.senderId;
          const newPeer: NetworkPeerInfo = {
            id: peerId,
            name: packet.payload.name || 'Soldat',
            team: this.roomState.format === 'teams' ? 'enemies' : 'allies',
            isHost: false,
            isReady: false,
            selectedWeapon: packet.payload.selectedWeapon || 'm4a1',
            selectedCamo: packet.payload.selectedCamo || 'standard',
            ping: 15
          };

          const existingIndex = this.roomState.peers.findIndex((p) => p.id === peerId);
          if (existingIndex >= 0) {
            this.roomState.peers[existingIndex] = {
              ...this.roomState.peers[existingIndex],
              ...newPeer
            };
          } else {
            this.roomState.peers.push(newPeer);
          }
          this.broadcastRoomState();
        }
      } else if (packet.type === 'SET_NAME') {
        if (this.roomState) {
          const p = this.roomState.peers.find((item) => item.id === packet.senderId);
          if (p) {
            p.name = packet.payload.name;
            this.broadcastRoomState();
          }
        }
      } else if (packet.type === 'SET_READY') {
        if (this.roomState) {
          const p = this.roomState.peers.find((item) => item.id === packet.senderId);
          if (p) {
            p.isReady = packet.payload.isReady;
            this.broadcastRoomState();
          }
        }
      } else if (packet.type === 'SET_TEAM') {
        if (this.roomState) {
          const p = this.roomState.peers.find((item) => item.id === packet.senderId);
          if (p) {
            p.team = packet.payload.team;
            this.broadcastRoomState();
          }
        }
      }
    }

    if (packet.type === 'ROOM_STATE') {
      this.roomState = packet.payload;
    }

    if (this.onEventCallback) {
      this.onEventCallback(packet);
    }

    // Relay to other peers if Host
    if (this.isHost && packet.type !== 'JOIN_REQUEST') {
      this.relayToOthers(packet, packet.senderId);
    }
  }

  public sendPacket(packet: NetworkPacket) {
    // 1. PeerJS WebRTC
    if (this.isHost) {
      this.connections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(packet);
          } catch {
            // ignore
          }
        }
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(packet);
      } catch {
        // ignore
      }
    }

    // 2. BroadcastChannel (for testing in multiple tabs on same machine)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch {
        // ignore
      }
    }
  }

  private relayToOthers(packet: NetworkPacket, ignoreId: string) {
    this.connections.forEach((conn, id) => {
      if (id !== ignoreId && conn.open) {
        try {
          conn.send(packet);
        } catch {
          // ignore
        }
      }
    });
  }

  public broadcastRoomState() {
    if (!this.roomState) return;
    this.sendPacket({
      type: 'ROOM_STATE',
      senderId: this.localPeerId,
      payload: this.roomState
    });
  }

  public startGame() {
    if (!this.isHost || !this.roomState) return;
    this.roomState.isStarted = true;
    this.sendPacket({
      type: 'START_MATCH',
      senderId: this.localPeerId,
      payload: {
        mapId: this.roomState.mapId,
        format: this.roomState.format
      }
    });
  }

  public setReady(isReady: boolean) {
    this.sendPacket({
      type: 'SET_READY',
      senderId: this.localPeerId,
      payload: { isReady }
    });
  }

  public setTeam(team: Team) {
    this.sendPacket({
      type: 'SET_TEAM',
      senderId: this.localPeerId,
      payload: { team }
    });
  }

  public sendPlayerState(state: {
    pos: [number, number, number];
    rot: [number, number];
    weapon: WeaponId;
    isAiming: boolean;
    isSprinting: boolean;
    isFiring: boolean;
  }) {
    this.sendPacket({
      type: 'PLAYER_STATE',
      senderId: this.localPeerId,
      payload: {
        ...state,
        name: this.localPlayerName,
        team: this.getLocalTeam()
      }
    });
  }

  public sendPlayerFire(fireData: {
    origin: [number, number, number];
    direction: [number, number, number];
    weapon: WeaponId;
  }) {
    this.sendPacket({
      type: 'PLAYER_FIRE',
      senderId: this.localPeerId,
      payload: fireData
    });
  }

  public sendPlayerDamage(damageData: {
    targetId: string;
    damage: number;
    isHeadshot: boolean;
    weapon: WeaponId;
  }) {
    this.sendPacket({
      type: 'PLAYER_DAMAGE',
      senderId: this.localPeerId,
      payload: damageData
    });
  }

  public sendPickupTaken(pickupId: string, weaponId: WeaponId | 'ammo_crate') {
    this.sendPacket({
      type: 'PICKUP_TAKEN',
      senderId: this.localPeerId,
      payload: { pickupId, weaponId }
    });
  }

  public disconnect() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.hostConnection = null;
    this.roomState = null;
  }
}
