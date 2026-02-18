import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GeneralInformationModel {
  id?: number;
  name: string;
  value: string;
  reportNumber: string;
  sampleDescription?: string;
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

   private baseUrl = 'http://localhost:8080/api/collector/samples';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'token':        localStorage.getItem('token') || '',
        'Content-Type': 'application/json',
      }),
    };
  }

  // ── ADD ───────────────────────────────────────────────────────────────────
  // POST /api/collector/samples/general-information/add
  // ✅ Sends: { name, value, reportNumber, sampleDescription }
  addInformation(info: GeneralInformationModel): Observable<ApiResponse<GeneralInformationModel>> {
    const payload = {
      name:              info.name,
      value:             info.value,
      reportNumber:      info.reportNumber,      // ✅ required — must not be empty
      sampleDescription: info.sampleDescription ?? '',
    };
    return this.http.post<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/general-information/add`,
      payload,
      this.getHeaders()
    );
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  // PUT /api/collector/samples/general-information/update
  // ✅ Sends: { id, name, value, reportNumber, sampleDescription }
  updateInformation(info: GeneralInformationModel): Observable<ApiResponse<GeneralInformationModel>> {
    const payload = {
      id:                info.id,
      name:              info.name,
      value:             info.value,
      reportNumber:      info.reportNumber,      // ✅ required
      sampleDescription: info.sampleDescription ?? '',
    };
    return this.http.put<ApiResponse<GeneralInformationModel>>(
      `${this.baseUrl}/general-information/update`,
      payload,
      this.getHeaders()
    );
  }

  // ── GET by report number ──────────────────────────────────────────────────
  // POST /api/collector/samples/general-information/by-report
  getByReportNumber(reportNumber: string): Observable<ApiResponse<GeneralInformationModel[]>> {
    return this.http.post<ApiResponse<GeneralInformationModel[]>>(
      `${this.baseUrl}/general-information/by-report`,
      { reportNumber },
      this.getHeaders()
    );
  }

  // ── GET by sample description ─────────────────────────────────────────────
  // POST /api/collector/samples/general-information/by-sample-description
  // ⚠️  Add this endpoint to your Spring Boot controller if not already present
  getBySampleDescription(sampleDescription: string): Observable<ApiResponse<GeneralInformationModel[]>> {
    return this.http.post<ApiResponse<GeneralInformationModel[]>>(
      `${this.baseUrl}/general-information/by-sample-description`,
      { sampleDescription },
      this.getHeaders()
    );
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  // DELETE /api/collector/samples/general-information/delete?id=1
  deleteInformation(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/general-information/delete`,
      {
        headers: this.getHeaders().headers,
        params:  { id: id.toString() },
      }
    );
  }
}