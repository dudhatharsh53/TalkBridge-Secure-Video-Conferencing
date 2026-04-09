import { Component, OnInit, signal, inject, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MeetingService } from '../../services/meeting.service';
import { InvitationService } from '../../services/invitation.service';
import { ToastService } from '../../services/toast.service';
import { ChatService } from '../../services/chat.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar Navigation -->
      <aside class="dashboard-sidebar">
        <div class="sidebar-logo">TalkBridge</div>
        <nav class="sidebar-nav">
          <button (click)="setActiveTab('home')" [class.active]="activeTab() === 'home'">
            <span class="icon">🏠</span> Overview
          </button>
          <button (click)="setActiveTab('meetings')" [class.active]="activeTab() === 'meetings'">
            <span class="icon">📅</span> Meetings
          </button>
          <button (click)="setActiveTab('messages')" [class.active]="activeTab() === 'messages'">
            <span class="icon">💬</span> Messages
          </button>
          <button (click)="setActiveTab('invitations')" [class.active]="activeTab() === 'invitations'">
            <span class="icon">✉️</span> Invitations
          </button>
          <button (click)="setActiveTab('notifications')" [class.active]="activeTab() === 'notifications'">
            <span class="icon">🔔</span> 
            Notifications
            <span class="sidebar-badge" *ngIf="unreadNotifCount() > 0">{{ unreadNotifCount() }}</span>
          </button>
          
          <hr>
          
          <button *ngIf="authService.user()?.role === 'admin'" routerLink="/admin">
            <span class="icon">🛡️</span> Admin Panel
          </button>
          
          <button routerLink="/profile">
            <span class="icon">👤</span> Profile
          </button>
          
          <button (click)="authService.logout()" class="logout-nav">
            <span class="icon">🚪</span> Logout
          </button>
        </nav>
        
        <div class="sidebar-footer">
          <div class="user-pill">
            <div class="avatar-xs" [style.background]="getUserColor(authService.user()?.name)">
              {{ authService.user()?.name?.charAt(0) }}
            </div>
            <div class="user-brief">
              <span class="name">{{ authService.user()?.name }}</span>
              <span class="role">{{ authService.user()?.role }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="dashboard-main">
        <div class="dashboard-header" *ngIf="activeTab() !== 'messages'">
          <div class="welcome-text">
            <h1>{{ getTabTitle() }}</h1>
            <p>{{ getTabSubtitle() }}</p>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content" [ngSwitch]="activeTab()">
          
          <!-- OVERVIEW TAB -->
          <div *ngSwitchCase="'home'" class="dashboard-grid animate-fade">
             <div class="card create-card" (click)="activeModal.set('Create Meeting')">
               <div class="card-icon">🚀</div>
               <h3>Create Meeting</h3>
               <p>Start instantly</p>
             </div>
             <div class="card join-card" (click)="setActiveTab('meetings')">
               <div class="card-icon">🔑</div>
               <h3>Join Meeting</h3>
               <p>Enter ID</p>
             </div>
             <div class="card stats-card">
               <div class="card-icon">📈</div>
               <h3>Activity</h3>
               <p>{{ history().length }} Meetings held</p>
             </div>
             
             <!-- Recent Messages Brief -->
             <div class="card recent-chats-brief col-span-2">
               <h3>Recent Messages</h3>
               <div class="chat-brief-list">
                 <div *ngFor="let chat of chattedUsers() | slice:0:3" (click)="openPrivateChat(chat.user._id)" class="brief-chat-item">
                    <div class="brief-avatar" [style.background]="getUserColor(chat.user.name)">{{ chat.user.name }}</div>
                    <div class="brief-details">
                      <div class="name-time">
                      <p class="brief-last">{{ chat.lastMessage }}</p>
                        <span class="brief-time">{{ (chat.lastMessageTime || chat.timestamp) | date:'shortTime' }}</span>
                      </div>
                    </div>
                 </div>
                 <div *ngIf="chattedUsers().length === 0" class="empty-mini">No recent messages</div>
               </div>
               <button (click)="setActiveTab('messages')" class="btn-text mt-2">Open active conversations</button>
             </div>

             <!-- Pending Invites Brief -->
             <div class="card invites-brief">
               <h3>Invitations</h3>
               <div class="mini-list">
                 <div *ngFor="let inv of pendingInvitations() | slice:0:3" class="mini-item">
                    <span class="inv-name">{{ inv.sender?.name || 'Someone' }}</span>
                    <div class="mini-actions">
                      <button (click)="updateInvite(inv._id, 'accepted')" class="btn-mini-success">✓</button>
                    </div>
                 </div>
                 <div *ngIf="pendingInvitations().length === 0" class="empty-mini">No pending invites</div>
               </div>
               <button (click)="setActiveTab('invitations')" class="btn-text mt-2">Manage Requests</button>
             </div>
          </div>

          <!-- MEETINGS TAB -->
          <div *ngSwitchCase="'meetings'" class="meetings-view animate-fade">
            <div class="meetings-action-grid">
               <!-- Section 1: Create Meeting -->
               <div class="meeting-card create-section card shadow-sm">
                 <div class="m-icon">🚀</div>
                 <h2>Create Meeting</h2>
                 <p class="m-desc">Launch a new session instantly with a custom title and duration.</p>
                 <div class="m-form">
                    <div class="m-field">
                      <label>Subject Label</label>
                      <input type="text" [(ngModel)]="newMtgTitle" placeholder="e.g. Sync Session">
                    </div>
                    <div class="m-duration-split">
                       <div class="m-field">
                         <label>Hours</label>
                         <input type="number" [(ngModel)]="newMtgHours" min="0" max="12">
                       </div>
                       <div class="m-field">
                         <label>Minutes</label>
                         <input type="number" [(ngModel)]="newMtgMins" min="0" max="59">
                       </div>
                    </div>
                    <button (click)="createMeeting()" class="btn-create-now" [disabled]="loadingCreate()">
                       {{ loadingCreate() ? 'Preparing...' : 'Create Meeting Now' }}
                    </button>
                 </div>
               </div>

               <!-- Section 2: Join Meeting -->
               <div class="meeting-card join-section card shadow-sm">
                 <div class="m-icon">🔑</div>
                 <h2>Join Meeting</h2>
                 <p class="m-desc">Enter a meeting ID to join an ongoing session immediately.</p>
                 <div class="m-form">
                    <div class="m-field">
                       <label>Meeting identifier (ID)</label>
                       <input type="text" [(ngModel)]="joinMtgId" placeholder="Paste ID here...">
                    </div>
                    <button (click)="joinMeeting()" [disabled]="!joinMtgId" class="btn-join-now">
                       Join Meeting
                    </button>
                 </div>
               </div>
            </div>
            
            <div class="card mt-4 p-0 overflow-hidden">
               <div class="p-4 border-b">
                 <h3 class="m-0">Your Meetings</h3>
               </div>
               <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Host</th>
                      <th>Scheduled / Held At</th>
                      <th>Status</th>
                      <th class="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let mtg of history()">
                      <td>{{ mtg.meetingId }}</td>
                      <td>{{ mtg.title || '' }}</td>
                      <td>{{ mtg.createdBy?.name || '' }}</td>
                      <td>{{ mtg.startTime | date:'medium' }}</td>
                      <td>
                        <span class="pill" [class.success]="mtg.status==='active'" [class.muted]="mtg.status==='ended'">
                          {{ mtg.status }}
                        </span>
                      </td>
                      <td class="text-right">
                        <button *ngIf="mtg.status === 'active'" (click)="rejoin(mtg.meetingId)" class="btn-primary-sm">Enter</button>
                        <span *ngIf="mtg.status === 'ended'" class="ended-text">Archived</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- MESSAGES TAB (UPGRADED) -->
          <div *ngSwitchCase="'messages'" class="messages-tab-wrapper animate-fade">
              <div class="messages-split">
                  <!-- History Section (Left/Top Depending on Screen) -->
                  <div class="chat-history-section">
                      <div class="section-head">
                          <h2>Recent Chats</h2>
                          <div class="search-box-mini">
                              <input type="text" [(ngModel)]="chatSearchQuery" placeholder="Filter conversations...">
                          </div>
                      </div>
                      
                      <div class="chatted-users-list">
                          <div *ngFor="let chat of getFilteredChats()" 
                               class="history-card-item card" 
                               (click)="openPrivateChat(chat.user._id)">
                              <div class="h-avatar" [style.background]="getUserColor(chat.user.name)">
                                  {{ chat.user.name.charAt(0) }}
                              </div>
                              <div class="h-details">
                                  <div class="h-top">
                                      <span class="h-name">{{ chat.user.name }}</span>
                                      <span class="h-time">{{ (chat.lastMessageTime || chat.timestamp) | date:'shortTime' }}</span>
                                  </div>
                                  <div class="h-bottom">
                                      <p class="h-last">{{ chat.lastMessage }}</p>
                                      <span class="h-badge" *ngIf="chat.unreadCount > 0">{{ chat.unreadCount }}</span>
                                  </div>
                              </div>
                          </div>
                          <div *ngIf="chattedUsers().length === 0" class="empty-state">
                              No past chats. Start a new one!
                          </div>
                      </div>
                  </div>

                  <!-- Find New Users Section (Right/Bottom) -->
                  <div class="new-chat-section">
                      <div class="section-head">
                          <h2>Start New Chat</h2>
                          <p>Connect with anyone in TalkBridge</p>
                      </div>
                      <div class="user-search-box">
                          <input type="text" 
                                 [(ngModel)]="globalUserSearch" 
                                 (input)="searchGlobalUsers()" 
                                 placeholder="Search anyone by name or email...">
                          <span class="search-icon">🔍</span>
                      </div>
                      
                      <div class="global-users-results" *ngIf="globalSearchResults().length > 0">
                          <div *ngFor="let u of globalSearchResults()" 
                               class="user-result-item card" 
                               (click)="openPrivateChat(u._id)">
                              <div class="res-avatar" [style.background]="getUserColor(u.name)">{{ u.name.charAt(0) }}</div>
                              <div class="res-info">
                                  <div class="res-name">{{ u.name }}</div>
                                  <div class="res-email">{{ u.email }}</div>
                              </div>
                              <div class="res-action">💬</div>
                          </div>
                      </div>
                      
                      <div *ngIf="globalUserSearch.length >= 2 && globalSearchResults().length === 0" class="empty-state">
                          No users found matching "{{ globalUserSearch }}"
                      </div>
                  </div>
              </div>
          </div>

          <!-- INVITATIONS TAB -->
          <div *ngSwitchCase="'invitations'" class="invitations-view animate-fade">
            <div class="invites-grid">
               <div class="card">
                 <h3>Send Invitation</h3>
                 <p class="text-muted text-sm">Send a direct meeting invite to another user via email</p>
                 <div class="invite-form mt-4">
                   <div class="field">
                     <label>Meeting ID</label>
                     <input type="text" [(ngModel)]="inviteRoomId" placeholder="Paste ID here">
                   </div>
                   <div class="field mt-3">
                     <label>Invite User (Email)</label>
                     <div class="search-field">
                        <input type="email" [(ngModel)]="inviteEmail" (input)="searchUsers()" placeholder="Search email...">
                        <div class="search-popover card shadow-2xl" *ngIf="searchResults().length > 0">
                          <div *ngFor="let u of searchResults()" (click)="selectUser(u.email)" class="popover-item">
                            <span class="p-name">{{ u.name }}</span> -
                            <span class="p-email">{{ u.email }}</span>
                          </div>
                        </div>
                     </div>
                   </div>
                   <button (click)="sendInvitation()" class="btn-brand w-full mt-4" [disabled]="!inviteRoomId || !inviteEmail">
                     Send Invitation
                   </button>
                 </div>
               </div>

               <div class="card">
                 <h3>Received Requests</h3>
                 <p class="text-muted text-sm">Meeting access or join requests waiting for your approval</p>
                 <div class="requests-list mt-4">
                    <div *ngFor="let inv of allReceivedInvitations()" class="request-row" [class.archived]="inv.status !== 'pending'">
                       <div class="user">
                         <span class="name">{{ inv.sender?.name || 'User' }}</span>
                         <span class="room">For Room: {{ inv.meetingId }}</span>
                         <div class="status-indicator" [class]="inv.status">{{ inv.status }}</div>
                       </div>
                       <div class="actions" *ngIf="inv.status === 'pending'">
                          <button (click)="updateInvite(inv._id, 'accepted')" class="btn-approve">Approve</button>
                          <button (click)="updateInvite(inv._id, 'rejected')" class="btn-deny">Deny</button>
                       </div>
                    </div>
                    <div *ngIf="allReceivedInvitations().length === 0" class="no-requests">
                      No invitations at the moment
                    </div>
                 </div>
               </div>
            </div>
          </div>
          
          <!-- NOTIFICATIONS TAB -->
          <div *ngSwitchCase="'notifications'" class="notifications-view animate-fade">
             <div class="view-header">
               <h2>Announcements</h2>
               <button (click)="markAllRead()" class="btn-clear-all">Clear all</button>
             </div>
             <div class="notif-list mt-4">
                <div *ngFor="let n of notifications()" class="card notif-row" [class.new]="!n.isRead" (click)="handleNotifClick(n)">
                   <div class="status-dot" *ngIf="!n.isRead"></div>
                   <div class="notif-body">
                     <h4>{{ n.title }}</h4>
                     <p>{{ n.message }}</p>
                     <span class="time">{{ n.createdAt | date:'medium' }}</span>
                   </div>
                   <div class="chevron">›</div>
                </div>
                <div *ngIf="notifications().length === 0" class="empty-notif card">
                   🎉 You're all caught up!
                </div>
             </div>
          </div>

        </div>

        <footer class="legal-footer">
           <hr>
           <p>TalkBridge &copy; 2024. All rights reserved.</p>
        </footer>
      </main>
    </div>

    <!-- Modals -->
    <div class="modal-backdrop" *ngIf="activeModal()">
      <div class="modal card shadow-2xl">
         <div class="modal-head">
           <h2>Create a Meeting</h2>
           <button (click)="activeModal.set(null)" class="close-btn">✕</button>
         </div>
         <div class="modal-body">
            <p class="modal-desc">Define your session details. Instant access will be granted after creation.</p>
            <div class="form-group mt-4">
              <label class="modal-label">Subject</label>
              <input type="text" [(ngModel)]="newMtgTitle" placeholder="e.g. Sync Session" class="modal-input">
            </div>
            <div class="form-group mt-3">
              <label class="modal-label">Duration Limit</label>
              <div class="duration-grid">
                <div class="input-wrap">
                  <input type="number" [(ngModel)]="newMtgHours" min="0" max="12">
                  <span>Hours</span>
                </div>
                <div class="input-wrap">
                  <input type="number" [(ngModel)]="newMtgMins" min="0" max="59">
                  <span>Mins</span>
                </div>
              </div>
            </div>
            <button class="btn-brand-modal" (click)="createMeeting()" [disabled]="loadingCreate()">
              {{ loadingCreate() ? 'Creating Session...' : 'Create Meeting' }}
            </button>
         </div>
      </div>
    </div>
  `,
  styles: [`
    /* Core Layout */
    .dashboard-layout { display: flex; min-height: 100vh; background: #f1f5f9; color: #1e293b; }
    
    /* Sidebar */
    .dashboard-sidebar { width: 260px; background: #0f172a; border-right: 1px solid #1e293b; display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; color: #94a3b8; }
    .sidebar-logo { padding: 2rem; font-size: 1.6rem; font-weight: 800; color: #3b82f6; letter-spacing: -1px; }
    .sidebar-nav { flex: 1; padding: 0 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .sidebar-nav button { display: flex; align-items: center; gap: 0.8rem; padding: 0.9rem 1.2rem; border: none; background: none; border-radius: 0.8rem; color: #94a3b8; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; position: relative; }
    .sidebar-nav button:hover { background: #1e293b; color: #f1f5f9; }
    .sidebar-nav button.active { background: #3b82f6; color: white; }
    .sidebar-nav .icon { font-size: 1.2rem; min-width: 24px; }
    .sidebar-nav hr { border: none; border-top: 1px solid #1e293b; margin: 1.2rem 0; width: 90%; align-self: center; }
    .sidebar-badge { background: #ef4444; color: white; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.7rem; position: absolute; right: 1rem; }
    .logout-nav { margin-top: auto; color: #f87171 !important; }
    .logout-nav:hover { background: #450a0a !important; color: #fee2e2 !important; }
    
    .sidebar-footer { padding: 1.2rem; border-top: 1px solid #1e293b; background: rgba(0,0,0,0.2); }
    .user-pill { display: flex; align-items: center; gap: 0.8rem; }
    .avatar-xs { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.8rem; }
    .user-brief { display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
    .user-brief .name { font-size: 0.85rem; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-brief .role { font-size: 0.7rem; color: #64748b; text-transform: uppercase; }
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;}
    .legal-footer { margin-top: 5px; }
    .mini-item { display: flex; justify-content: space-between;}

    /* Main Area */
    .dashboard-main { flex: 1; margin-left: 260px; padding: 2.5rem 3.5rem; min-height: 100vh; }
    .dashboard-header { margin-bottom: 2.5rem; }
    .welcome-text h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .welcome-text p { color: #64748b; margin: 0.4rem 0 0; font-size: 1.1rem; }

    /* Grid & Cards */
    .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.8rem; }
    .col-span-2 { grid-column: span 2; }
    .card { background: white; border-radius: 1.5rem; padding: 1.8rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    
    .create-card { background: #3b82f6; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: none; }
    .card-icon { font-size: 3rem; margin-bottom: 0.8rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
    
    .join-card { cursor: pointer; background: #f0fdf4; border-color: #bbf7d0; text-align: center; }
    .stats-card { background: #fdf2f8; border-color: #fbcfe8; text-align: center; }
    
    /* Messages View Upgraded */
    .messages-tab-wrapper { height: 100%; display: flex; flex-direction: column; }
    .messages-split { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; height: 100%; }
    @media (max-width: 1100px) { .messages-split { grid-template-columns: 1fr; } }
    
    .section-head { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .section-head h2 { margin: 0; font-size: 1.5rem; font-weight: 800; }
    .section-head p { margin: 0.3rem 0; color: #64748b; }
    
    .chatted-users-list { display: flex; flex-direction: column; gap: 1rem; max-height: 70vh; overflow-y: auto; padding-right: 0.5rem; }
    .history-card-item { display: flex; gap: 1rem; padding: 1.2rem; cursor: pointer; transition: 0.2s; align-items: center; }
    .history-card-item:hover { transform: scale(1.02); border-color: #3b82f6; background: #f0f9ff; }
    .h-avatar { width: 50px; height: 50px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; flex-shrink: 0; }
    .h-details { flex: 1; overflow: hidden; }
    .h-top { display: flex; justify-content: space-between; margin-bottom: 0.3rem; }
    .h-name { font-weight: 700; color: #1e293b; }
    .h-time { font-size: 0.7rem; color: #94a3b8; }
    .h-bottom { display: flex; justify-content: space-between; align-items: center; }
    .h-last { font-size: 0.85rem; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-badge { background: #3b82f6; color: white; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.7rem; font-weight: bold; }

    .user-search-box { position: relative; margin-bottom: 1.5rem; }
    .user-search-box input { width: 100%; padding: 1rem 1.5rem 1rem 3rem; border: 2px solid #e2e8f0; border-radius: 1.2rem; outline: none; transition: 0.3s; font-size: 1rem; }
    .user-search-box input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .search-icon { position: absolute; left: 1.2rem; top: 1.1rem; color: #94a3b8; }

    .global-users-results { display: grid; grid-template-columns: 1fr; gap: 1rem; overflow-y: auto; max-height: 60vh; }
    .user-result-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; cursor: pointer; transition: 0.2s; }
    .user-result-item:hover { background: #f8fafc; border-color: #3b82f6; }
    .res-avatar { width: 45px; height: 45px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .res-info { flex: 1; }
    .res-name { font-weight: 700; font-size: 0.95rem; }
    .res-email { font-size: 0.75rem; color: #94a3b8; }
    .res-action { font-size: 1.2rem; opacity: 0.3; }

    .search-box-mini input { border: 1px solid #e2e8f0; border-radius: 0.6rem; padding: 0.4rem 0.8rem; font-size: 0.8rem; width: 150px; }
    
    /* Meetings Sections */
    .meetings-action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem; }
    @media (max-width: 1024px) { .meetings-action-grid { grid-template-columns: 1fr; } }
    .meeting-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2rem !important; transition: 0.3s; }
    .meeting-card .m-icon { font-size: 3rem; margin-bottom: 1rem; }
    .meeting-card h2 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #0f172a; font-weight: 800; }
    .meeting-card .m-desc { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; max-width: 320px; }
    .m-form { width: 100%; display: flex; flex-direction: column; gap: 1rem; text-align: left; flex: 1; }
    .m-field label { display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; }
    .m-field input { width: 100%; padding: 0.8rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 0.8rem; background: #f8fafc; font-size: 1rem; transition: 0.2s; outline: none; box-sizing: border-box; }
    .m-field input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .m-duration-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .btn-create-now { background: #3b82f6; color: white; border: none; padding: 1rem; border-radius: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 1rem; margin-top: auto; }
    .btn-create-now:hover { background: #2563eb; transform: translateY(-2px); }
    .btn-join-now { background: #0f172a; color: white; border: none; padding: 1rem; border-radius: 0.8rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 1rem; margin-top: auto; }
    .btn-join-now:hover { background: #1e293b; transform: translateY(-2px); }

    /* Tables & Lists */
    .table-container { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th { text-align: left; padding: 1.2rem; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
    td { padding: 1.2rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .pill { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .pill.success { background: #dcfce7; color: #166534; }
    .pill.muted { background: #e6e6e6ff; color: #37404dff; }
    .btn-primary-sm { background: #3b82f6; color: white; padding: 0.5rem 1.2rem; border-radius: 0.6rem; border: none; font-weight: 700; cursor: pointer; }

    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeInDim 0.3s ease; }
    .modal { width: 90%; max-width: 500px; padding: 2.5rem; background: #ffffff !important; color: #0f172a !important; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    .modal-head h2 { margin: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; color: #0f172a !important;}
    .modal-head { display: flex; justify-content: space-between; }
    .modal-desc { color: #475569 !important; margin: 0.5rem 0 1.5rem; font-size: 1.1rem; }
    .modal-label { display: block; font-size: 0.9rem; font-weight: 700; color: #334155 !important; margin-bottom: 0.6rem; }
    .modal-input { width: 100%; padding: 0.9rem 1.2rem; border: 2px solid #e2e8f0; border-radius: 0.8rem; font-size: 1.1rem; background: #f8fafc; color: #0f172a !important; outline: none; transition: 0.2s; }
    .modal-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .close-btn { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #94a3b8; line-height: 1; }
    .duration-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
    .input-wrap { display: flex; align-items: center; gap: 0.8rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.8rem 1rem; border-radius: 0.8rem; }
    .input-wrap input { width: 100%; border: none; background: none; font-size: 1.3rem; text-align: center; font-weight: 800; outline: none; color: #0f172a !important; }
    .btn-brand-modal { background: #3b82f6 !important; color: #ffffff !important; padding: 1.2rem !important; font-size: 1.2rem !important; font-weight: 800 !important; display: flex !important; align-items: center !important; justify-content: center !important; border: none !important; border-radius: 1rem !important; cursor: pointer !important; width: 100% !important; margin-top: 2rem !important; }
    .btn-brand-modal:hover { background: #2563eb !important; }
    .btn-brand-modal:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Buttons */
    .btn-brand { background: #3b82f6; color: white; border: none; padding: 1rem 2rem; border-radius: 1rem; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
    .btn-brand:hover { background: #2563eb; transform: translateY(-2px); }
    .btn-primary { background: #0f172a; color: white; border: none; padding: 0.9rem 1.8rem; border-radius: 1rem; font-weight: 700; cursor: pointer; }
    .btn-text { background: #f5f5f5; border: none; color: #3b82f6; font-weight: 700; font-size: 0.9rem; cursor: pointer; padding: 0.5rem; margin-top: 10px; margin-left: -5px;}
    .btn-clear-all { background: #eaeaea; border: none; color: #3b82f6; font-weight: 700; font-size: 0.9rem; cursor: pointer; padding: 0.5rem; }
    .w-full { width: 100%;margin-top: 1rem; }
    .name-time { display: flex; justify-content: space-between; align-items: center; }
    .actions { display: flex; gap: 5px;}
    .btn-approve { background: #1f914bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; }
    .btn-deny { background: #da3c3c; border: none; color: white; font-weight: 700; font-size: 0.9rem; cursor: pointer; padding: 0.5rem; }
    .popover-item { display: flex; gap: 7px;}


    /* Invitation Items */
    .request-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    .request-row.archived { opacity: 0.7; scale: 0.98; background: #fafafa; border-radius: 0.8rem; margin: 0.2rem 0; }
    .status-indicator { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 0.1rem 0.4rem; border-radius: 4px; display: inline-block; margin-left: 0.5rem; }
    .status-indicator.accepted { background: #dcfce7; color: #166534; }
    .status-indicator.rejected { background: #fee2e2; color: #991b1b; }
    .status-indicator.pending { background: #fef3c7; color: #ff9148ff; }

    .mini-status-chip { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; padding: 0.1rem 0.3rem; border-radius: 3px; }
    .mini-status-chip.accepted { color: #166534; }
    .mini-status-chip.pending { color: #92400e; }
    .mini-status-chip.rejected { color: #991b1b; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardComponent implements OnInit {
  activeTab = signal('home');

  // Model state
  newMtgTitle = '';
  newMtgHours = 1;
  newMtgMins = 0;
  joinMtgId = '';
  inviteRoomId = '';
  inviteEmail = '';

  // Search states for Messages
  chatSearchQuery = '';
  globalUserSearch = '';
  globalSearchResults = signal<any[]>([]);

  loadingCreate = signal(false);
  activeModal = signal<string | null>(null);

  // Signals
  history = signal<any[]>([]);
  allReceivedInvitations = signal<any[]>([]); // New consolidated signal
  pendingInvitations = signal<any[]>([]);
  chattedUsers = signal<any[]>([]);
  notifications = signal<any[]>([]);
  searchResults = signal<any[]>([]);
  unreadNotifCount = signal(0);

  // Services
  public authService = inject(AuthService);
  private meetingService = inject(MeetingService);
  private invitationService = inject(InvitationService);
  private chatService = inject(ChatService);
  private notificationService = inject(NotificationService);
  public toastService = inject(ToastService);
  private router = inject(Router);

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.loadHistory();
    this.loadInvitations();
    this.loadChatContacts();
    this.loadNotifications();
  }

  getTabTitle(): string {
    switch (this.activeTab()) {
      case 'home': return `Welcome back!`;
      case 'meetings': return 'Your Meetings';
      case 'messages': return 'Conversations';
      case 'invitations': return 'Invitation Control';
      case 'notifications': return 'Recent Activity';
      default: return 'TalkBridge';
    }
  }

  getTabSubtitle(): string {
    switch (this.activeTab()) {
      case 'home': return 'Quick overview of your day.';
      case 'meetings': return 'Manage your scheduled sessions.';
      case 'messages': return 'Communicate with your team.';
      case 'invitations': return 'Approve entry requests.';
      case 'notifications': return 'Catch up on important alerts.';
      default: return 'Fast & Secure Video Conferencing';
    }
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'messages') {
      this.loadChatContacts();
    }
  }

  loadHistory() {
    this.meetingService.getHistory().subscribe({
      next: (data) => this.history.set(data),
      error: (err) => console.error('Error loading history', err)
    });
  }

  loadInvitations() {
    this.invitationService.getReceivedInvitations().subscribe({
      next: (res) => {
        this.allReceivedInvitations.set(res);
        this.pendingInvitations.set(res.filter((inv: any) => inv.status === 'pending'));
      },
      error: (err) => console.error('Error loading invitations', err)
    });
  }

  loadChatContacts() {
    this.chatService.getChattedUsers().subscribe({
      next: (res) => {
        // Sort explicitly on LIFO basis on client side too
        res.sort((a: any, b: any) => {
          const dateA = new Date(a.lastMessageTime).getTime();
          const dateB = new Date(b.lastMessageTime).getTime();
          return dateB - dateA;
        });
        this.chattedUsers.set(res);
      },
      error: (err) => console.error('Error loading chat contacts', err)
    });
  }

  getFilteredChats() {
    if (!this.chatSearchQuery.trim()) return this.chattedUsers();
    const q = this.chatSearchQuery.toLowerCase();
    return this.chattedUsers().filter(c =>
      c.user.name.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  }

  searchGlobalUsers() {
    if (this.globalUserSearch.length < 2) {
      this.globalSearchResults.set([]);
      return;
    }
    this.authService.searchUsers(this.globalUserSearch).subscribe({
      next: (res) => this.globalSearchResults.set(res),
      error: (err) => console.error('Search error', err)
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications.set(res || []);
        this.unreadNotifCount.set((res || []).filter((n: any) => !n.isRead).length);
      },
      error: (err) => console.error('Error loading notifications', err)
    });
  }

  createMeeting() {
    if (this.loadingCreate()) return;
    this.loadingCreate.set(true);

    const h = Number(this.newMtgHours) || 0;
    const m = Number(this.newMtgMins) || 0;
    const durationTotal = (h * 60) + m;

    if (durationTotal <= 0) {
      this.toastService.error('Session must have a duration (at least 1 minute)');
      this.loadingCreate.set(false);
      return;
    }

    this.meetingService.createMeeting({
      title: this.newMtgTitle.trim() || 'Quick Sync',
      duration: durationTotal
    }).subscribe({
      next: (meeting) => {
        this.loadingCreate.set(false);
        this.activeModal.set(null);
        this.toastService.success('Meeting launched successfully!');
        this.router.navigate(['/meeting', meeting.meetingId]);
      },
      error: (err) => {
        this.loadingCreate.set(false);
        console.error('CRITICAL: Meeting Creation Failed', err);
        const detail = err.error?.error || err.error?.message || err.message;
        this.toastService.error(`Fail: ${detail}`);
      }
    });
  }

  joinMeeting() {
    if (!this.joinMtgId) return;
    this.meetingService.joinMeeting(this.joinMtgId).subscribe({
      next: (meeting) => {
        this.toastService.success('Joining...');
        this.router.navigate(['/meeting', meeting.meetingId]);
      },
      error: (err) => this.toastService.error(err.error?.message || 'Meeting not found')
    });
  }

  rejoin(id: string) {
    this.router.navigate(['/meeting', id]);
  }

  updateInvite(id: string, status: 'accepted' | 'rejected') {
    const inv = this.allReceivedInvitations().find(i => i._id === id);
    this.invitationService.updateStatus(id, status).subscribe({
      next: () => {
        this.toastService.success(`Request ${status}.`);
        this.loadInvitations();
        if (status === 'accepted' && inv) {
          this.router.navigate(['/meeting', inv.meetingId]);
        }
      },
      error: (err) => this.toastService.error('Conflict updating status')
    });
  }

  sendInvitation() {
    this.invitationService.sendInvitation(this.inviteRoomId, this.inviteEmail).subscribe({
      next: () => {
        this.toastService.success('Invitation dispatched');
        this.inviteEmail = '';
        this.inviteRoomId = '';
        this.searchResults.set([]);
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to send')
    });
  }

  searchUsers() {
    if (this.inviteEmail.length < 3) {
      this.searchResults.set([]);
      return;
    }
    this.authService.searchUsers(this.inviteEmail).subscribe({
      next: (res) => this.searchResults.set(res),
      error: (err) => console.error('Search error', err)
    });
  }

  selectUser(email: string) {
    this.inviteEmail = email;
    this.searchResults.set([]);
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  handleNotifClick(notif: any) {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif._id).subscribe(() => this.loadNotifications());
    }
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    } else if (notif.type === 'invitation') {
      this.setActiveTab('invitations');
    }
  }

  openPrivateChat(userId: string) {
    this.router.navigate(['/chat', userId]);
  }

  getUserColor(name: string = ''): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
