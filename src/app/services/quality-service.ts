import { Injectable } from '@angular/core';
import { QualityAuthLogin } from './quality-auth-login';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class QualityService {
  
  
  private baseUrl = 'http://localhost:8080/api/quality';

  constructor(private http: HttpClient) {}

  // ✅ Reads token from both possible keys for safety
  private getHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('qualityToken') ||
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
  // Backend returns: { status: 'SUCCESS', data: Sample | Sample[] | PageResponse, message: string, code: string }
  // ─────────────────────────────────────────────

  getSampleByReportNumber(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/get/by-report-number`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }

  searchByCompanyName(companyName: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/get/all`,
      { page: 0, size: 100, companyName },
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

  getAllSamples(filter: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/get/all`,
      filter,
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
  // QUALITY CHECK (QA APPROVAL)
  // ─────────────────────────────────────────────

  /**
   * Approve sample for quality check
   * Sets qualityChecked = true
   */
  qualityCheck(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/quality-check`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────
  // PRINT REPORT
  // ─────────────────────────────────────────────

  /**
   * Get complete report data for printing
   * Only available if qualityChecked = true
   */
  getReportData(reportNumber: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/report/generate`,
      { reportNumber },
      { headers: this.getHeaders() }
    );
  }
}