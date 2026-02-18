import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class QualityAuthLogin {
  

  private baseUrl = 'http://localhost:8080/api/quality';

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
