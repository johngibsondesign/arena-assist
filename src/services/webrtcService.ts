import { supabaseService } from './supabaseService';

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private currentRoomId: string | null = null;
  private isHost: boolean = false;
  private signalingChannel: any = null;
  private autoJoinEnabled: boolean = true;

  // Device management
  public availableDevices: MediaDevice[] = [];
  public selectedAudioInputId: string = '';
  public selectedAudioOutputId: string = '';

  // Callbacks
  public onConnectionStateChange: ((connected: boolean, roomId?: string) => void) | null = null;
  public onParticipantUpdate: ((participants: any[]) => void) | null = null;
  public onDevicesChanged: ((devices: MediaDevice[]) => void) | null = null;

  constructor() {
    console.log('WebRTC Service initialized');
  }

  // Get device lists for UI
  get audioInputDevices(): MediaDevice[] {
    return this.availableDevices.filter(d => d.kind === 'audioinput');
  }

  get audioOutputDevices(): MediaDevice[] {
    return this.availableDevices.filter(d => d.kind === 'audiooutput');
  }

  private getDeviceTypeLabel(kind: string): string {
    switch (kind) {
      case 'audioinput': return 'Microphone';
      case 'audiooutput': return 'Speaker';
      default: return 'Unknown';
    }
  }

  // Request permissions for media devices
  private async requestDevicePermissions(): Promise<void> {
    try {
      console.log('Requesting device permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      
      // Stop the stream immediately since we just needed permissions
      stream.getTracks().forEach(track => track.stop());
      console.log('Device permissions granted');
    } catch (error) {
      console.error('Failed to get device permissions:', error);
      throw error;
    }
  }

  // Enumerate available media devices
  async enumerateDevices(): Promise<MediaDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Raw devices from browser:', devices);
      
      // Process devices with better filtering
      this.availableDevices = devices
        .filter(device => {
          // Include all devices that have an ID and are not generic defaults
          return device.deviceId && 
                 device.deviceId !== 'default' && 
                 device.deviceId !== 'communications' &&
                 device.deviceId !== '' &&
                 (device.kind === 'audioinput' || device.kind === 'audiooutput'); // Only audio devices
        })
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `${this.getDeviceTypeLabel(device.kind)} (${device.deviceId.slice(0, 8)})`,
          kind: device.kind as 'audioinput' | 'audiooutput',
        }));

      console.log('Filtered devices:', this.availableDevices);

      // If we don't have device labels (no permissions), request them
      const hasLabels = this.availableDevices.some(d => d.label && !d.label.includes('('));
      if (!hasLabels && this.availableDevices.length > 0) {
        console.log('No device labels found, requesting permissions...');
        try {
          await this.requestDevicePermissions();
          
          // Re-enumerate after getting permissions
          const retryDevices = await navigator.mediaDevices.enumerateDevices();
          console.log('Devices after permission request:', retryDevices);
          
          this.availableDevices = retryDevices
            .filter(device => {
              return device.deviceId && 
                     device.deviceId !== 'default' && 
                     device.deviceId !== 'communications' &&
                     device.deviceId !== '' &&
                     (device.kind === 'audioinput' || device.kind === 'audiooutput');
            })
            .map(device => ({
              deviceId: device.deviceId,
              label: device.label || `${this.getDeviceTypeLabel(device.kind)} (${device.deviceId.slice(0, 8)})`,
              kind: device.kind as 'audioinput' | 'audiooutput',
            }));
          
          console.log('Devices after permission retry:', this.availableDevices);
        } catch (permissionError) {
          console.warn('Could not get device permissions:', permissionError);
        }
      }

      // Set default devices if not selected
      if (!this.selectedAudioInputId && this.availableDevices.some(d => d.kind === 'audioinput')) {
        const audioInput = this.availableDevices.find(d => d.kind === 'audioinput');
        this.selectedAudioInputId = audioInput?.deviceId || '';
        console.log('Selected default audio input:', audioInput);
      }
      
      if (!this.selectedAudioOutputId && this.availableDevices.some(d => d.kind === 'audiooutput')) {
        const audioOutput = this.availableDevices.find(d => d.kind === 'audiooutput');
        this.selectedAudioOutputId = audioOutput?.deviceId || '';
        console.log('Selected default audio output:', audioOutput);
      }

      // Always trigger the callback, even if devices list is empty
      console.log('Notifying UI of device changes...');
      if (this.onDevicesChanged) {
        this.onDevicesChanged([...this.availableDevices]); // Create new array to ensure React sees the change
      }

      console.log('Final available devices:', this.availableDevices);
      return [...this.availableDevices];
    } catch (error) {
      console.error('Error enumerating devices:', error);
      
      // Still notify UI even on error
      if (this.onDevicesChanged) {
        this.onDevicesChanged([]);
      }
      return [];
    }
  }

  // Set audio input device
  async setAudioInputDevice(deviceId: string): Promise<void> {
    console.log('Setting audio input device:', deviceId);
    this.selectedAudioInputId = deviceId;
    
    // If we have an active stream, restart it with the new device
    if (this.localStream) {
      await this.restartLocalStream();
    }
  }

  // Set audio output device  
  async setAudioOutputDevice(deviceId: string): Promise<void> {
    console.log('Setting audio output device:', deviceId);
    this.selectedAudioOutputId = deviceId;
    
    // Note: Setting audio output device programmatically is limited in browsers
    // Most browsers require user interaction to change audio output
  }

  // Get user media with selected devices
  private async getUserMedia(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: this.selectedAudioInputId 
        ? { deviceId: { exact: this.selectedAudioInputId } }
        : true,
    };

    console.log('Getting user media with constraints:', constraints);
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  // Restart local stream with new device settings
  private async restartLocalStream(): Promise<void> {
    console.log('Restarting local stream...');
    
    // Stop existing stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Get new stream
    try {
      this.localStream = await this.getUserMedia();
      
      // Update peer connection if it exists
      if (this.peerConnection && this.localStream) {
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'audio'
        );
        
        if (sender && this.localStream.getAudioTracks()[0]) {
          await sender.replaceTrack(this.localStream.getAudioTracks()[0]);
          console.log('Replaced audio track in peer connection');
        }
      }
    } catch (error) {
      console.error('Failed to restart local stream:', error);
    }
  }

  // Join a voice room
  async joinRoom(roomId: string = `room_${Date.now()}`, summonerName: string): Promise<void> {
    console.log('Joining voice room:', roomId, 'as', summonerName);
    
    try {
      this.currentRoomId = roomId;
      
      // Get audio stream
      this.localStream = await this.getUserMedia();
      console.log('Got local audio stream:', this.localStream);
      
      // Create peer connection
      await this.createPeerConnection();
      
      // Add local stream to peer connection
      if (this.localStream && this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }
      
      // Set up signaling through Supabase
      await this.setupSignaling(roomId, summonerName);
      
      // Notify connection state change
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(true, roomId);
      }
      
    } catch (error) {
      console.error('Failed to join voice room:', error);
      throw error;
    }
  }

  // Create WebRTC peer connection
  private async createPeerConnection(): Promise<void> {
    console.log('Creating peer connection...');
    
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(config);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      const [remoteStream] = event.streams;
      
      // Create audio element to play remote stream
      const audioElement = document.getElementById('remote-audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.srcObject = remoteStream;
        audioElement.play();
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingChannel) {
        console.log('Sending ICE candidate');
        this.signalingChannel.send({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId: this.currentRoomId
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      
      if (this.onConnectionStateChange) {
        const connected = this.peerConnection?.connectionState === 'connected';
        this.onConnectionStateChange(connected, this.currentRoomId || undefined);
      }
    };
  }

  // Set up signaling channel through Supabase
  private async setupSignaling(roomId: string, summonerName: string): Promise<void> {
    console.log('Setting up signaling for room:', roomId);
    
    // This would integrate with Supabase real-time for signaling
    // For now, we'll simulate the signaling
    this.signalingChannel = {
      send: (data: any) => {
        console.log('Sending signaling data:', data);
        // In a real implementation, this would send through Supabase
      }
    };
  }

  // Auto-join functionality
  setAutoJoinEnabled(enabled: boolean): void {
    this.autoJoinEnabled = enabled;
    console.log('Auto-join voice chat:', enabled ? 'enabled' : 'disabled');
  }

  async autoJoinGameRoom(gameId: string, summonerName: string): Promise<void> {
    if (!this.autoJoinEnabled) {
      console.log('Auto-join disabled, skipping');
      return;
    }

    console.log('Auto-joining voice room for game:', gameId);
    
    try {
      const roomId = `arena_${gameId}`;
      await this.joinRoom(roomId, summonerName);
    } catch (error) {
      console.error('Failed to auto-join voice room:', error);
    }
  }

  // Leave current room
  async leaveRoom(): Promise<void> {
    console.log('Leaving voice room...');
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Clean up signaling
    this.signalingChannel = null;
    this.currentRoomId = null;
    
    // Notify connection state change
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(false);
    }
  }

  // Get current connection state
  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected' || false;
  }

  // Mute/unmute microphone
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  // Set microphone gain/volume
  setMicrophoneGain(gain: number): void {
    console.log('Setting microphone gain:', gain);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        // Apply gain through audio context if available
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(this.localStream!);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = Math.max(0, Math.min(2, gain)); // Clamp between 0 and 2
        source.connect(gainNode);
      });
    }
  }

  // Set speaker volume (note: limited browser support)
  setSpeakerVolume(volume: number): void {
    console.log('Setting speaker volume:', volume);
    // Note: Direct speaker volume control is limited in browsers
    // This would typically be handled by the audio element or Web Audio API
  }

  // Auto-join a room based on game state
  async autoJoinRoom(summonerName: string): Promise<void> {
    if (!this.autoJoinEnabled) {
      console.log('Auto-join disabled, skipping...');
      return;
    }

    // Create room ID based on summoner name and some game identifier
    const roomId = `arena_${summonerName}_${Date.now()}`;
    await this.joinRoom(roomId, summonerName);
  }
}

// Create and export a singleton instance
const webrtcService = new WebRTCService();

export default webrtcService; 