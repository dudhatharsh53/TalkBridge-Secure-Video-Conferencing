import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="users-container">
      <div class="header">
        <button routerLink="/dashboard" class="btn-back">⬅️ Back</button>
        <h1>New Chat</h1>
      </div>

      <div class="card">
        <div class="search-bar">
          <input type="text" [(ngModel)]="searchQuery" (input)="filterUsers()" placeholder="Search by name or email...">
        </div>

        <div class="users-grid">
           <div *ngFor="let user of filteredUsers()" class="user-item" (click)="openChat(user._id)">
              <div class="avatar" [style.background]="getUserColor(user.name)">
                {{ user.name.charAt(0) }}
              </div>
              <div class="info">
                <h3>{{ user.name }}</h3>
                <p>{{ user.email }}</p>
              </div>
              <div class="action-icon">→</div>
           </div>
           
           <div *ngIf="filteredUsers().length === 0" class="empty-state">
             No users found.
           </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .users-container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; animation: fadeIn 0.4s ease-out; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-back { border: none; background: none; color: #3b82f6; font-weight: 600; cursor: pointer; }
    
    .card { background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .search-bar { margin-bottom: 2rem; }
    .search-bar input { width: 100%; padding: 1rem 1.5rem; border: 1px solid #e2e8f0; border-radius: 1rem; background: #f8fafc; font-size: 1rem; outline: none; transition: 0.2s; }
    .search-bar input:focus { border-color: #3b82f6; background: white; box-shadow: 0 8px 15px rgba(59, 130, 246, 0.1); }
    
    .users-grid { display: flex; flex-direction: column; gap: 0.8rem; }
    .user-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 1rem; transition: 0.2s; cursor: pointer; border: 1px solid transparent; }
    .user-item:hover { background: #f1f5f9; border-color: #e2e8f0; transform: scale(1.02); }
    
    .avatar { width: 50px; height: 50px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.3rem; }
    .info { flex: 1; }
    .info h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .info p { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #64748b; }
    .action-icon { color: #cbd5e1; font-size: 1.5rem; font-weight: bold; }
    
    .empty-state { text-align: center; color: #94a3b8; padding: 3rem 0; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UsersListComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);

    allUsers = signal<any[]>([]);
    filteredUsers = signal<any[]>([]);
    searchQuery = '';

    ngOnInit() {
        this.authService.getAllUsers().subscribe(users => {
            // Filter out the current user
            const self = this.authService.user();
            const list = users.filter((u: any) => u._id !== self.id);
            this.allUsers.set(list);
            this.filteredUsers.set(list);
        });
    }

    filterUsers() {
        const query = this.searchQuery.toLowerCase();
        const result = this.allUsers().filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
        this.filteredUsers.set(result);
    }

    openChat(userId: string) {
        this.router.navigate(['/chat', userId]);
    }

    getUserColor(name: string = ''): string {
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}
