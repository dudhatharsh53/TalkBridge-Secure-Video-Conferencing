import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container fixed top-10 right-10 z-[1000] flex flex-col gap-3">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="toast-item"
        [ngClass]="{
          'toast-success': toast.type === 'success',
          'toast-error': toast.type === 'error',
          'toast-warning': toast.type === 'warning',
          'toast-info': toast.type === 'info'
        }"
        (click)="toastService.remove(toast.id)"
      >
        <div class="flex items-center gap-3">
          <span class="icon">
            <svg *ngIf="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg *ngIf="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg *ngIf="toast.type === 'warning' || toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <p class="font-medium" style="margin: 0; font-weight: 600;">{{ toast.message }}</p>
        </div>
        <button class="close-btn">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast-container {
      position: fixed;
      top: 2rem;
      right: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 9999;
    }
    .toast-item {
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      min-width: 340px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
      animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .toast-success { background-color: #059669; border-left: 6px solid #064e3b; }
    .toast-error { background-color: #dc2626; border-left: 6px solid #7f1d1d; }
    .toast-warning { background-color: #d97706; border-left: 6px solid #78350f; }
    .toast-info { background-color: #2563eb; border-left: 6px solid #1e3a8a; }
    
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-3 { gap: 0.75rem; }
    .font-medium { font-weight: 500; }
    
    .icon svg { width: 1.5rem; height: 1.5rem; }
    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0 0.5rem;
      line-height: 1;
    }
    .close-btn:hover { color: white; }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
