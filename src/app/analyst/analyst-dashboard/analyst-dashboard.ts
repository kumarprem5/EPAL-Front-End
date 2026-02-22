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
  hasSearched = false;
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
    totalProcessed: 0,
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

  // ── Navigate to Job Cards ──────────────────────────────────────────────────
  goToJobCards() {
    this.router.navigate(['/analyst/job-card']);
  }

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  loadDashboardStats() {
    this.isLoading = true;
    this.sampleService.getAllSamples({ page: 0, size: 50 })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: ApiResponse<PageResponse>) => {
          if (response.status === 'SUCCESS' && response.data.content) {
            this.processBackendData(response.data);
          }
        },
        error: (err) => console.error('Error loading dashboard data:', err),
      });
  }

  private processBackendData(pageResponse: PageResponse): void {
    const samples = pageResponse.content;
    if (!samples?.length) return;

    const today = new Date().toDateString();
    this.stats.totalProcessed        = pageResponse.totalElements;
    this.stats.pendingAnalysis        = samples.filter(s => !s.techanicianChecked && !s.qualityChecked).length;
    this.stats.completedToday         = samples.filter(s => new Date(s.updatedAt).toDateString() === today && s.qualityChecked).length;
    this.stats.forwardedToTechnician  = samples.filter(s => s.techanicianChecked && !s.qualityChecked).length;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearchTypeChange(type: string) {
    this.searchType = type;
    this.searchForm.reset();
    this.searchResults = [];
    this.hasSearched = false;
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

  private handleSearchResponse(response: any) {
    if (response?.status === 'SUCCESS' && response?.data != null) {
      const raw = response.data;
      if (Array.isArray(raw))                          this.searchResults = raw;
      else if (raw?.content && Array.isArray(raw.content)) this.searchResults = raw.content;
      else if (typeof raw === 'object')                this.searchResults = [raw];
      else                                             this.searchResults = [];
    } else {
      this.searchResults = [];
    }
    this.hasSearched = true;
    this.loading = false;
  }

  searchByReportNumber(reportNumber: string) {
    this.analystService.getSampleByReportNumber(reportNumber).subscribe({
      next:  (r) => this.handleSearchResponse(r),
      error: (err) => { console.error(err); this.searchResults = []; this.loading = false; this.hasSearched = true; },
    });
  }

  searchByCompanyName(companyName: string) {
    this.analystService.searchByCompanyName(companyName).subscribe({
      next:  (r) => this.handleSearchResponse(r),
      error: (err) => { console.error(err); this.searchResults = []; this.loading = false; this.hasSearched = true; },
    });
  }

  searchBySampleId(sampleId: string) {
    this.analystService.getSampleById(Number(sampleId)).subscribe({
      next:  (r) => this.handleSearchResponse(r),
      error: (err) => { console.error(err); this.searchResults = []; this.loading = false; this.hasSearched = true; },
    });
  }

  // ── Status Helpers ────────────────────────────────────────────────────────

  getSampleStatus(sample: any): string {
    if (sample.qualityChecked)     return 'Completed';
    if (sample.techanicianChecked) return 'Forwarded';
    return 'Pending';
  }

  getSampleStatusClass(sample: any): string {
    if (sample.qualityChecked)     return 'completed';
    if (sample.techanicianChecked) return 'forwarded';
    return 'pending';
  }

  // ── Modal Actions ─────────────────────────────────────────────────────────

  editGeneralInformation(sample: any) { this.selectedSample = sample; this.showEditModal = true; }
  editSampleResult(sample: any)       { this.selectedSample = sample; this.showResultModal = true; }
  forwardToTechnician(sample: any)    { this.selectedSample = sample; this.showForwardModal = true; }

  closeModal() {
    this.showEditModal = false;
    this.showResultModal = false;
    this.showForwardModal = false;
    this.selectedSample = null;
  }

  confirmForward() {
    if (!this.selectedSample) return;
    this.analystService.analystCheck(this.selectedSample.reportNumber).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          alert('Sample forwarded to technician successfully!');
          this.closeModal();
          this.onSearch();
          this.loadDashboardStats();
        } else {
          alert(response?.message || 'Failed to forward sample');
        }
      },
      error: () => alert('Failed to forward sample. Please try again.'),
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  logout() {
    this.analystService.logout().subscribe({
      next:  () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect(),
    });
  }

  private clearAndRedirect() {
    ['analystToken', 'analystUser', 'token', 'userProfile'].forEach(k => localStorage.removeItem(k));
    this.router.navigate(['/analyst/login']);
  }


  // ── Drawer state ──────────────────────────────────────────────────────────
drawerOpen = false;
activeRoute = 'dashboard';

toggleDrawer(): void  { this.drawerOpen = !this.drawerOpen; }
openDrawer(): void    { this.drawerOpen = true; }
closeDrawer(): void   { this.drawerOpen = false; }

navigateTo(route: string): void {
  this.activeRoute = route;
  this.closeDrawer();
  this.router.navigate([route]);
}

}
