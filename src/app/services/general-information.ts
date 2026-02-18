import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeneralInformationModel } from '../models/general-information';



export interface ApiResponse<T> {
  code: string;
  data: T;
  message: string;
  status: 'SUCCESS' | 'ERROR';
}

@Injectable({
  providedIn: 'root',
})
export class GeneralInformationservice{

 // ✅ FIXED: correct base URL (matches sample-service.ts)
  private baseUrl = 'http://localhost:8080/api/collector/samples';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        token: localStorage.getItem('token') || '',
        'Content-Type': 'application/json',
      }),
    };
  }

  addInformation(data: GeneralInformationModel): Observable<ApiResponse<GeneralInformationModel>> {
    return this.http.post<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/general-information/add`,
      data,
      this.getHeaders()
    );
  }

  updateInformation(data: GeneralInformationModel): Observable<ApiResponse<GeneralInformationModel>> {
    return this.http.put<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/general-information/update`,
      data,
      this.getHeaders()
    );
  }

  getByReportNumber(reportNumber: string): Observable<ApiResponse<GeneralInformationModel[]>> {
    return this.http.post<ApiResponse<GeneralInformationModel[]>>(
      `${this.baseUrl}/general-information/by-report`,
      { reportNumber },
      this.getHeaders()
    );
  }

  deleteInformation(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/general-information/delete`,
      {
        headers: this.getHeaders().headers,
        params: { id: id.toString() },
      }
    );
  }
}