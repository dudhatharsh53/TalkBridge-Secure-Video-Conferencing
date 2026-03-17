import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 450px; margin-top: 50px; padding-bottom: 50px;">
      <div class="card">
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem;">
          <h2 style="margin-bottom: 0.5rem; text-align: center;">Create Account</h2>
          <p style="color: grey; font-size: 0.9rem;">Join TalkBridge today</p>
        </div>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- Full Name -->
          <div class="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              formControlName="name" 
              placeholder="John Doe"
              [class.is-invalid]="isFieldInvalid('name')"
            >
            <div *ngIf="isFieldInvalid('name')" class="error-message">
              {{ getErrorMessage('name') }}
            </div>
          </div>

          <!-- Email -->
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

          <!-- Mobile Number -->
          <div class="form-group">
            <label>Mobile Number</label>
            <input 
              type="text" 
              formControlName="mobileNo" 
              placeholder="10-digit mobile number"
              [class.is-invalid]="isFieldInvalid('mobileNo')"
            >
            <div *ngIf="isFieldInvalid('mobileNo')" class="error-message">
              {{ getErrorMessage('mobileNo') }}
            </div>
          </div>
          
          <!-- Password -->
          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              formControlName="password" 
              placeholder="Min 6 characters"
              [class.is-invalid]="isFieldInvalid('password')"
            >
            <div *ngIf="isFieldInvalid('password')" class="error-message">
              {{ getErrorMessage('password') }}
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              formControlName="confirmPassword" 
              placeholder="••••••••"
              [class.is-invalid]="isFieldInvalid('confirmPassword')"
            >
            <div *ngIf="isFieldInvalid('confirmPassword')" class="error-message">
              {{ getErrorMessage('confirmPassword') }}
            </div>
          </div>
          
          <button 
            type="submit" 
            class="btn-primary" 
            style="width: 100%; margin-top: 1rem;" 
            [disabled]="loading()"
          >
            {{ loading() ? 'Creating Account...' : 'Register' }}
          </button>
        </form>
        
        <p style="margin-top: 1.5rem; text-align: center; font-size: 0.875rem;">
          Already have an account? <a routerLink="/login" style="color: var(--primary-color); font-weight: 600;">Login</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  registerForm: FormGroup;
  loading = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      mobileNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.hasError('required')) return 'This field is required';
    if (control?.hasError('minlength')) return `Minimum ${control.errors?.['minlength'].requiredLength} characters required`;
    if (control?.hasError('email')) return 'Invalid email format';
    if (control?.hasError('pattern')) return 'Mobile number must be 10 digits';
    if (control?.hasError('passwordMismatch')) return 'Passwords do not match';
    return '';
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields correctly');
      return;
    }

    this.loading.set(true);
    const { confirmPassword, ...userData } = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: () => {
        this.toastService.success('Account created successfully!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Registration failed');
        this.loading.set(false);
      }
    });
  }
}
