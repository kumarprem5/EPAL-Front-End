import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TechanicianService } from '../../services/techanician-service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TechnicianSampleResult } from "../technician-sample-result/technician-sample-result";
import { TechanicianGeneralInfo } from "../techanician-general-info/techanician-general-info";

@Component({
  selector: 'app-technician-dashboard',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, TechnicianSampleResult, TechanicianGeneralInfo],
  templateUrl: './technician-dashboard.html',
  styleUrl: './technician-dashboard.css',
})
export class TechnicianDashboard implements OnInit {
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
  showSendBackModal = false;
  showQualityCheckModal = false;

  stats = {
    pendingReview: 0,
    sentBackToAnalyst: 0,
    forwardedToQuality: 0,
    totalProcessed: 0
  };

  constructor(
    private fb: FormBuilder,
    private technicianService: TechanicianService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({ searchValue: [''] });
  }

  ngOnInit() {
    const userStr = localStorage.getItem('technicianUser') || localStorage.getItem('userProfile');
    if (userStr) this.currentUser = JSON.parse(userStr);
    this.loadDashboardStats();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ─────────────────────────────────────────────────────────────────────────────

  loadDashboardStats() {
    this.isLoading = true;
    const filter = { page: 0, size: 50 };

    this.technicianService.getAllSamples(filter)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response: any) => {
          if (response.status === 'SUCCESS' && response.data.content) {
            this.processBackendData(response.data);
          }
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
        }
      });
  }

 private processBackendData(pageResponse: any): void {

  const samples = pageResponse.content.filter(
    (s: any) => s?.fordwardToTechanician === true
  );

  if (!samples || samples.length === 0) return;

  const technicianSamples = samples.filter(
    (s: any) => s.techanicianChecked === true
  );

  this.stats.totalProcessed = technicianSamples.length;

  this.stats.pendingReview = technicianSamples.filter(
    (s: any) => !s.qualityChecked
  ).length;

  this.stats.sentBackToAnalyst = samples.filter(
    (s: any) =>
      s.techanicianChecked &&
      !s.fordwardToTechanician &&
      !s.qualityChecked
  ).length;

  this.stats.forwardedToQuality = technicianSamples.filter(
    (s: any) => s.qualityChecked
  ).length;
}

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────────────

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

      let allResults: any[] = [];
      
      if (Array.isArray(raw)) {
        allResults = raw;
      } else if (raw?.content && Array.isArray(raw.content)) {
        allResults = raw.content;
      } else if (typeof raw === 'object') {
        allResults = [raw];
      } else {
        allResults = [];
      }

      // Filter to show ONLY samples where techanicianChecked = true
      this.searchResults = allResults.filter(sample => sample.fordwardToTechanician === true);
    } else {
      this.searchResults = [];
    }

    this.hasSearched = true;
    this.loading = false;
  }

  searchByReportNumber(reportNumber: string) {
    this.technicianService.getSampleByReportNumber(reportNumber).subscribe({
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
    this.technicianService.searchByCompanyName(companyName).subscribe({
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
    this.technicianService.getSampleById(Number(sampleId)).subscribe({
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
    if (sample.qualityChecked) return 'QA Approved';
    if (sample.fordwardToTechanician) return 'In Review';
    return 'Pending';
  }

  getSampleStatusClass(sample: any): string {
    if (sample.qualityChecked) return 'qa-approved';
    if (sample.fordwardToTechanician) return 'in-review';
    return 'pending';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MODAL ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  editGeneralInformation(sample: any) { 
    this.selectedSample = sample; 
    this.showEditModal = true; 
  }

  editSampleResult(sample: any) { 
    this.selectedSample = sample; 
    this.showResultModal = true; 
  }

  sendBackToAnalyst(sample: any) { 
    this.selectedSample = sample; 
    this.showSendBackModal = true; 
  }

  forwardToQualityCheck(sample: any) { 
    this.selectedSample = sample; 
    this.showQualityCheckModal = true; 
  }

  closeModal() {
    this.showEditModal = false;
    this.showResultModal = false;
    this.showSendBackModal = false;
    this.showQualityCheckModal = false;
    this.selectedSample = null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WORKFLOW ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  confirmSendBackToAnalyst() {
    if (!this.selectedSample) return;
    
    this.technicianService.sendBackToAnalyst(this.selectedSample.reportNumber).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          alert('Sample sent back to analyst successfully!');
          this.closeModal();
          this.onSearch();
          this.loadDashboardStats();
        } else {
          alert(response?.message || 'Failed to send back to analyst');
        }
      },
      error: () => alert('Failed to send back to analyst. Please try again.')
    });
  }

 confirmForwardToQualityCheck() {
  if (!this.selectedSample) return;

  this.technicianService
    .forwardToQualityCheck(this.selectedSample.reportNumber)
    .subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          alert('Sample forwarded to Quality Check successfully!');
          this.closeModal();
          this.onSearch();
          this.loadDashboardStats();
        } else {
          alert(response?.message || 'Failed to forward to Quality Check');
        }
      },
      error: () =>
        alert('Failed to forward to Quality Check. Please try again.')
    });
}

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────────

  logout() {
    this.technicianService.logout().subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect()
    });
  }

  private clearAndRedirect() {
    localStorage.removeItem('technicianToken');
    localStorage.removeItem('technicianUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    this.router.navigate(['/technician/login']);
  }
}
