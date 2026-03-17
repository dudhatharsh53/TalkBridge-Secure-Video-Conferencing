import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 400px; margin-top: 100px;">
      <div class="card">
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem;">
          <h2 style="margin-bottom: 0.5rem; text-align: center;">Welcome Back</h2>
          <p style="color: grey; font-size: 0.9rem;">Sign in to continue to TalkBridge</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              formControlName="email" 
              placeholder="name@example.com"
              [class.is-invalid]="isFieldInvalid('email')"
            >
            <div *ngIf="isFieldInvalid('email')" class="error-message">
              {{ getErrorMessage('email') }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              formControlName="password" 
              placeholder="••••••••"
              [class.is-invalid]="isFieldInvalid('password')"
            >
            <div *ngIf="isFieldInvalid('password')" class="error-message">
              {{ getErrorMessage('password') }}
            </div>
          </div>
          
          <button 
            type="submit" 
            class="btn-primary" 
            style="width: 100%; margin-top: 1rem;" 
            [disabled]="loading()"
          >
            {{ loading() ? 'Logging in...' : 'Login' }}
          </button>
        </form>
        
        <p style="margin-top: 1.5rem; text-align: center; font-size: 0.875rem;">
          Don't have an account? <a routerLink="/register" style="color: var(--primary-color); font-weight: 600;">Register</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loginForm: FormGroup;
  loading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) return 'This field is required';
    if (control?.hasError('email')) return 'Invalid email format';
    return '';
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields correctly');
      return;
    }

    this.loading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.toastService.success('Login successful! Welcome back.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Login failed. Please check your credentials.');
        this.loading.set(false);
      }
    });
  }
}
