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

 private baseUrl = 'http://localhost:8080/api/collector/samples/general-information';

  constructor(private http: HttpClient) {}  

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        token: localStorage.getItem('token') || '',
        'Content-Type': 'application/json'
      })
    };
  }

  addInformation(
    data: GeneralInformationModel
  ): Observable<ApiResponse<GeneralInformationModel>> {
    return this.http.post<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/add`,
      data,
      this.getHeaders()
    );
  }

  updateInformation(
    data: GeneralInformationModel
  ): Observable<ApiResponse<GeneralInformationModel>> {
    return this.http.put<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/update`,
      data,
      this.getHeaders()
    );
  }

  getByReportNumber(
    reportNumber: string
  ): Observable<ApiResponse<GeneralInformationModel[]>> {
    return this.http.post<ApiResponse<GeneralInformationModel[]>>(
      `${this.baseUrl}/by-report`,
      { reportNumber },
      this.getHeaders()
    );
  }
}