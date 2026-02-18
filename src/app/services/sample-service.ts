import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface SampleDescriptionRequest {
  sampleDescription: string;
}

export interface TestParameter {
  defaultValues: string | undefined;
  id: number;
  parameterName: string;
  values?: string;
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

// Sample Result Interface (matches backend SampleResult entity)
export interface SampleResult {
  id?: number;
  unit: string;
  name: string;
  result: string;
  sampleDescription: string;
  protocal: string;
  standarded: string;
  isNABL?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SampleService {

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

  // ── SAMPLE ────────────────────────────────────────────────────────────────

  getAllSamples(filter: SampleFilterRequest): Observable<ApiResponse<PageResponse>> {
    return this.http.post<ApiResponse<PageResponse>>(`${this.baseUrl}/get/all`, filter, this.getHeaders());
  }

  addSample(data: Partial<Sample>): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(`${this.baseUrl}/add`, data, this.getHeaders());
  }

  updateSample(id: number, data: Partial<Sample>): Observable<ApiResponse<Sample>> {
    return this.http.put<ApiResponse<Sample>>(`${this.baseUrl}/update`, data,
      { headers: this.getHeaders().headers, params: { id: id.toString() } });
  }

  getById(id: number): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(`${this.baseUrl}/get/id`, { id }, this.getHeaders());
  }

  getByReportNumber(reportNumber: string): Observable<ApiResponse<Sample>> {
    return this.http.post<ApiResponse<Sample>>(`${this.baseUrl}/get/by-report-number`, { reportNumber }, this.getHeaders());
  }

  getAllSampleDescriptions(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get/sample-descriptions`, this.getHeaders());
  }

  // ── GENERAL INFO DROPDOWN TEMPLATES ──────────────────────────────────────
  // Returns TestParameter templates (NOT saved general info rows)

  getGeneralInfoDropDownsBySampleDescription(sampleDescription: string): Observable<ApiResponse<TestParameter[]>> {
    return this.http.post<ApiResponse<TestParameter[]>>(
      `${this.baseUrl}/test/parameter/by/sample-description`,
      { sampleDescription },
      this.getHeaders()
    );
  }

  // ── RESULT DROPDOWN TEMPLATES ─────────────────────────────────────────────
  // Returns SampleResultParameterDropDown templates (NOT saved sample results)

  getResultDropDownsBySampleDescription(sampleDescription: string): Observable<ApiResponse<SampleResult[]>> {
    return this.http.post<ApiResponse<SampleResult[]>>(
      `${this.baseUrl}/sample-result/dropdown/by-description`,
      { sampleDescription },
      this.getHeaders()
    );
  }

  // ── CASCADING DROPDOWNS ───────────────────────────────────────────────────

  getMasterCategories(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/master-category/by-sample-description`, this.getHeaders());
  }

  getSubCategoriesByMasterCategory(masterCategoryId: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/sub-category/by-master-id`, { id: masterCategoryId }, this.getHeaders());
  }

  getParameterGroupsBySubCategory(subCategoryId: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/parameter-group/sub-category-id`, { id: subCategoryId }, this.getHeaders());
  }

  getResultParametersByGroup(parameterGroupId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/parameter-result/sub-category-id`, { id: parameterGroupId }, this.getHeaders());
  }

  // ── SAMPLE RESULT CRUD ────────────────────────────────────────────────────

  createSampleResult(data: SampleResult): Observable<ApiResponse<SampleResult>> {
    return this.http.post<ApiResponse<SampleResult>>(`${this.baseUrl}/sample-result/create`, data, this.getHeaders());
  }

  updateSampleResult(data: SampleResult): Observable<ApiResponse<SampleResult>> {
    return this.http.put<ApiResponse<SampleResult>>(`${this.baseUrl}/sample-result/update`, data, this.getHeaders());
  }

  findSampleResultsByDescription(sampleDescription: string): Observable<ApiResponse<SampleResult[]>> {
    return this.http.post<ApiResponse<SampleResult[]>>(
      `${this.baseUrl}/sample-result/find-by-description`,
      { sampleDescription },
      this.getHeaders()
    );
  }

  deleteSampleResult(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/sample-result/delete`,
      { headers: this.getHeaders().headers, params: { id: id.toString() } }
    );
  }

  getTestParametersBySampleDescription(sampleDescription: string): Observable<ApiResponse<TestParameter[]>> {
  return this.http.post<ApiResponse<TestParameter[]>>(
    `${this.baseUrl}/test/parameter/by/sample-description`,
    { sampleDescription },
    this.getHeaders()
  );
}

}