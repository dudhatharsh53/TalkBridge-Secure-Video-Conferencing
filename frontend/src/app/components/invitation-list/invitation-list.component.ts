import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvitationService } from '../../services/invitation.service';
import { ToastService } from '../../services/toast.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-invitation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="inv-container">
      <div class="header">
        <button routerLink="/dashboard" class="btn-back">⬅️ Back to Dashboard</button>
        <h1>Invitation Center</h1>
      </div>

      <div class="tab-scroller">
        <div class="tabs">
          <button [class.active]="activeTab() === 'received'" (click)="activeTab.set('received')">
            Received <span>{{ received().length }}</span>
          </button>
          <button [class.active]="activeTab() === 'sent'" (click)="activeTab.set('sent')">
            Sent <span>{{ sent().length }}</span>
          </button>
        </div>
      </div>

      <div class="inv-card">
        <div *ngIf="activeTab() === 'received'" class="fade-in">
          <div *ngIf="loading()" class="loading-state">Loading invitations...</div>
          <div *ngIf="!loading() && received().length === 0" class="empty-state">
             <div class="icon">📭</div>
             <p>No invitations received yet.</p>
          </div>

          <div *ngIf="!loading() && received().length > 0" class="list">
            <div *ngFor="let inv of received()" class="item">
              <div class="user-part">
                <div class="avatar" [style.background]="getUserColor(inv.sender?.name)">
                  {{ inv.sender?.name?.charAt(0) }}
                </div>
                <div class="info">
                  <div class="name">{{ inv.sender?.name }}</div>
                  <div class="email-sub">{{ inv.sender?.email }}</div>
                </div>
              </div>
              <div class="meeting-part">
                <div class="mtg-id">Room ID: {{ inv.meetingId }}</div>
                <div class="status-badge" [class]="inv.status">{{ inv.status }}</div>
              </div>
              <div class="actions">
                <ng-container *ngIf="inv.status === 'pending'">
                  <button (click)="updateStatus(inv._id, 'accepted')" class="btn-accept">Accept</button>
                  <button (click)="updateStatus(inv._id, 'rejected')" class="btn-reject">Decline</button>
                </ng-container>
                <button *ngIf="inv.status === 'accepted'" (click)="joinMeeting(inv.meetingId)" class="btn-join">Join Room</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="activeTab() === 'sent'" class="fade-in">
          <div *ngIf="loading()" class="loading-state">Loading sent invites...</div>
          <div *ngIf="!loading() && sent().length === 0" class="empty-state">
             <div class="icon">✉️</div>
             <p>You haven't sent any invitations yet.</p>
          </div>

          <div *ngIf="!loading() && sent().length > 0" class="list">
             <div *ngFor="let inv of sent()" class="item">
               <div class="target-part">
                  <div class="email-main">{{ inv.receiverEmail }}</div>
                  <div class="mtg-sub">Room: {{ inv.meetingId }}</div>
               </div>
               <div class="status-part">
                  <div class="status-badge" [class]="inv.status">{{ inv.status }}</div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inv-container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-back { background: none; border: none; color: #3b82f6; font-weight: 600; cursor: pointer; }
    
    .tab-scroller { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .tabs { display: flex; gap: 0.5rem; background: #e2e8f0; padding: 0.3rem; border-radius: 1rem; }
    .tabs button { border: none; background: none; padding: 0.7rem 1.5rem; border-radius: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
    .tabs button.active { background: white; color: #3b82f6; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .tabs button span { background: #f1f5f9; padding: 0.1rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; margin-left: 0.5rem; color: #3b82f6; }
    
    .inv-card { background: white; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); min-height: 400px; }
    
    .item { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 1rem; align-items: center; padding: 1.25rem; border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
    .item:hover { background: #f8fafc; border-radius: 1rem; }
    .item:last-child { border-bottom: none; }
    
    .user-part { display: flex; align-items: center; gap: 1rem; }
    .avatar { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem; }
    .info .name { font-weight: 600; color: #1e293b; }
    .email-sub { font-size: 0.8rem; color: #94a3b8; }
    
    .mtg-id { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .status-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; margin-top: 0.4rem; background: #f1f5f9; color: #64748b; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.accepted { background: #dcfce7; color: #16a34a; }
    .status-badge.rejected { background: #fce7f3; color: #be185d; }
    
    .actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .btn-accept { background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.6rem; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
    .btn-reject { background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.6rem; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
    .btn-join { background: #3b82f6; color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 0.6rem; font-weight: 600; cursor: pointer; font-size: 0.85rem; }

    .target-part .email-main { font-weight: 600; color: #1e293b; }
    .target-part .mtg-sub { font-size: 0.8rem; color: #94a3b8; }

    .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
    .empty-state .icon { font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.5; }
    .loading-state { text-align: center; padding: 3rem; color: #64748b; font-style: italic; }

    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class InvitationListComponent implements OnInit {
  public invitationService = inject(InvitationService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  activeTab = signal<'received' | 'sent'>('received');
  received = signal<any[]>([]);
  sent = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    // Combine loading to avoid multiple spinners
    this.invitationService.getReceivedInvitations().subscribe({
      next: (res) => {
        this.received.set(res);
        this.invitationService.getSentInvitations().subscribe({
          next: (sentRes) => {
            this.sent.set(sentRes);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Failed to load invitations');
      }
    });
  }

  updateStatus(id: string, status: 'accepted' | 'rejected') {
    this.invitationService.updateStatus(id, status).subscribe({
      next: () => {
        this.toastService.success(`Invitation ${status}`);
        this.loadAll();
      },
      error: () => this.toastService.error('Failed to update status')
    });
  }

  joinMeeting(roomId: string) {
    this.router.navigate(['/meeting', roomId]);
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

