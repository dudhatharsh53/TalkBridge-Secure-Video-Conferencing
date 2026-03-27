import { Component, ElementRef, OnInit, OnDestroy, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { AuthService } from '../../services/auth.service';
import { MeetingService } from '../../services/meeting.service';
import { ChatService } from '../../services/chat.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-video-call',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="video-page-container" style="display: flex; height: 100vh; background: #0f172a; position: relative; overflow: hidden; font-family: 'Inter', sans-serif;">
      
      <!-- Waiting Screen for Participants -->
      <div *ngIf="accessStatus() === 'waiting' && !isHost" style="position: absolute; inset: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; text-align: center; color: white; padding: 2rem;">
        <div class="spinner" style="margin-bottom: 2rem; border: 4px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
        <h2>Waiting for host approval...</h2>
        <p style="color: #94a3b8; margin-top: 1rem;">The host will let you in shortly.</p>
        <button (click)="endCall()" class="btn-outline" style="margin-top: 2rem; color: white; border-color: #334155;">Cancel and Go Back</button>
      </div>

      <!-- Denied Screen -->
      <div *ngIf="accessStatus() === 'denied'" style="position: absolute; inset: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; text-align: center; color: white; padding: 2rem;">
        <h2 style="color: #ef4444;">Entry Denied</h2>
        <p style="color: #94a3b8; margin-top: 1rem;">The host declined your request to join this meeting.</p>
        <button (click)="endCall()" class="btn-primary" style="margin-top: 2rem;">Go back to Dashboard</button>
      </div>

      <!-- Main Video Area -->
      <div *ngIf="accessStatus() === 'granted' || isHost" style="flex: 1; display: flex; flex-direction: column; position: relative;">
        
        <!-- Join Requests Overlay for Host -->
        <div *ngIf="isHost && joinRequests().length > 0" style="position: absolute; top: 1rem; right: 1rem; z-index: 2000; width: 300px;">
          <div *ngFor="let req of joinRequests()" class="card-request" style="margin-bottom: 0.5rem; background: rgba(255, 255, 255, 0.95); padding: 1rem; border-radius: 1rem; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
            <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.75rem; color: #1e293b;">{{ req.userName }} wants to join</p>
            <div style="display: flex; gap: 0.5rem;">
              <button (click)="acceptParticipant(req.socketId)" class="btn-success" style="flex: 1; background: #3c9948ff; border: none; padding: 0.5rem; border-radius: 0.5rem; color: white; cursor: pointer;">Accept</button>
              <button (click)="rejectParticipant(req.socketId)" class="btn-danger" style="flex: 1; border: none; padding: 0.5rem; border-radius: 0.5rem; color: white; cursor: pointer;">Decline</button>
            </div>
          </div>
        </div>

        <!-- Meeting Info Overlay -->
        <div style="position: absolute; top: 1rem; left: 1rem; z-index: 10; color: white; background: rgba(0,0,0,0.5); padding: 0.5rem 1rem; border-radius: 2rem; backdrop-filter: blur(5px);">
          <h4 style="margin: 0; font-size: 0.9rem;">{{ meetingTitle() }} | {{ roomId }}</h4>
        </div>
        
        <div style="position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 10; color: white; background: rgba(0,0,0,0.5); padding: 0.3rem 0.8rem; border-radius: 1rem;">
           <span style="font-weight: bold; font-family: monospace;">{{ duration() }}</span>
        </div>

        <!-- Video Grid -->
        <div class="video-grid" [class.with-chat]="showChat" style="flex: 1; padding: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; align-content: center; justify-items: center;">
          
          <!-- Local Video Container -->
          <div class="video-item">
            <video #localVideo [hidden]="!videoEnabled" autoplay muted playsinline></video>
            <div *ngIf="!videoEnabled" class="avatar-placeholder" [style.background]="getUserColor(authService.user()?.name)">
              {{ authService.user()?.name?.charAt(0) }}
            </div>
            <div class="participant-name">You ({{ authService.user()?.name }})</div>
          </div>
          
          <!-- Remote Videos -->
          <div *ngFor="let peer of peers" class="video-item">
            <video [id]="peer.peerID" [hidden]="!peer.videoEnabled" autoplay playsinline></video>
            <div *ngIf="!peer.videoEnabled" class="avatar-placeholder" [style.background]="getUserColor(peer.userName)">
              {{ peer.userName?.charAt(0) }}
            </div>
            <div class="participant-name">
              {{ peer.userName }}
              <button *ngIf="isHost" (click)="removeParticipant(peer.peerID)" class="btn-remove-sm" title="Remove participant">✕</button>
            </div>
          </div>
        </div>

        <!-- Controls Bar -->
        <div class="controls-bar">
          <button (click)="toggleAudio()" [class.off]="!audioEnabled" class="control-btn" [title]="audioEnabled ? 'Mute' : 'Unmute'">
            <span>{{ audioEnabled ? '🎤' : '🔇' }}</span>
          </button>
          <button (click)="toggleVideo()" [class.off]="!videoEnabled" class="control-btn" [title]="videoEnabled ? 'OFF Camera' : 'ON Camera'">
             <span>{{ videoEnabled ? '📹' : '📵' }}</span>
          </button>
          <button (click)="toggleScreenShare()" [class.active]="isScreenSharing" class="control-btn" title="Share Screen">
             <span>🖥️</span>
          </button>
           <button (click)="toggleChat()" [class.active]="showChat" class="control-btn" title="Meeting Chat">
             <span>💬</span>
             <span *ngIf="unreadCount() > 0" class="notif-dot"></span>
          </button>
          <button *ngIf="isHost" (click)="endMeeting()" class="control-btn end-mtg-btn" title="End Meeting for All">
             <span>🛑</span>
          </button>
          <button (click)="endCall()" class="control-btn leave-btn" title="Leave Meeting">
             <span>📞</span>
          </button>
        </div>
      </div>

      <!-- Chat Sidebar -->
      <div *ngIf="showChat" class="chat-sidebar" style="width: 350px; background: #1e293b; border-left: 1px solid #334155; display: flex; flex-direction: column;">
        <div style="padding: 1.5rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: white; margin: 0;">In-meeting Chat</h3>
          <button (click)="showChat = false" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.2rem;">✕</button>
        </div>
        
        <div class="chat-messages" #scrollMe style="flex: 1; overflow-y: auto; padding: 1rem;">
          <div *ngFor="let msg of messages" class="msg-bubble" [class.own-msg]="msg.senderId === authService.user()?.id">
            <div class="msg-sender" *ngIf="msg.senderId !== authService.user()?.id">{{ msg.sender }}</div>
            <div class="msg-sender" *ngIf="msg.senderId === authService.user()?.id">You</div>
            <div class="msg-text">{{ msg.text }}</div>
            <div class="msg-time">{{ msg.timestamp | date:'shortTime' }}</div>
          </div>
          <div *ngIf="messages.length === 0" style="text-align: center; color: #64748b; margin-top: 2rem; font-size: 0.9rem;">No messages yet. Say hi!</div>
        </div>
        
        <div style="padding: 1rem; background: #0f172a;">
          <div style="display: flex; gap: 0.5rem; background: #1e293b; border-radius: 1rem; padding: 0.5rem 1rem;">
            <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type something..." style="flex: 1; background: none; border: none; color: white; outline: none;">
            <button (click)="sendMessage()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">➡️</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .video-grid.with-chat { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
      .video-item { position: relative; width: 100%; max-width: 500px; aspect-ratio: 16/9; background: #1e293b; border-radius: 1rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
      video { width: 100%; height: 100%; object-fit: cover; }
      .avatar-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 5rem; font-weight: bold; color: white; }
      .participant-name { position: absolute; bottom: 0.5rem; left: 0.5rem; background: rgba(0,0,0,0.6); color: white; padding: 0.2rem 0.8rem; border-radius: 1rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
      .controls-bar { position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 1rem; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); padding: 0.8rem 2rem; border-radius: 3rem; border: 1px solid rgba(255,255,255,0.1); }
      .control-btn { width: 50px; height: 50px; border-radius: 50%; border: none; background: #334155; color: white; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; position: relative; }
      .control-btn:hover { background: #475569; transform: scale(1.1); }
      .control-btn.off { background: #ef4444; }
      .control-btn.active { background: #3b82f6; }
      .end-mtg-btn { background: #991b1b; }
      .leave-btn { background: #ef4444; }
      .notif-dot { position: absolute; top: 0; right: 0; width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2px solid #0f172a; }
      
      .msg-bubble { margin-bottom: 1rem; max-width: 80%; padding: 0.8rem; border-radius: 1rem; font-size: 0.9rem; }
      .msg-bubble:not(.own-msg) { background: #334155; color: white; border-bottom-left-radius: 0; }
      .own-msg { background: #3b82f6; color: white; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 0; }
      .msg-sender { font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.2rem; font-weight: 600; }
      .msg-time { font-size: 0.65rem; color: rgba(255,255,255,0.5); margin-top: 0.3rem; text-align: right; }
      .btn-remove-sm { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; padding: 0; }
    `]
})
export class VideoCallComponent implements OnInit, OnDestroy {
    @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

    roomId: string = '';
    meetingTitle = signal('Meeting');
    socket!: Socket;
    stream!: MediaStream;
    peers: any[] = [];
    peersRefs: any[] = [];

    // Controls
    audioEnabled = true;
    videoEnabled = true;
    isScreenSharing = false;
    showChat = false;
    unreadCount = signal(0);

    // Permission System
    isHost = false;
    joinRequests = signal<any[]>([]);
    accessStatus = signal<'waiting' | 'granted' | 'denied'>('waiting');

    // Chat
    messages: any[] = [];
    newMessage = '';

    // Timer
    startTime: number = Date.now();
    duration = signal('00:00');
    timerInterval: any;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    public authService = inject(AuthService);
    private meetingService = inject(MeetingService);
    private chatService = inject(ChatService);
    private toastService = inject(ToastService);

    constructor() {
        this.roomId = this.route.snapshot.paramMap.get('id') || '';
    }

    async ngOnInit() {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }

        this.meetingService.getDetails(this.roomId).subscribe({
            next: (mtg) => {
                this.meetingTitle.set(mtg.title);
                this.isHost = mtg.createdBy?._id === this.authService.user().id;

                if (this.isHost) {
                    this.accessStatus.set('granted');
                    this.startMeeting();
                } else {
                    this.initSocketOnly();
                    this.requestJoin();
                }
            },
            error: () => {
                this.toastService.error('Meeting not found');
                this.router.navigate(['/dashboard']);
            }
        });

        // Load chat history
        this.chatService.getMeetingMessages(this.roomId).subscribe(msgs => {
            this.messages = msgs.map((m: any) => ({
                sender: m.sender.name,
                senderId: m.sender._id,
                text: m.message,
                timestamp: m.timestamp
            }));
            setTimeout(() => this.scrollToBottom(), 500);
        });
    }

    async startMeeting() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (this.localVideo) {
                this.localVideo.nativeElement.srcObject = this.stream;
            }
            this.initSocket();
            this.startTimer();
        } catch (err) {
            console.error('Failed to get media devices', err);
            // Re-attempt without audio or video if one fails
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                this.videoEnabled = false;
                this.initSocket();
                this.startTimer();
            } catch (e) {
                this.toastService.error('Could not access media devices');
            }
        }
    }

    initSocketOnly() {
        this.socket = io(environment.socketUrl);

        this.socket.on('access-granted', () => {
            this.accessStatus.set('granted');
            this.startMeeting();
        });

        this.socket.on('access-denied', () => {
            this.accessStatus.set('denied');
        });

        this.socket.on('error-msg', (msg: string) => {
            this.toastService.error(msg);
            this.router.navigate(['/dashboard']);
        });
    }

    requestJoin() {
        this.socket.emit('request-to-join', {
            roomId: this.roomId,
            userId: this.authService.user().id,
            userName: this.authService.user().name
        });
    }

    acceptParticipant(socketId: string) {
        this.socket.emit('accept-participant', { participantSocketId: socketId });
        this.joinRequests.update(prev => prev.filter(r => r.socketId !== socketId));
    }

    rejectParticipant(socketId: string) {
        this.socket.emit('reject-participant', { participantSocketId: socketId });
        this.joinRequests.update(prev => prev.filter(r => r.socketId !== socketId));
    }

    removeParticipant(socketId: string) {
        this.socket.emit('remove-participant', { socketId });
    }

    endMeeting() {
        if (confirm('Are you sure you want to end the meeting for everyone?')) {
            this.meetingService.endMeeting(this.roomId).subscribe(() => {
                this.socket.emit('admin-end-meeting', { roomId: this.roomId });
                this.router.navigate(['/dashboard']);
            });
        }
    }

    initSocket() {
        if (!this.socket) {
            this.socket = io(environment.socketUrl);
        }

        this.socket.emit('join-room', {
            roomId: this.roomId,
            userId: this.authService.user().id,
            userName: this.authService.user().name,
            isHost: this.isHost
        });

        this.socket.on('meeting-ended-by-admin', () => {
            this.toastService.info('The host has ended the meeting.');
            this.endCall();
        });

        this.socket.on('removed-from-meeting', () => {
            this.toastService.warning('You have been removed from the meeting.');
            this.endCall();
        });

        if (this.isHost) {
            this.socket.on('participant-request', (data: any) => {
                this.joinRequests.update(prev => [...prev, data]);
            });
        }

        this.socket.on('all-users', (users: any[]) => {
            users.forEach(user => {
                if (this.peers.find(p => p.peerID === user.socketId)) {
                    return;
                }
                const peer = this.createPeer(user.socketId, this.socket.id || '', this.stream, user.userName);
                this.peersRefs.push({
                    peerID: user.socketId,
                    peer,
                    userName: user.userName,
                    videoEnabled: true
                });
                this.peers.push({
                    peerID: user.socketId,
                    userName: user.userName,
                    videoEnabled: true
                });
            });
        });

        this.socket.on('user-joined', (payload: any) => {
            if (this.peers.find(p => p.peerID === payload.socketId)) {
                return;
            }

            if (payload.userName) {
                this.toastService.info(`${payload.userName} joined the meeting`);
            }

            const peer = this.createPeer(
                payload.socketId,
                this.socket.id || '',
                this.stream,
                payload.userName
            );

            this.peersRefs.push({
                peerID: payload.socketId,
                peer,
                userName: payload.userName,
                videoEnabled: true
            });

            this.peers.push({
                peerID: payload.socketId,
                userName: payload.userName,
                videoEnabled: true
            });
        });

        this.socket.on('receiving-offer', (payload: any) => {
            if (this.peers.find(p => p.peerID === payload.callerId)) {
                return;
            }
            const peer = this.addPeer(payload.signal, payload.callerId, this.stream, payload.userName);
            this.peersRefs.push({
                peerID: payload.callerId,
                peer,
                userName: payload.userName,
                videoEnabled: true
            });
            this.peers.push({
                peerID: payload.callerId,
                userName: payload.userName,
                videoEnabled: true
            });
        });

        this.socket.on('receiving-returned-signal', (payload: any) => {
            const item = this.peersRefs.find(p => p.peerID === payload.id);
            if (item) item.peer.signal(payload.signal);
        });

        this.socket.on('user-left', (id: string) => {
            const peerObj = this.peersRefs.find(p => p.peerID === id);
            if (peerObj) peerObj.peer.destroy();
            this.peersRefs = this.peersRefs.filter(p => p.peerID !== id);
            this.peers = this.peers.filter(p => p.peerID !== id);
        });

        this.socket.on('new-message', (msg: any) => {
            this.messages.push(msg);
            if (!this.showChat) this.unreadCount.update(c => c + 1);
            setTimeout(() => this.scrollToBottom(), 100);
        });

        // Listen for video toggle from others (placeholder for more advanced sync)
        this.socket.on('peer-video-toggle', ({ socketId, enabled }: any) => {
            const peer = this.peers.find(p => p.peerID === socketId);
            if (peer) peer.videoEnabled = enabled;
        });
    }

    createPeer(userToSignal: string, callerId: string, stream: MediaStream, userName: string) {
        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', signal => {
            this.socket.emit('sending-offer', { userToSignal, callerId, signal, userName: this.authService.user().name });
        });

        peer.on('stream', stream => {
            setTimeout(() => {
                const video = document.getElementById(userToSignal) as HTMLVideoElement;
                if (video) video.srcObject = stream;
            }, 500);
        });

        return peer;
    }

    addPeer(incomingSignal: any, callerId: string, stream: MediaStream, userName: string) {
        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on('signal', signal => {
            this.socket.emit('returning-signal', { signal, callerId });
        });

        peer.on('stream', stream => {
            const video = document.getElementById(callerId) as HTMLVideoElement;
            if (video) video.srcObject = stream;
        });

        peer.signal(incomingSignal);
        return peer;
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        if (this.stream) this.stream.getAudioTracks().forEach(track => track.enabled = this.audioEnabled);
    }

    toggleVideo() {
        this.videoEnabled = !this.videoEnabled;
        if (this.stream) this.stream.getVideoTracks().forEach(track => track.enabled = this.videoEnabled);
        this.socket.emit('video-toggle', { enabled: this.videoEnabled });
    }

    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                this.peersRefs.forEach(p => {
                    p.peer.replaceTrack(this.stream.getVideoTracks()[0], screenTrack, this.stream);
                });

                screenTrack.onended = () => this.stopScreenShare();
                if (this.localVideo) this.localVideo.nativeElement.srcObject = screenStream;
                this.isScreenSharing = true;
            } else {
                this.stopScreenShare();
            }
        } catch (err) {
            console.error('Error sharing screen', err);
        }
    }

    stopScreenShare() {
        const videoTrack = this.stream.getVideoTracks()[0];
        this.peersRefs.forEach(p => {
            const pTrack = p.peer.streams[0].getVideoTracks()[0];
            p.peer.replaceTrack(pTrack, videoTrack, this.stream);
        });
        if (this.localVideo) this.localVideo.nativeElement.srcObject = this.stream;
        this.isScreenSharing = false;
    }

    toggleChat() {
        this.showChat = !this.showChat;
        if (this.showChat) this.unreadCount.set(0);
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;
        this.socket.emit('send-message', {
            sender: this.authService.user().name,
            senderId: this.authService.user().id,
            text: this.newMessage
        });
        this.newMessage = '';
    }

    getUserColor(name: string = ''): string {
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    endCall() {
        this.router.navigate(['/dashboard']);
    }

    private startTimer() {
        this.timerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');
            this.duration.set(`${mins}:${secs}`);
        }, 1000);
    }

    scrollToBottom(): void {
        try {
            if (this.myScrollContainer) this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    ngOnDestroy() {
        if (this.stream) this.stream.getTracks().forEach(track => track.stop());
        if (this.socket) this.socket.disconnect();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.peersRefs.forEach(p => p.peer.destroy());
    }
}

