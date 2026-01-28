import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface Sample {
  reportNumber: string;
  sampleDescription: string;
  createdAt: string;
  qualityChecked: boolean;
}

export interface ApiResponse {
  code: string;
  data: {
    content: Sample[];
    totalElements: number;
  };
  message: string;
  status: string;
}

export interface SampleFilterRequest {
  page: number;
  size: number;
  fromDate: string;
  toDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class SampleAuthService {

  private baseUrl = 'http://localhost:8080/api/collector/samples';

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
