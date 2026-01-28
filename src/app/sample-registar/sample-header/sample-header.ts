import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sample-header',
  imports: [],
  templateUrl: './sample-header.html',
  styleUrl: './sample-header.css',
})
export class SampleHeader {

 userName: string = ''; // Replace with actual user data


 ngOnInit() {
    // Fetch username from localStorage
    const storedUser = localStorage.getItem('name'); // Key must match what you store
   this.userName = storedUser ? storedUser : 'Guest'; // fallback if not found
  } 

  constructor(private router: Router) {}

  logout() {
    // Clear auth data here (localStorage, cookies, etc.)
     localStorage.removeItem('name'); 
     localStorage.removeItem('token'); 
    this.router.navigate(['/home']);
  }

}
