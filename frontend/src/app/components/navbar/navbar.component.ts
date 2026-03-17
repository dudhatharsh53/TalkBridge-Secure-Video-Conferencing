import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar" *ngIf="authService.isLoggedIn()">
      <div class="nav-container">
        <div style="display: flex; align-items: center; gap: 2rem;">
          <a routerLink="/dashboard" class="nav-logo">TalkBridge</a>
          <a *ngIf="authService.user()?.role === 'admin'" routerLink="/admin" class="nav-link admin-glow">Admin Panel</a>
        </div>
        
        <div class="nav-menu">
          <!-- Notification Bell -->
          <div class="notif-wrapper">
            <button class="notif-btn" (click)="toggleNotifDropdown()">
              <span class="bell-icon">🔔</span>
              <span class="notif-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
            </button>
            <div class="notif-dropdown" *ngIf="showNotifDropdown()">
              <div class="notif-header">
                <h3>Notifications</h3>
                <button (click)="markAllRead()">Mark all read</button>
              </div>
              <div class="notif-items">
                <div *ngFor="let n of notifications() | slice:0:5" class="notif-item" [class.unread]="!n.isRead">
                  <p>{{ n.title }}</p>
                  <span>{{ n.createdAt | date:'shortTime' }}</span>
                </div>
                <div *ngIf="notifications().length === 0" class="empty-notif">No notifications</div>
              </div>
            </div>
          </div>

          <!-- Profile Dropdown -->
          <div class="profile-dropdown">
            <button class="dropdown-btn" (click)="toggleDropdown()">
              {{ authService.user()?.name }} ▾
            </button>
            
            <div class="dropdown-content" *ngIf="showDropdown()">
              <a routerLink="/profile" (click)="showDropdown.set(false)">My Profile</a>
              <a routerLink="/invitations" (click)="showDropdown.set(false)">
                Invitations 
              </a>
              <a routerLink="/chat" (click)="showDropdown.set(false)">
                Messages
              </a>
              <hr>
              <button (click)="logout()" class="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-color);
      position: fixed;
      top: 0;
      width: 100%;
      z-index: 1000;
      padding: 0.75rem 0;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-color);
      text-decoration: none;
    }
    .nav-link {
      text-decoration: none;
      color: var(--text-color);
      font-weight: 500;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }
    .nav-link:hover {
      background: var(--bg-color);
      color: var(--primary-color);
    }
    .admin-glow {
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
      background: rgba(37, 99, 235, 0.05);
    }
    .profile-dropdown {
      position: relative;
    }
    .dropdown-btn {
      background: none;
      border: 1px solid var(--border-color);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }
    .dropdown-content {
      position: absolute;
      right: 0;
      top: calc(100% + 0.5rem);
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      min-width: 180px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .dropdown-content a, .logout-btn {
      display: block;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: var(--text-color);
      width: 100%;
      text-align: left;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .dropdown-content a:hover, .logout-btn:hover {
      background: var(--bg-color);
    }
    .logout-btn {
      color: var(--danger-color);
    }
    .notif-wrapper { position: relative; margin-right: 1.5rem; }
    .notif-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; position: relative; padding: 5px; }
    .notif-badge { position: absolute; top: 0; right: 0; background: red; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; border: 2px solid white; font-weight: bold; }
    .notif-dropdown { position: absolute; top: calc(100% + 1rem); right: 0; width: 300px; background: white; border-radius: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
    .notif-header { padding: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .notif-header h3 { font-size: 1rem; margin: 0; }
    .notif-header button { border: none; background: none; color: #3b82f6; font-size: 0.8rem; cursor: pointer; }
    .notif-items { max-height: 400px; overflow-y: auto; }
    .notif-item { padding: 0.8rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.unread { background: #eff6ff; }
    .notif-item p { margin: 0; font-size: 0.9rem; color: #1e293b; }
    .notif-item span { font-size: 0.75rem; color: #94a3b8; }
    .empty-notif { padding: 2rem; text-align: center; color: #94a3b8; }

    hr {
      margin: 0;
      border: 0;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class NavbarComponent implements OnInit {
  showDropdown = signal(false);
  showNotifDropdown = signal(false);
  notifications = signal<any[]>([]);
  unreadCount = signal(0);

  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe(res => {
      this.notifications.set(res);
      this.unreadCount.set(res.filter((n: any) => !n.isRead).length);
    });
  }

  toggleDropdown() {
    this.showDropdown.set(!this.showDropdown());
    this.showNotifDropdown.set(false);
  }

  toggleNotifDropdown() {
    this.showNotifDropdown.set(!this.showNotifDropdown());
    this.showDropdown.set(false);
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.loadNotifications();
    });
  }

  logout() {
    this.showDropdown.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
