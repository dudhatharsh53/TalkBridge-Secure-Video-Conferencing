import { Component, OnInit, signal, inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-dashboard">
      <!-- Sidebar: Recent Chats -->
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button (click)="showSearch = !showSearch" class="btn-new-chat">
            {{ showSearch ? '✕' : '＋ New' }}
          </button>
        </div>

        <!-- Search Area -->
        <div class="search-container" *ngIf="showSearch">
          <input type="text" [(ngModel)]="searchQuery" (input)="searchUsers()" placeholder="Search users...">
          <div class="search-results" *ngIf="searchResults().length > 0">
            <div *ngFor="let u of searchResults()" (click)="startChat(u)" class="search-item">
              <div class="user-avatar" [style.background]="getUserColor(u.name)">{{ u.name.charAt(0) }}</div>
              <div class="user-info">
                <span class="name">{{ u.name }}</span>
                <span class="email">{{ u.email }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-list">
          <div *ngFor="let chat of chattedUsers()" 
               class="chat-item" 
               [class.active]="chat.user._id === targetUserId"
               (click)="selectChat(chat.user._id)">
            <div class="avatar-wrapper">
              <div class="user-avatar" [style.background]="getUserColor(chat.user.name)">
                {{ chat.user.name.charAt(0) }}
              </div>
              <div class="status-indicator" [class.online]="isOnline(chat.user._id)"></div>
            </div>
            <div class="chat-info">
              <div class="chat-info-top">
                <span class="name">{{ chat.user.name }}</span>
                <span class="time">{{ (chat.lastMessageTime || chat.timestamp) | date:'shortTime' }}</span>
              </div>
              <div class="chat-info-bottom">
                <p class="last-msg">{{ chat.lastMessage }}</p>
                <span class="unread-badge" *ngIf="chat.unreadCount > 0">{{ chat.unreadCount }}</span>
              </div>
            </div>
          </div>
          <div *ngIf="chattedUsers().length === 0 && !showSearch" class="empty-sidebar">
            <p>No recent chats</p>
          </div>
        </div>
      </div>

      <!-- Main: Conversation Window -->
      <div class="chat-main" *ngIf="targetUserId; else noChat">
        <div class="main-header">
          <div class="target-user">
            <div class="avatar-wrapper">
              <div class="user-avatar" [style.background]="getUserColor(targetUser()?.name)">
                {{ targetUser()?.name?.charAt(0) }}
              </div>
              <div class="status-indicator" [class.online]="isOnline(targetUserId)"></div>
            </div>
            <div class="user-info">
              <h3>{{ targetUser()?.name }}</h3>
              <span class="status-text">{{ isOnline(targetUserId) ? 'Online' : 'Offline' }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button routerLink="/dashboard" class="btn-icon">🏠</button>
          </div>
        </div>

        <div class="chat-body" #scrollMe>
          <div *ngFor="let msg of messages()" class="msg-wrapper" [class.own-msg]="msg.sender === authService.user()?.id || msg.senderId === authService.user()?.id">
            <div class="msg-sender" *ngIf="msg.sender !== authService.user()?.id && msg.senderId !== authService.user()?.id">
              {{ targetUser()?.name }}
            </div>
            <div class="msg-sender" *ngIf="msg.sender === authService.user()?.id || msg.senderId === authService.user()?.id">
              You
            </div>
            <div class="msg-bubble">
              <div class="msg-text">{{ msg.message }}</div>
              <div class="msg-meta">
                <span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span>
                <span class="msg-status" *ngIf="msg.sender === authService.user()?.id || msg.senderId === authService.user()?.id">
                  <span *ngIf="msg.status === 'seen'">✓✓</span>
                  <span *ngIf="msg.status === 'delivered'">✓✓</span>
                  <span *ngIf="msg.status === 'sent'">✓</span>
                </span>
              </div>
            </div>
          </div>
          <div *ngIf="messages().length === 0" class="empty-chat">
            <p>Start a conversation with {{ targetUser()?.name }}</p>
          </div>
        </div>

        <div class="chat-footer">
          <div class="input-area">
            <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message...">
            <button (click)="sendMessage()" class="btn-send" [disabled]="!newMessage.trim()">
              <span class="send-icon">➤</span>
            </button>
          </div>
        </div>
      </div>

      <ng-template #noChat>
        <div class="no-chat-selected">
          <div class="no-chat-content">
            <div class="icon">💬</div>
            <h3>Your Messages</h3>
            <p>Select a chat or start a new conversation to begin.</p>
            <button (click)="showSearch = true" class="btn-primary">Start New Chat</button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .chat-dashboard { display: flex; height: 100vh; background: #f8fafc; overflow: hidden; }
    
    /* Sidebar */
    .chat-sidebar { width: 350px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .sidebar-header h2 { font-size: 1.5rem; margin: 0; color: #1e293b; }
    .btn-new-chat { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-new-chat:hover { background: #2563eb; }

    .search-container { padding: 0 1.5rem 1rem; position: relative; }
    .search-container input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.8rem; outline: none; background: #f1f5f9; }
    .search-results { position: absolute; top: 100%; left: 1.5rem; right: 1.5rem; background: white; border-radius: 0.8rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 10; border: 1px solid #e2e8f0; max-height: 300px; overflow-y: auto; }
    .search-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; cursor: pointer; transition: 0.2s; }
    .search-item:hover { background: #f8fafc; }
    .search-item .user-info { display: flex; flex-direction: column; }
    .search-item .name { font-weight: 600; font-size: 0.9rem; }
    .search-item .email { font-size: 0.75rem; color: #64748b; }

    .chat-list { flex: 1; overflow-y: auto; }
    .chat-item { display: flex; gap: 1rem; padding: 1rem 1.5rem; cursor: pointer; transition: 0.2s; border-left: 4px solid transparent; }
    .chat-item:hover { background: #f8fafc; }
    .chat-item.active { background: #eff6ff; border-left-color: #3b82f6; }
    
    .avatar-wrapper { position: relative; flex-shrink: 0; }
    .user-avatar { width: 50px; height: 50px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
    .status-indicator { position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; border: 2px solid white; }
    .status-indicator.online { background: #10b981; }

    .chat-info { flex: 1; overflow: hidden; }
    .chat-info-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem; }
    .chat-info-top .name { font-weight: 600; color: #1e293b; }
    .chat-info-top .time { font-size: 0.75rem; color: #94a3b8; }
    .chat-info-bottom { display: flex; justify-content: space-between; align-items: center; }
    .last-msg { font-size: 0.85rem; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .unread-badge { background: #3b82f6; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: bold; }

    /* Main Chat */
    .chat-main { flex: 1; display: flex; flex-direction: column; background: #f1f5f9; }
    .main-header { padding: 1rem 1.5rem; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .main-header .target-user { display: flex; align-items: center; gap: 1rem; }
    .main-header .user-info h3 { margin: 0; font-size: 1.1rem; }
    .main-header .status-text { font-size: 0.75rem; color: #64748b; }
    .btn-icon { background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }

    .chat-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .msg-wrapper { display: flex; flex-direction: column; max-width: 70%; }
    .msg-sender { font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem; margin-left: 0.5rem; font-weight: 600; }
    .own-msg { align-self: flex-end; }
    .own-msg .msg-sender { text-align: right; margin-right: 0.5rem; margin-left: 0; }
    
    .msg-bubble { padding: 0.8rem 1rem; border-radius: 1.2rem; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .own-msg .msg-bubble { background: #3b82f6; color: white; border-bottom-right-radius: 0.2rem; }
    .msg-wrapper:not(.own-msg) .msg-bubble { border-bottom-left-radius: 0.2rem; }
    
    .msg-meta { display: flex; align-items: center; justify-content: flex-end; gap: 0.4rem; margin-top: 0.3rem; }
    .msg-time { font-size: 0.65rem; color: #94a3b8; }
    .own-msg .msg-time { color: rgba(255,255,255,0.7); }
    .msg-status { font-size: 0.7rem; font-weight: bold; }

    .chat-footer { padding: 1.5rem; background: white; border-top: 1px solid #e2e8f0; }
    .input-area { display: flex; gap: 1rem; background: #f8fafc; padding: 0.6rem 1rem; border-radius: 2rem; border: 1px solid #e2e8f0; }
    .input-area input { flex: 1; border: none; background: none; outline: none; font-size: 1rem; color: #1e293b; }
    .btn-send { background: #3b82f6; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-send:hover:not(:disabled) { transform: scale(1.1); background: #2563eb; }
    .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .send-icon { font-size: 1.2rem; transform: rotate(-45deg); margin-left: 3px; }

    .no-chat-selected { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
    .no-chat-content { text-align: center; color: #64748b; }
    .no-chat-content .icon { font-size: 5rem; color: #cbd5e1; margin-bottom: 1.5rem; }
    .btn-primary { background: #3b82f6; color: white; border: none; padding: 0.75rem 2rem; border-radius: 1rem; font-weight: 600; cursor: pointer; margin-top: 1rem; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class PrivateChatComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private chatService = inject(ChatService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  targetUserId = '';
  targetUser = signal<any>(null);
  chattedUsers = signal<any[]>([]);
  onlineUsers = signal<string[]>([]);
  messages = signal<any[]>([]);

  showSearch = false;
  searchQuery = '';
  searchResults = signal<any[]>([]);
  newMessage = '';

  private refreshInterval: any;

  ngOnInit() {
    this.targetUserId = this.route.snapshot.paramMap.get('userId') || '';

    this.loadChatContacts();
    if (this.targetUserId) {
      this.loadMessages();
    }

    // Real-time listeners
    this.chatService.onNewPrivateMessage((data: any) => {
      if (data.senderId === this.targetUserId) {
        this.messages.update(prev => [...prev, {
          sender: data.senderId,
          message: data.message,
          timestamp: new Date(),
          status: 'seen'
        }]);
        this.chatService.markMessagesAsSeen(this.targetUserId).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      }
      this.loadChatContacts();
    });

    this.chatService.onOnlineUsers((users: string[]) => {
      this.onlineUsers.set(users);
    });

    // Register for socket events
    const user = this.authService.user();
    if (user) {
      this.chatService.registerUser(user.id);
    }

    // Periodic refresh of contacts for unread counts etc.
    this.refreshInterval = setInterval(() => this.loadChatContacts(), 10000);
  }

  loadChatContacts() {
    this.chatService.getChattedUsers().subscribe(res => {
      this.chattedUsers.set(res);
      // If we have a targetUserId but no targetUser object yet, find it in contacts
      if (this.targetUserId && !this.targetUser()) {
        const contact = res.find((c: any) => c.user._id === this.targetUserId);
        if (contact) {
          this.targetUser.set(contact.user);
        } else if (this.targetUserId) {
          this.fetchUserDetails(this.targetUserId);
        }
      }
    });
  }

  fetchUserDetails(userId: string) {
    this.authService.getAllUsers().subscribe(users => {
      const u = users.find((u: any) => u._id === userId);
      if (u) this.targetUser.set(u);
    });
  }

  loadMessages() {
    if (!this.targetUserId) return;
    this.chatService.getPrivateMessages(this.targetUserId).subscribe(res => {
      this.messages.set(res);
      setTimeout(() => this.scrollToBottom(), 100);
      this.chatService.markMessagesAsSeen(this.targetUserId).subscribe(() => this.loadChatContacts());
    });
  }

  selectChat(userId: string) {
    this.targetUserId = userId;
    this.router.navigate(['/chat', userId]);
    this.targetUser.set(null); // Reset to trigger re-fetch/find
    this.loadMessages();
    this.loadChatContacts();
    this.showSearch = false;
  }

  startChat(user: any) {
    this.targetUserId = user._id;
    this.targetUser.set(user);
    this.router.navigate(['/chat', user._id]);
    this.loadMessages();
    this.showSearch = false;
    this.searchResults.set([]);
    this.searchQuery = '';
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.targetUserId) return;

    this.chatService.sendPrivateMessage(this.targetUserId, this.newMessage);

    const tempMsg = {
      sender: this.authService.user().id,
      message: this.newMessage,
      timestamp: new Date(),
      status: 'sent'
    };

    this.messages.update(prev => [...prev, tempMsg]);
    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 100);

    // Refresh contacts to show last message
    setTimeout(() => this.loadChatContacts(), 500);
  }

  searchUsers() {
    if (this.searchQuery.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.chatService.searchUsersForChat(this.searchQuery).subscribe(res => {
      this.searchResults.set(res);
    });
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers().includes(userId);
  }

  getUserColor(name: string = ''): string {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }
}
