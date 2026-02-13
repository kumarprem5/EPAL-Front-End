import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AnalystAuth {

  private baseUrl = 'http://localhost:8080/api/analyst';

  constructor(private http: HttpClient) {}

  sampleCollectorLogin(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

   


  logout() {
    return this.http.get(`${this.baseUrl}/logout`, {
      headers: {
        token: localStorage.getItem('token') || ''
      }
    });
  }
  
}
