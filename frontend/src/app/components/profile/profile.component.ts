import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MeetingService } from '../../services/meeting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="profile-container">
      <div class="header">
        <button routerLink="/dashboard" class="btn-back">⬅️ Back to Dashboard</button>
        <h1>Profile Settings</h1>
      </div>

      <div class="profile-layout">
        <!-- Sidebar Navigation -->
        <div class="profile-tabs">
          <button [class.active]="activeTab === 'personal'" (click)="activeTab = 'personal'">Personal Info</button>
          <button [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">Security</button>
          <button [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">History</button>
        </div>

        <!-- Main Content Area -->
        <div class="profile-main-card">
          
          <!-- Personal Info Tab -->
          <div *ngIf="activeTab === 'personal'" class="tab-content">
             <h2>Update Personal Details</h2>
             <form (submit)="updateProfile()">
               <div class="form-group">
                 <label>Full Name</label>
                 <input type="text" [(ngModel)]="profileData.name" name="name" placeholder="Name">
               </div>
               <div class="form-group">
                 <label>Email Address</label>
                 <input type="email" [(ngModel)]="profileData.email" name="email" placeholder="Email">
               </div>
               <div class="form-group">
                 <label>Mobile Number</label>
                 <input type="text" [(ngModel)]="profileData.mobileNo" name="mobileNo" placeholder="Mobile">
               </div>
               <button type="submit" class="btn-primary" [disabled]="loading">
                 {{ loading ? 'Saving...' : 'Save Changes' }}
               </button>
             </form>
          </div>

          <!-- Security Tab -->
          <div *ngIf="activeTab === 'security'" class="tab-content">
             <h2>Change Password</h2>
             <form (submit)="changePassword()">
               <div class="form-group">
                 <label>Current Password</label>
                 <input type="password" [(ngModel)]="passwordData.currentPassword" name="current" placeholder="••••••••">
               </div>
               <div class="form-group">
                 <label>New Password</label>
                 <input type="password" [(ngModel)]="passwordData.newPassword" name="new" placeholder="••••••••">
               </div>
               <div class="form-group">
                 <label>Confirm New Password</label>
                 <input type="password" [(ngModel)]="passwordData.confirmPassword" name="confirm" placeholder="••••••••">
               </div>
               <button type="submit" class="btn-primary" [disabled]="loading">
                 {{ loading ? 'Updating...' : 'Update Password' }}
               </button>
             </form>
          </div>

          <!-- History Tab -->
          <div *ngIf="activeTab === 'history'" class="tab-content">
             <div class="history-header">
               <h2>Meeting History</h2>
               <span>Total {{ history().length }}</span>
             </div>
             <div class="history-list mt-3">
               <div *ngFor="let mtg of history()" class="history-item">
                 <div class="h-main">
                   <div class="h-title">{{ mtg.title || 'Untitled Meeting' }}</div>
                   <div class="h-meta">{{ mtg.meetingId }} | {{ mtg.startTime | date:'medium' }}</div>
                 </div>
                 <div class="h-status" [class.ended]="mtg.status === 'ended'">{{ mtg.status }}</div>
               </div>
               <div *ngIf="history().length === 0" class="empty-state">No history found.</div>
             </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; animation: fadeIn 0.4s ease-out; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-back { background: none; border: none; color: #3b82f6; font-weight: 600; cursor: pointer; font-size: 1rem; }
    
    .profile-layout { display: grid; grid-template-columns: 250px 1fr; gap: 2rem; }
    @media (max-width: 768px) { .profile-layout { grid-template-columns: 1fr; } }
    
    .profile-tabs { display: flex; flex-direction: column; gap: 0.5rem; }
    .profile-tabs button { text-align: left; padding: 1rem; border: none; background: white; border-radius: 1rem; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .profile-tabs button:hover { background: #f8fafc; color: #3b82f6; }
    .profile-tabs button.active { background: #3b82f6; color: white; box-shadow: 0 10px 15px rgba(59, 130, 246, 0.2); }
    
    .profile-main-card { background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); min-height: 400px; }
    .tab-content h2 { margin-top: 0; margin-bottom: 1.5rem; color: #1e293b; font-size: 1.5rem; }
    
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #475569; }
    .form-group input { width: 100%; padding: 0.8rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.8rem; font-size: 1rem; transition: 0.2s; background: #f8fafc; }
    .form-group input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    
    .history-header { display: flex; justify-content: space-between; align-items: center; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
    .h-title { font-weight: 600; color: #1e293b; }
    .h-meta { font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem; }
    .h-status { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #10b981; }
    .h-status.ended { color: #64748b; }
    
    .empty-state { text-align: center; color: #94a3b8; padding: 3rem 0; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileComponent implements OnInit {
  public authService = inject(AuthService);
  private meetingService = inject(MeetingService);
  private toastService = inject(ToastService);

  activeTab = 'personal';
  loading = false;

  profileData = { name: '', email: '', mobileNo: '' };
  passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  history = signal<any[]>([]);

  ngOnInit() {
    this.loadProfile();
    this.loadHistory();
  }

  loadProfile() {
    const user = this.authService.user();
    if (user) {
      this.profileData = {
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo
      };
    }
  }

  loadHistory() {
    this.meetingService.getHistory().subscribe({
      next: (res) => this.history.set(res),
      error: () => this.toastService.error('Failed to load history')
    });
  }

  updateProfile() {
    this.loading = true;
    this.authService.updateProfile(this.profileData).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Profile updated successfully!');
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Update failed');
      }
    });
  }

  changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastService.error('Passwords do not match');
      return;
    }

    this.loading = true;
    this.authService.changePassword(this.passwordData).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Password changed successfully!');
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Password change failed');
      }
    });
  }
}

