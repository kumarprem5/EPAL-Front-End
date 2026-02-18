import { Component } from '@angular/core';
import { Header } from "../../shared/header/header";
import { QualityAuthLogin } from '../../services/quality-auth-login';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quality-login',
  imports: [Header,CommonModule,FormsModule],
  templateUrl: './quality-login.html',
  styleUrl: './quality-login.css',
})
export class QualityLogin {

    loginData = {
    emailId: '',
    password: ''
  };

  errorMsg: string = '';
  passwordVisible: boolean = false;
  isLoading: boolean = false;

  constructor(
    private authService: QualityAuthLogin,
    private router: Router
  ) {}

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
    
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.passwordVisible ? 'text' : 'password';
    }
  }

  // Login method
  login(): void {
    // Clear previous error
    this.errorMsg = '';

    // Validation
    if (!this.loginData.emailId || !this.loginData.password) {
      this.errorMsg = 'Please enter both username and password';
      return;
    }

    // Additional validation
    if (this.loginData.emailId.trim().length < 3) {
      this.errorMsg = 'Username must be at least 3 characters';
      return;
    }

    if (this.loginData.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters';
      return;
    }

    // Show loading state
    this.isLoading = true;

    console.log('Login payload:', this.loginData);

    this.authService.sampleCollectorLogin(this.loginData)
      .subscribe({
        next: (res: any) => {
          console.log('Login response:', res);
          this.isLoading = false;

          if (res.status === 'SUCCESS' && res.code === '0') {
            const token = res.data?.authentication?.token;
            const name = res.data?.profile?.sampleCollectorName;
            
            if (token) {
              // Store authentication data
              localStorage.setItem('token', token);
              
              if (name) {
                localStorage.setItem('name', name);
              }

              // Store complete user profile if needed
              if (res.data?.profile) {
                localStorage.setItem('userProfile', JSON.stringify(res.data.profile));
              }

              // Navigate to dashboard
              this.router.navigate(['/quality/dashboard']);
            } else {
              this.errorMsg = 'Authentication token not received. Please try again.';
            }
          } else {
            // Handle specific error codes if any
            console.log('Login failed:', res.message);
            this.errorMsg = res.message || 'Login failed. Please check your credentials.';
          }
        },
        error: (err) => {
          console.error('Login error:', err);
          this.isLoading = false;

          // Handle different error scenarios
          if (err.status === 401) {
            this.errorMsg = 'Invalid username or password';
          } else if (err.status === 403) {
            this.errorMsg = 'Access denied. Please contact administrator.';
          } else if (err.status === 500) {
            this.errorMsg = 'Server error. Please try again later.';
          } else if (err.status === 0) {
            this.errorMsg = 'Network error. Please check your connection.';
          } else {
            this.errorMsg = err.error?.message || 'An error occurred. Please try again.';
          }
        }
      });
  }

  // Optional: Social login methods (implement when needed)
  loginWithGoogle(): void {
    console.log('Login with Google');
    // TODO: Implement Google OAuth login
    this.errorMsg = 'Social login coming soon!';
  }

  loginWithFacebook(): void {
    console.log('Login with Facebook');
    // TODO: Implement Facebook OAuth login
    this.errorMsg = 'Social login coming soon!';
  }

  loginWithApple(): void {
    console.log('Login with Apple');
    // TODO: Implement Apple OAuth login
    this.errorMsg = 'Social login coming soon!';
  }

  // Clear error message when user starts typing
  onInputChange(): void {
    if (this.errorMsg) {
      this.errorMsg = '';
    }
  }
}