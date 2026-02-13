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
export class AnalystSampleService {
  
   private baseUrl = 'http://localhost:8080/api/analyst';

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

getMasterCategories(): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/master-category/by-sample-description`,
    {
      headers: this.getHeaders().headers
    }
  );
}



getMasterCategoryById(id: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/master-categories/${id}`);
}

addMasterCategory(masterCategory: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/master-categories`, masterCategory);
}

updateMasterCategory(masterCategory: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/master-categories/${masterCategory.id}`, masterCategory);
}

deleteMasterCategory(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/master-categories/${id}`);
}

// =========================
// SUBCATEGORY METHODS
// =========================
getSubCategoriesByMasterCategory(
  masterCategoryId: number
): Observable<any[]> {

  const body = {
    id: masterCategoryId
  };

  return this.http.post<any[]>(
    `${this.baseUrl}/sub-category/by-master-id`,
    body,
    this.getHeaders()
  );
}



getSubCategoryById(id: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/sub-categories/${id}`);
}

addSubCategory(subCategory: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/sub-categories`, subCategory);
}

updateSubCategory(subCategory: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/sub-categories/${subCategory.id}`, subCategory);
}

deleteSubCategory(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/sub-categories/${id}`);
}

// =========================
// PARAMETER GROUP METHODS
// =========================

// getSubCategoriesByMasterCategory(
//   masterCategoryId: number
// ): Observable<any[]> {

//   const body = {
//     id: masterCategoryId
//   };

//   return this.http.post<any[]>(
//     `${this.baseUrl}/sub-category/by-master-id`,
//     body,
//     this.getHeaders()
//   );
// }


getParameterGroupsBySubCategory(subCategoryId: number): Observable<any[]> {
  const body = {
    id: subCategoryId
  };
  return this.http.post<any[]>(
    `${this.baseUrl}/parameter-group/sub-category-id`,
    body,
    this.getHeaders()
  );
}

getParameterGroupById(id: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/parameter-groups/${id}`);
}

addParameterGroup(parameterGroup: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/parameter-groups`, parameterGroup);
}

updateParameterGroup(parameterGroup: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/parameter-groups/${parameterGroup.id}`, parameterGroup);
}

deleteParameterGroup(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/parameter-groups/${id}`);
}

// =========================
// RESULT PARAMETER METHODS
// =========================


// getParameterGroupsBySubCategory(subCategoryId: number): Observable<any[]> {
//   const body = {
//     id: subCategoryId
//   };
//   return this.http.post<any[]>(
//     `${this.baseUrl}/parameter-group/sub-category-id`,
//     body,
//     this.getHeaders()
//   );
// }

getResultParametersByGroup(parameterGroupId: number): Observable<any> {

  const body = {
    id: parameterGroupId
  };

  return this.http.post<any>(
    `${this.baseUrl}/parameter-result/sub-category-id`, // ✅ correct API
    body,
    this.getHeaders()
  );
}


getResultParametersBySampleDescription(sampleDescription: string): Observable<any> {
  return this.http.get(`${this.baseUrl}/result-parameters/by-sample-description`, {
    params: { sampleDescription }
  });
}

getResultParameterById(id: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/result-parameters/${id}`);
}

addResultParameter(resultParameter: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/result-parameters`, resultParameter);
}

updateResultParameter(resultParameter: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/result-parameters/${resultParameter.id}`, resultParameter);
}

deleteResultParameter(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/result-parameters/${id}`);
}

// =========================
  // SAMPLE RESULT METHODS
  // =========================
  
  /**
   * CREATE - Create a new sample result
   * POST /api/collector/samples/sample-result/create
   */
  createSampleResult(sampleResult: SampleResult): Observable<SampleResult> {
    console.log('Creating Sample Result:', sampleResult);
    return this.http.post<SampleResult>(
      `${this.baseUrl}/sample-result/create`,
      sampleResult,
      this.getHeaders()
    );
  }

  /**
   * UPDATE - Update an existing sample result
   * PUT /api/collector/samples/sample-result/update
   */
  updateSampleResult(sampleResult: SampleResult): Observable<SampleResult> {
    console.log('Updating Sample Result:', sampleResult);
    return this.http.put<SampleResult>(
      `${this.baseUrl}/sample-result/update`,
      sampleResult,
      this.getHeaders()
    );
  }

  /**
   * FIND BY DESCRIPTION - Find all sample results by sample description
   * POST /api/collector/samples/sample-result/find-by-description
   */
  findSampleResultsByDescription(sampleDescription: string): Observable<SampleResult[]> {
    const request = { sampleDescription };
    console.log('Finding Sample Results for:', sampleDescription);
    return this.http.post<SampleResult[]>(
      `${this.baseUrl}/sample-result/find-by-description`,
      request,
      this.getHeaders()
    );
  }

  /**
   * DELETE - Delete a sample result by ID
   * POST /api/collector/samples/sample-result/delete
   * Note: Backend expects 'result' field with ID as string
   */
  deleteSampleResult(id: number): Observable<string> {
    const request = { 
      result: id.toString(),
      // Include other required fields as empty strings to match SampleResultRequest
      unit: '',
      name: '',
      sampleDescription: '',
      protocal: '',
      standarded: '',
      isNABL: false
    };
    console.log('Deleting Sample Result ID:', id);
    return this.http.post<string>(
      `${this.baseUrl}/sample-result/delete`,
      request,
      this.getHeaders()
    );
  }
}