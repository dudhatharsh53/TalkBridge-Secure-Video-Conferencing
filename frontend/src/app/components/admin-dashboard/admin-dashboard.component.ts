import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { MeetingService } from '../../services/meeting.service';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-wrapper">
      <div class="admin-header">
        <div class="title-area">
          <button routerLink="/dashboard" class="btn-text">⬅️ Back to Dashboard</button>
          <h1>System Administration</h1>
        </div>
        <button (click)="loadAll()" class="btn-refresh">🔄 Refresh System Data</button>
      </div>

      <!-- Key Metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="icon">👥</div>
          <div class="data">
            <span class="label">Total Users</span>
            <span class="value">{{ stats()?.totalUsers || 0 }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">📞</div>
          <div class="data">
            <span class="label">Total Meetings</span>
            <span class="value">{{ stats()?.totalMeetings || 0 }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">⚡</div>
          <div class="data">
             <span class="label">Active Rooms</span>
             <span class="value">{{ stats()?.activeMeetings || 0 }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon">✉️</div>
          <div class="data">
             <span class="label">Invitations</span>
             <span class="value">{{ stats()?.totalInvitations || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-nav mt-4">
        <button [class.active]="activeView() === 'users'" (click)="activeView.set('users')">Users</button>
        <button [class.active]="activeView() === 'meetings'" (click)="activeView.set('meetings')">Meetings</button>
        <button [class.active]="activeView() === 'invites'" (click)="activeView.set('invites')">Invitation Analysis</button>
      </div>

      <!-- View Containers -->
      <div class="admin-card mt-3">
        
        <!-- Users View -->
        <div *ngIf="activeView() === 'users'" class="view-content fade-in">
          <div class="view-header">
            <h2>User Management</h2>
            <div class="search-box">
              <input type="text" [(ngModel)]="userSearch" placeholder="Search user...">
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers()">
                  <td>
                    <div class="user-name">{{ user.name }}</div>
                    <div class="email-sub">{{ user.email }}</div>
                  </td>
                  <td>{{ user.mobileNo }}</td>
                  <td>
                    <select [(ngModel)]="user.role" (change)="updateUserRole(user)" class="role-select">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{{ user.createdAt | date:'shortDate' }}</td>
                  <td>
                    <div class="action-cell">
                      <button (click)="deleteUser(user._id)" class="btn-action-cancel" title="Cancel/Remove User">
                        <span class="icon">✕</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Meetings View -->
        <div *ngIf="activeView() === 'meetings'" class="view-content fade-in">
          <div class="view-header">
            <h2>Meeting Records</h2>
          </div>
          <div class="table-container">
             <table>
               <thead>
                 <tr>
                   <th>Title & ID</th>
                   <th>Created By</th>
                   <th>Schedule</th>
                   <th>Status</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 <tr *ngFor="let mtg of meetings()">
                    <td>
                      <div class="user-name">{{ mtg.title || 'Untitled' }}</div>
                      <div class="email-sub">{{ mtg.meetingId }}</div>
                    </td>
                    <td>
                      <div class="user-name">{{ mtg.createdBy?.name || 'Unknown' }}</div>
                      <div class="email-sub">{{ mtg.createdBy?.email }}</div>
                    </td>
                    <td>{{ mtg.startTime | date:'medium' }}</td>
                    <td>
                      <span class="badge" [class.success]="mtg.status==='active'">{{ mtg.status }}</span>
                    </td>
                    <td>
                       <div class="action-cell">
                          <button *ngIf="mtg.status === 'active'" (click)="terminateMeeting(mtg.meetingId)" class="btn-action-warn" title="Cancel/End Meeting">🛑</button>
                          <button (click)="deleteMeeting(mtg._id)" class="btn-action-cancel" title="Delete Record">✕</button>
                       </div>
                    </td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>

        <!-- Invites View -->
        <div *ngIf="activeView() === 'invites'" class="view-content fade-in">
          <div class="view-header">
            <h2>Invitation Statistics</h2>
          </div>
          <div class="inv-stats-container">
             <div class="status-summary">
                <div *ngFor="let s of inviteStats()?.statusStats" class="stat-pill">
                  <span class="pill-label">{{ s._id | uppercase }}</span>
                  <span class="pill-value">{{ s.count }}</span>
                </div>
             </div>
             
             <h3 class="mt-4">Top Inviters</h3>
             <div class="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>User</th>
                     <th>Invitations Sent</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let u of inviteStats()?.userInvitationStats">
                     <td>{{ u.name }} ({{ u.email }})</td>
                     <td>{{ u.sentCount }}</td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .admin-wrapper { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; }
    .admin-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
    .title-area h2 { color: #64748b; font-size: 0.9rem; font-weight: 500; margin: 0 0 0.2rem 0; }
    .title-area h1 { font-size: 2rem; color: #1e293b; margin: 0; }
    .btn-refresh { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.6rem 1.2rem; border-radius: 0.8rem; font-weight: 600; cursor: pointer; color: #475569; transition: 0.2s; }
    .btn-refresh:hover { background: #f1f5f9; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 1.5rem; display: flex; align-items: center; gap: 1.2rem; box-shadow: 0 10px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
    .stat-card .icon { font-size: 2.2rem; }
    .stat-card .data { display: flex; flex-direction: column; }
    .stat-card .label { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
    .stat-card .value { font-size: 1.8rem; font-weight: 700; color: #1e293b; }

    .admin-nav { display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.4rem; border-radius: 1rem; width: fit-content; }
    .admin-nav button { border: none; background: none; padding: 0.6rem 1.5rem; border-radius: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
    .admin-nav button.active { background: white; color: #3b82f6; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

    .admin-card { background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); min-height: 500px; }
    .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .view-header h2 { margin: 0; font-size: 1.4rem; color: #1e293b; }
    .search-box input { padding: 0.7rem 1.2rem; border: 1px solid #e2e8f0; border-radius: 0.8rem; width: 300px; outline: none; background: #f8fafc; }
    .search-box input:focus { border-color: #3b82f6; background: white; }

    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; }
    td { padding: 1.2rem 1rem; border-bottom: 1px solid #f8fafc; }
    .user-name { font-weight: 600; color: #1e293b; }
    .email-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; background: #f1f5f9; color: #64748b; }
    .badge.success { background: #dcfce7; color: #16a34a; }

    .role-select { padding: 0.4rem 0.6rem; border-radius: 0.6rem; border: 1px solid #e2e8f0; font-size: 0.85rem; background: #fff; cursor: pointer; outline: none; transition: 0.2s; }
    .role-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

    .action-cell { display: flex; gap: 0.5rem; justify-content: flex-end; }
    
    .btn-action-cancel { border: 1.5px solid #fecaca; background: #fff1f2; color: #e11d48; width: 34px; height: 34px; border-radius: 0.8rem; cursor: pointer; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-action-cancel:hover { background: #e11d48; color: white; transform: rotate(90deg); border-color: #e11d48; }

    .btn-action-warn { border: 1.5px solid #fed7aa; background: #fff7ed; color: #ea580c; width: 34px; height: 34px; border-radius: 0.8rem; cursor: pointer; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
    .btn-action-warn:hover { background: #ea580c; color: white; transform: scale(1.1); border-color: #ea580c; }

    .status-summary { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat-pill { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem 2rem; border-radius: 1rem; display: flex; flex-direction: column; align-items: center; }
    .pill-label { font-size: 0.7rem; color: #94a3b8; font-weight: bold; margin-bottom: 0.4rem; }
    .pill-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }

    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .mt-4 { margin-top: 2rem; }
    .mt-3 { margin-top: 1.5rem; }
    .btn-text { border: none; background: none; color: #3b82f6; font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 0.5rem; display: block; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private meetingService = inject(MeetingService);
  private toastService = inject(ToastService);

  stats = signal<any>(null);
  users = signal<any[]>([]);
  meetings = signal<any[]>([]);
  inviteStats = signal<any>(null);
  activeView = signal<'users' | 'meetings' | 'invites'>('users');

  userSearch = '';

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loadStats();
    this.loadUsers();
    this.loadMeetings();
    this.loadInviteStats();
  }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => this.toastService.error('Failed to load stats')
    });
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.toastService.error('Failed to load users')
    });
  }

  loadMeetings() {
    this.adminService.getMeetings().subscribe({
      next: (data) => this.meetings.set(data),
      error: () => this.toastService.error('Failed to load meetings')
    });
  }

  loadInviteStats() {
    this.adminService.getInvitationStats().subscribe({
      next: (data) => this.inviteStats.set(data),
      error: () => console.error('Failed to load invite stats')
    });
  }

  filteredUsers() {
    if (!this.userSearch) return this.users();
    const query = this.userSearch.toLowerCase();
    return this.users().filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }

  updateUserRole(user: any) {
    this.adminService.updateUser(user._id, { role: user.role }).subscribe({
      next: () => this.toastService.success(`Updated ${user.name}'s role to ${user.role}`),
      error: () => {
        this.toastService.error('Failed to update user role');
        this.loadUsers();
      }
    });
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.toastService.success('User deleted successfully');
          this.loadAll();
        },
        error: () => this.toastService.error('Failed to delete user')
      });
    }
  }

  deleteMeeting(id: string) {
    if (confirm('Are you sure you want to remove this meeting record?')) {
      this.adminService.deleteMeeting(id).subscribe({
        next: () => {
          this.toastService.success('Meeting record removed');
          this.loadMeetings();
          this.loadStats();
        },
        error: () => this.toastService.error('Failed to delete meeting')
      });
    }
  }

  terminateMeeting(meetingId: string) {
    if (confirm('Are you sure you want to terminate this active meeting? Participants will be disconnected.')) {
      this.meetingService.endMeeting(meetingId).subscribe({
        next: () => {
          this.toastService.success('Meeting terminated');
          this.loadMeetings();
          this.loadStats();
        },
        error: () => this.toastService.error('Failed to terminate meeting')
      });
    }
  }
}

