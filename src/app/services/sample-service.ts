import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

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

// ── SampleResultParameterDropDown — template/source entity from backend ───────
export interface SampleResult {
  id?: number;
  unit: string;
  name: string;
  result: string;
  reportNumber?: string;
  sampleDescription: string;
  protocal: string;
  standarded: string;
  parameterType?: string;
  scopeYear?: string;
  isNABL?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── TestParameterResult — actual saved result row (TestParameterResultRequest) ─
// Fields map directly to TestParameterResultRequest on the backend.
// Pre-filled from SampleResultParameterDropDown templates; user edits resultValue etc.
export interface TestParameterResult {
  id?:                number;
  parameterName:      string;    // ← from SampleResult.name
  unit:               string;    // ← from SampleResult.unit
  resultValue:        string;    // user fills this
  detectionLimit:     string;    // user fills this
  specificationLimit: string;    // ← from SampleResult.standarded
  protocolUsed:       string;    // ← from SampleResult.protocal
  complies:           boolean;   // checkbox
  remarks:            string;    // user fills this
  reportNo:           string;    // stamped on Save All
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

  getGeneralInfoDropDownsBySampleDescription(sampleDescription: string): Observable<ApiResponse<TestParameter[]>> {
    return this.http.post<ApiResponse<TestParameter[]>>(
      `${this.baseUrl}/test/parameter/by/sample-description`,
      { sampleDescription },
      this.getHeaders()
    );
  }

  // ── RESULT DROPDOWN TEMPLATES ─────────────────────────────────────────────
  // POST /sample-result/find-by-description → raw List<SampleResultParameterDropDown>
  // Wrapped into ApiResponse shape for consistent component handling.

  getResultDropDownsBySampleDescription(sampleDescription: string): Observable<ApiResponse<SampleResult[]>> {
    return this.http.post<any>(
      `${this.baseUrl}/sample-result/find-by-description`,
      { sampleDescription },
      this.getHeaders()
    ).pipe(
      map((data: any) => {
        if (Array.isArray(data)) {
          return { status: 'SUCCESS', data, code: '200', message: 'OK' } as ApiResponse<SampleResult[]>;
        }
        return data as ApiResponse<SampleResult[]>;
      })
    );
  }

  // ── SAMPLE RESULT DROPDOWN CRUD ───────────────────────────────────────────

  createSampleResult(data: SampleResult): Observable<SampleResult> {
    return this.http.post<SampleResult>(`${this.baseUrl}/sample-result/create`, data, this.getHeaders());
  }

  updateSampleResult(data: SampleResult): Observable<SampleResult> {
    return this.http.put<SampleResult>(`${this.baseUrl}/sample-result/update`, data, this.getHeaders());
  }

  findSampleResultsByDescription(sampleDescription: string): Observable<ApiResponse<SampleResult[]>> {
    return this.http.post<any>(
      `${this.baseUrl}/sample-result/find-by-description`,
      { sampleDescription },
      this.getHeaders()
    ).pipe(
      map((data: any) => {
        if (Array.isArray(data)) {
          return { status: 'SUCCESS', data, code: '200', message: 'OK' } as ApiResponse<SampleResult[]>;
        }
        return data as ApiResponse<SampleResult[]>;
      })
    );
  }

  deleteSampleResult(id: number): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/sample-result/delete`,
      { result: id.toString() },
      this.getHeaders()
    );
  }

  // ── TEST PARAMETER RESULT CRUD ────────────────────────────────────────────
  // POST /create/result    → creates TestParameterResult row (RestApiResponse)
  // PUT  /update/result    → updates TestParameterResult row (RestApiResponse)
  // GET  /result/by-report-no?reportNo=XX → list of saved results for a report

  createTestParameterResult(data: TestParameterResult): Observable<ApiResponse<TestParameterResult>> {
    return this.http.post<ApiResponse<TestParameterResult>>(
      `${this.baseUrl}/create/result`,
      data,
      this.getHeaders()
    );
  }

  updateTestParameterResult(data: TestParameterResult): Observable<ApiResponse<TestParameterResult>> {
    return this.http.put<ApiResponse<TestParameterResult>>(
      `${this.baseUrl}/update/result`,
      data,
      this.getHeaders()
    );
  }

  getTestParameterResultsByReportNo(reportNo: string): Observable<ApiResponse<TestParameterResult[]>> {
    return this.http.get<ApiResponse<TestParameterResult[]>>(
      `${this.baseUrl}/result/by-report-no`,
      {
        headers: this.getHeaders().headers,
        params: { reportNo },
      }
    );
  }

  getTestParametersBySampleDescription(sampleDescription: string): Observable<ApiResponse<TestParameter[]>> {
    return this.http.post<ApiResponse<TestParameter[]>>(
      `${this.baseUrl}/test/parameter/by/sample-description`,
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
}
