import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SampleAuthService } from '../../services/sample-auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Header } from "../../shared/header/header";

@Component({
  selector: 'app-sample-login',
  imports: [FormsModule, CommonModule, Header],
  templateUrl: './sample-login.html',
  styleUrl: './sample-login.css',
})
export class SampleLogin {

    loginData = {
    emailId: '',
    password: ''
  };

  errorMsg = '';

  constructor(
    private authService: SampleAuthService,
    private router: Router
  ) {}

  login() {
  console.log('Login payload:', this.loginData);

  this.authService.sampleCollectorLogin(this.loginData)
  .subscribe({
    next: (res: any) => {
      console.log('Login response:', res);

      if (res.status === 'SUCCESS' && res.code === '0') {
        const token = res.data?.authentication?.token;
        const name = res.data?.profile?.sampleCollectorName
        if (token) {
          localStorage.setItem('token', token);
           localStorage.setItem('name', name);
          this.router.navigate(['/sample/dashboard']);
        } else {
          this.errorMsg = 'Token not received from server';
        }

      } else {
  console.log('Login failed:', res.message);
  this.errorMsg = res.message || 'Login failed';
}
    },
    error: (err) => {
      console.error(err);
      this.errorMsg = 'Server error. Try again.';
    }
  });

}

}

