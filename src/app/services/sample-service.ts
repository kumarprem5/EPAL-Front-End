import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SampleDescriptionRequest {
  sampleDescription: string;
}

export interface TestParameter {
  id: number;
  parameterName: string;
  values?: string;
  // Add other fields as needed based on your backend response
}


export interface SampleFilterRequest {
  page: number;
  size: number;
  fromDate?: string;
  toDate?: string;
}

export interface Sample {
  id: number;
  address: string | null;
  createdAt: string;
  dateOfReceiving: string;
  formatNumber: string | null;
  partyReferenceNumber: string;
  periodOfAnalysis: string;
  projectName: string | null;
  qualityChecked: boolean;
  reportNumber: string;
  reportingDate: string;
  sampleDescription: string;
  sampleNumber: string;
  samplingAndAnalysisProtocol: string;
  techanicianChecked: boolean;
  updatedAt: string;
  urlNo: string | null;
}

export interface PageResponse {
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: Sample[];
}

export interface ApiResponse<T> {
  code: string;
  data: T;
  message: string;
  status: 'SUCCESS' | 'ERROR';
}
export interface SampleDescriptionRequest {
  sampleDescription: string;
}

export interface TestParameter {
  id: number;
  parameterName: string;
  unit?: string;
  // Add other fields as needed based on your backend response
}


@Injectable({
  providedIn: 'root',
})
export class SampleService {

   private baseUrl = 'http://localhost:8080/api/collector/samples';

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

  getAllSamples(filter: SampleFilterRequest): Observable<ApiResponse<PageResponse>> {
    console.log('Fetching samples with filter:', filter);
    return this.http.post<ApiResponse<PageResponse>>(
      `${this.baseUrl}/get/all`,
      filter,
      this.getHeaders()
    );
  }

  addSample(data: Partial<Sample>): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(
      `${this.baseUrl}/add`,
      data,
      this.getHeaders()
    );
  }

  updateSample(id: number, data: Partial<Sample>): Observable<ApiResponse<Sample>> {
    return this.http.put<ApiResponse<Sample>>(
      `${this.baseUrl}/update`, 
      data, 
      {
        headers: this.getHeaders().headers,
        params: { id: id.toString() }
      }
    );
  }

  getById(id: number): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(
      `${this.baseUrl}/get/id`,
      { id: id },
      { headers: this.getHeaders().headers }
    );
  }

  getByReportNumber(reportNumber: string): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(
      `${this.baseUrl}/get/by-report-number`,
      { reportNumber },
      this.getHeaders()
    );
  }

  technicianCheck(reportNumber: string): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(
      `${this.baseUrl}/technician-check`,
      { reportNumber },
      this.getHeaders()
    );
  }

  qualityCheck(reportNumber: string): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(
      `${this.baseUrl}/quality-check`,
      { reportNumber },
      this.getHeaders()
    );
  }

  getAllSampleDescriptions(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(
      `${this.baseUrl}/get/sample-descriptions`,
      this.getHeaders()
    );
  }

  getTestParametersBySampleDescription(sampleDescription: string): Observable<ApiResponse<TestParameter[]>> {
    const request: SampleDescriptionRequest = { sampleDescription };
    return this.http.post<ApiResponse<TestParameter[]>>(
      `${this.baseUrl}/test/parameter/by/sample-description`,
      request,
      this.getHeaders()
    );
  }

  // Update test parameter (you'll need to implement the backend endpoint)
  updateTestParameter(parameter: TestParameter): Observable<ApiResponse<TestParameter>> {
    return this.http.put<ApiResponse<TestParameter>>(
      `${this.baseUrl}/test/parameter/update`,
      parameter,
      {
        headers: this.getHeaders().headers,
        params: { id: parameter.id.toString() }
      }
    );
  }
}
