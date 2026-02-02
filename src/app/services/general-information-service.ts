import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GeneralInformationModel {
  id?: number;
  name: string;
  value: string;
  reportNumber: string;
}

export interface ApiResponse<T> {
  code: string;
  data: T;
  message: string;
  status: 'SUCCESS' | 'ERROR';
}

@Injectable({
  providedIn: 'root',
})
export class GeneralInformationService {

 private baseUrl = 'http://localhost:8080/api/collector';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') || '';
    return {
      headers: new HttpHeaders({
        'token': token,
        'Content-Type': 'application/json'
      })
    };
  }

  // Get general information by report number
  getByReportNumber(reportNumber: string): Observable<ApiResponse<GeneralInformationModel[]>> {
    return this.http.post<ApiResponse<GeneralInformationModel[]>>(
      `${this.baseUrl}/general-information/by-report`,
      { reportNumber },
      this.getHeaders()
    );
  }

  // Add new general information
  addInformation(info: GeneralInformationModel): Observable<ApiResponse<GeneralInformationModel>> {
    return this.http.post<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/general-information/add`,
      info,
      this.getHeaders()
    );
  }

  // Update existing general information
  updateInformation(info: GeneralInformationModel): Observable<ApiResponse<GeneralInformationModel>> {
    return this.http.put<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/general-information/update`,
      info,
      this.getHeaders()
    );
  }

  // Delete general information
  deleteInformation(id: number): Observable<ApiResponse<any>> {
    const deleteUrl = `${this.baseUrl}/samples/general-information/delete`;
    
    console.log('🗑️ Deleting information ID:', id);
    console.log('📍 Full URL:', deleteUrl);
    console.log('📍 With params:', `${deleteUrl}?id=${id}`);
    
    return this.http.delete<ApiResponse<any>>(
      deleteUrl,
      {
        headers: this.getHeaders().headers,
        params: { id: id }
      }
    );
  }

  
}