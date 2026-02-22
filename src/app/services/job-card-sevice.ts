import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface JobCardModel {
  id:                   number;
  parameterName:        string;
  unit:                 string;
  resultValue:          string;
  detectionLimit:       string;
  specificationLimit:   string;
  protocolUsed:         string;
  complies:             boolean;
  remarks:              string;
  isTechanicianChecked: boolean;
  isQualityChecked:     boolean;
  reportNo:             string;
  paremeterType:        string;
  analystName:          string;
  isNabl:               boolean;
  isApproved:           boolean;
  createdAt:            string;
  updatedAt:            string;
  // Enriched from Sample by reportNo
  sampleDescription?:   string;
  projectName?:         string;
  labName?:             string;
}

export interface GroupedJobCard {
  reportNo:           string;
  sampleDescription:  string;
  projectName:        string;
  labName:            string;
  status:             JobCardStatus;
  parameters:         JobCardModel[];
  analystName:        string;
  createdAt:          string;
}

export interface ApiResponse<T> {
  code:    string;
  data:    T;
  message: string;
  status:  'SUCCESS' | 'ERROR';
}

export type JobCardStatus = 'active' | 'completed' | 'inactive';

export function getJobCardStatus(jc: JobCardModel): JobCardStatus {
  // All false → INACTIVE
  if (!jc.isApproved && !jc.isTechanicianChecked && !jc.isQualityChecked) return 'inactive';

  // isApproved true, both checks false → ACTIVE
  if (jc.isApproved && !jc.isTechanicianChecked && !jc.isQualityChecked)  return 'active';

  // isApproved true, either technician OR quality check is true → COMPLETED
  if (jc.isApproved && (jc.isTechanicianChecked || jc.isQualityChecked))  return 'completed';

  // fallback
  return 'inactive';
}

@Injectable({
  providedIn: 'root',
})
export class JobCardSevice {
  
private baseUrl = 'http://localhost:8080/api/analyst';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        token:          localStorage.getItem('token') || '',
        'Content-Type': 'application/json',
      }),
    };
  }

  getJobCards(analystName: string): Observable<ApiResponse<JobCardModel[]>> {
    return this.http.post<ApiResponse<JobCardModel[]>>(
      `${this.baseUrl}/get/job/card`,
      { analystName },
      this.getHeaders()
    );
  }

  technicianCheck(reportNumber: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}/technician-check`,
      { reportNumber },
      this.getHeaders()
    );
  }

  qualityCheck(reportNumber: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}/quality-check`,
      { reportNumber },
      this.getHeaders()
    );
  }

getSampleByReportNumber(reportNumber: string): Observable<ApiResponse<any>> {
  return this.http.post<ApiResponse<any>>(
    `${this.baseUrl}/get/by-report-number`,
    { reportNumber },
    this.getHeaders()
  );
}

}