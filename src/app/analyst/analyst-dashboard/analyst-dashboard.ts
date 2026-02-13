import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnalystService } from '../../services/analyst-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GeneralInformation } from "../../sample-registar/general-information/general-information";
import { AddResult } from "../add-result/add-result";
import { AnalystGeneralInfoComponent } from "../analyst-general-info.component/analyst-general-info.component";
import { AnalystSampleResultComponent } from "../analyst-sample-result.component/analyst-sample-result.component";
import { ApiResponse, PageResponse, SampleService } from '../../services/sample-service';
import { filter, finalize } from 'rxjs';
import { AnalystSampleService } from '../../services/analyst-sample-service';

@Component({
  selector: 'app-analyst-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule,AnalystGeneralInfoComponent, AnalystSampleResultComponent],
  templateUrl: './analyst-dashboard.html',
  styleUrl: './analyst-dashboard.css',
})
export class AnalystDashboard implements OnInit {

   

  isLoading = false;
  hasSearched = false;          // ✅ Controls "No Results" visibility
  currentUser: any;
  searchForm: FormGroup;
  searchType: string = 'reportNumber';
  searchResults: any[] = [];
  loading = false;
  selectedSample: any = null;
  showEditModal = false;
  showResultModal = false;
  showForwardModal = false;

  stats = {
    pendingAnalysis: 0,
    completedToday: 0,
    forwardedToTechnician: 0,
    totalProcessed: 0
  };

  constructor(
    private fb: FormBuilder,
    private analystService: AnalystService,
    private router: Router,
    private sampleService: AnalystSampleService,
  ) {
    this.searchForm = this.fb.group({ searchValue: [''] });
  }

  ngOnInit() {
    const userStr = localStorage.getItem('userProfile');
    if (userStr) this.currentUser = JSON.parse(userStr);
    this.loadDashboardStats();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ─────────────────────────────────────────────────────────────────────────────

  loadDashboardStats() {
    this.isLoading = true;
    const filter = { page: 0, size: 50 };

    this.sampleService.getAllSamples(filter)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: ApiResponse<PageResponse>) => {
          if (response.status === 'SUCCESS' && response.data.content) {
            console.log("Data:",response.data );
            
            this.processBackendData(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
        }
      });
  }

  private processBackendData(pageResponse: PageResponse): void {
    const samples = pageResponse.content;
    if (!samples || samples.length === 0) return;

    // ✅ Compute real stats from backend data
    const today = new Date().toDateString();

    this.stats.totalProcessed = pageResponse.totalElements;

    this.stats.pendingAnalysis = samples.filter(
      s => !s.techanicianChecked && !s.qualityChecked
    ).length;

    this.stats.completedToday = samples.filter(s => {
      const updated = new Date(s.updatedAt).toDateString();
      return updated === today && s.qualityChecked;
    }).length;

    this.stats.forwardedToTechnician = samples.filter(
      s => s.techanicianChecked && !s.qualityChecked
    ).length;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────────────

  onSearchTypeChange(type: string) {
    this.searchType = type;
    this.searchForm.reset();
    this.searchResults = [];
    this.hasSearched = false;    // ✅ Reset when tab changes
  }

  onSearch() {
    const searchValue = this.searchForm.get('searchValue')?.value?.trim();
    if (!searchValue) return;

    this.loading = true;
    this.hasSearched = false;
    this.searchResults = [];

    switch (this.searchType) {
      case 'reportNumber': this.searchByReportNumber(searchValue); break;
      case 'companyName':  this.searchByCompanyName(searchValue);  break;
      case 'sampleId':     this.searchBySampleId(searchValue);     break;
    }
  }

  // ✅ FIXED: Backend returns { status: 'SUCCESS', data: Sample | Sample[] | PageResponse }
  private handleSearchResponse(response: any) {
    if (response?.status === 'SUCCESS' && response?.data != null) {
      const raw = response.data;

      if (Array.isArray(raw)) {
        // Array of samples returned directly
        this.searchResults = raw;
      } else if (raw?.content && Array.isArray(raw.content)) {
        // PageResponse wrapper
        this.searchResults = raw.content;
      } else if (typeof raw === 'object') {
        // Single sample object
        this.searchResults = [raw];
      } else {
        this.searchResults = [];
      }
    } else {
      this.searchResults = [];
    }

    this.hasSearched = true;
    this.loading = false;
  }

  searchByReportNumber(reportNumber: string) {
    this.analystService.getSampleByReportNumber(reportNumber).subscribe({
      next: (r) => this.handleSearchResponse(r),
      error: (err) => {
        console.error('Report number search failed:', err);
        this.searchResults = [];
        this.loading = false;
        this.hasSearched = true;
      }
    });
  }

  searchByCompanyName(companyName: string) {
    this.analystService.searchByCompanyName(companyName).subscribe({
      next: (r) => this.handleSearchResponse(r),
      error: (err) => {
        console.error('Company name search failed:', err);
        this.searchResults = [];
        this.loading = false;
        this.hasSearched = true;
      }
    });
  }

  searchBySampleId(sampleId: string) {
    this.analystService.getSampleById(Number(sampleId)).subscribe({
      next: (r) => this.handleSearchResponse(r),
      error: (err) => {
        console.error('Sample ID search failed:', err);
        this.searchResults = [];
        this.loading = false;
        this.hasSearched = true;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SAMPLE STATUS HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  getSampleStatus(sample: any): string {
    if (sample.qualityChecked) return 'Completed';
    if (sample.techanicianChecked) return 'Forwarded';
    return 'Pending';
  }

  getSampleStatusClass(sample: any): string {
    if (sample.qualityChecked) return 'completed';
    if (sample.techanicianChecked) return 'forwarded';
    return 'pending';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODAL ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  viewSampleDetails(sample: any)      { this.selectedSample = sample; }
  editGeneralInformation(sample: any) { this.selectedSample = sample; this.showEditModal   = true; }
  editSampleResult(sample: any)       { this.selectedSample = sample; this.showResultModal  = true; }
  forwardToTechnician(sample: any)    { this.selectedSample = sample; this.showForwardModal = true; }

  closeModal() {
    this.showEditModal = this.showResultModal = this.showForwardModal = false;
    this.selectedSample = null;
  }

  confirmForward() {
    if (!this.selectedSample) return;
    this.analystService.technicianCheck(this.selectedSample.reportNumber).subscribe({
      next: (response) => {
        // ✅ FIXED: Check backend response structure
        if (response?.status === 'SUCCESS') {
          alert('Sample forwarded to technician successfully!');
          this.closeModal();
          this.onSearch();
          this.loadDashboardStats(); // Refresh stats
        } else {
          alert(response?.message || 'Failed to forward sample');
        }
      },
      error: () => alert('Failed to forward sample. Please try again.')
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────────

  logout() {
    this.analystService.logout().subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect()
    });
  }

  private clearAndRedirect() {
    localStorage.removeItem('analystToken');
    localStorage.removeItem('analystUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    this.router.navigate(['/analyst/login']);
  }
}
