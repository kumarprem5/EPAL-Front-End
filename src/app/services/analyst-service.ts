import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalystService {
  
 private baseUrl = 'http://localhost:8080/api/analyst';

  constructor(private http: HttpClient) {}

  // ✅ Reads token from both possible keys for safety
  private getHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('analystToken') ||
      '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'token': token
    });
  }

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  logout(): Observable<any> {
    return this.http.get(`${this.baseUrl}/logout`, { headers: this.getHeaders() });
  }

  // ─────────────────────────────────────────────
  // SAMPLE SEARCH
  // Backend returns: { status: 'SUCCESS', data: Sample | PageResponse, message: string, code: string }
  // ─────────────────────────────────────────────

  getSampleByReportNumber(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/get/by-report-number`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }

  searchByCompanyName(companyName: string): Observable<any> {
    // Uses the general "get all" endpoint filtered by page; adjust if a
    // dedicated /search/by-company endpoint is available in your backend.
    return this.http.post(
      `${this.baseUrl}/get/all`,
      { page: 0, size: 50, companyName },
      { headers: this.getHeaders() }
    );
  }

  getSampleById(id: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/get/id`,
      { id },
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────
  // GENERAL INFORMATION
  // ─────────────────────────────────────────────

  getGeneralInformationByReportNumber(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/general-information/by-report`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }

  addGeneralInformation(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/general-information/add`,
      data,
      { headers: this.getHeaders() }
    );
  }

  updateGeneralInformation(data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/general-information/update`,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteGeneralInformation(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/general-information/delete?id=${id}`,
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────
  // SAMPLE RESULT
  // ─────────────────────────────────────────────

  getSampleResultsByDescription(sampleDescription: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/sample-result/find-by-description`,
      { sampleDescription },
      { headers: this.getHeaders() }
    );
  }

  createSampleResult(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/sample-result/create`,
      data,
      { headers: this.getHeaders() }
    );
  }

  updateSampleResult(data: any): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/sample-result/update`,
      data,
      { headers: this.getHeaders() }
    );
  }

  deleteSampleResult(id: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/sample-result/delete`,
      { result: id.toString() },
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────
  // MASTER DATA (categories / groups / parameters)
  // ─────────────────────────────────────────────

  getMasterCategories(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/master-category/by-sample-description`,
      { headers: this.getHeaders() }
    );
  }

  getSubCategories(masterCategoryId: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/sub-category/by-master-id`,
      { id: masterCategoryId },
      { headers: this.getHeaders() }
    );
  }

  getParameterGroups(subCategoryId: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/parameter-group/sub-category-id`,
      { id: subCategoryId },
      { headers: this.getHeaders() }
    );
  }

  getResultParameters(parameterGroupId: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/parameter-result/sub-category-id`,
      { id: parameterGroupId },
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────
  // WORKFLOW ACTIONS
  // ─────────────────────────────────────────────

  technicianCheck(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/technician-check`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }

  qualityCheck(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/quality-check`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }
}