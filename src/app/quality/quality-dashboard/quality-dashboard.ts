import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QualityService } from '../../services/quality-service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { QualityGeneralInfo } from "../quality-general-info/quality-general-info";
import { QualitySampleResult } from "../quality-sample-result/quality-sample-result";

@Component({
  selector: 'app-quality-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QualityGeneralInfo, QualitySampleResult],
  templateUrl: './quality-dashboard.html',
  styleUrl: './quality-dashboard.css',
})
export class QualityDashboard {
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
  showQualityCheckModal = false;

  stats = {
    pendingQA: 0,
    approvedToday: 0,
    totalApproved: 0,
    totalProcessed: 0
  };

  constructor(
    private fb: FormBuilder,
    private qualityService: QualityService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({ searchValue: [''] });
  }

  ngOnInit() {
    const userStr = localStorage.getItem('qualityUser') || localStorage.getItem('userProfile');
    if (userStr) this.currentUser = JSON.parse(userStr);
    this.loadDashboardStats();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD STATS
  // ─────────────────────────────────────────────────────────────────────────────

  loadDashboardStats() {
    this.isLoading = true;
    const filter = { page: 0, size: 100 };

    this.qualityService.getAllSamples(filter)
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
    const samples = pageResponse.content;
    if (!samples || samples.length === 0) return;

    // ✅ Filter to only techanicianChecked = true
    const qualitySamples = samples.filter((s: any) => s.techanicianChecked === true);

    this.stats.totalProcessed = qualitySamples.length;

    // Pending QA: techanicianChecked=true AND qualityChecked=false
    this.stats.pendingQA = qualitySamples.filter(
      (s: any) => !s.qualityChecked
    ).length;

    // Total Approved: qualityChecked=true
    const approved = qualitySamples.filter((s: any) => s.qualityChecked);
    this.stats.totalApproved = approved.length;

    // Approved Today
    const today = new Date().toDateString();
    this.stats.approvedToday = approved.filter((s: any) => {
      const updated = new Date(s.updatedAt).toDateString();
      return updated === today;
    }).length;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH WITH AUTO-FILTER AND SORT
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
      }

      // ✅ FILTER: Only show techanicianChecked = true
      let filtered = allResults.filter(s => s.techanicianChecked === true);

      // ✅ SORT: By updatedAt DESC (newest first)
      this.searchResults = filtered.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // Descending order
      });
    } else {
      this.searchResults = [];
    }

    this.hasSearched = true;
    this.loading = false;
  }

  searchByReportNumber(reportNumber: string) {
    this.qualityService.getSampleByReportNumber(reportNumber).subscribe({
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
    this.qualityService.searchByCompanyName(companyName).subscribe({
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
    this.qualityService.getSampleById(Number(sampleId)).subscribe({
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
    return 'Pending QA';
  }

  getSampleStatusClass(sample: any): string {
    return sample.qualityChecked ? 'approved' : 'pending';
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

  approveQuality(sample: any) { 
    this.selectedSample = sample; 
    this.showQualityCheckModal = true; 
  }

  closeModal() {
    this.showEditModal = false;
    this.showResultModal = false;
    this.showQualityCheckModal = false;
    this.selectedSample = null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUALITY CHECK (APPROVE)
  // ─────────────────────────────────────────────────────────────────────────────

  confirmQualityCheck() {
    if (!this.selectedSample) return;
    
    this.qualityService.qualityCheck(this.selectedSample.reportNumber).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          alert('Sample approved for quality check!');
          this.closeModal();
          this.onSearch();
          this.loadDashboardStats();
        } else {
          alert(response?.message || 'Failed to approve sample');
        }
      },
      error: () => alert('Failed to approve sample. Please try again.')
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRINT REPORT (Only for approved samples)
  // ─────────────────────────────────────────────────────────────────────────────

  printReport(sample: any) {
    if (!sample.qualityChecked) {
      alert('Sample must be QA approved before printing report');
      return;
    }

    // Open print window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups to print report');
      return;
    }

    // Fetch full report data
    this.qualityService.getReportData(sample.reportNumber).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          this.generatePrintableReport(printWindow, response.data);
        } else {
          this.generateBasicReport(printWindow, sample);
        }
      },
      error: () => {
        // Fallback: Generate basic report from current data
        this.generateBasicReport(printWindow, sample);
      }
    });
  }

  private generatePrintableReport(printWindow: Window, data: any) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Report - ${data.reportNumber || 'Report'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            background: white;
            color: #1f2937;
          }
          .header { 
            text-align: center; 
            border-bottom: 4px solid #3b82f6; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            font-size: 32px; 
            color: #3b82f6; 
            margin-bottom: 10px; 
          }
          .header h2 { 
            font-size: 24px; 
            color: #1f2937; 
            margin-bottom: 8px; 
          }
          .header p { 
            color: #6b7280; 
            font-size: 14px; 
          }
          .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 20px; 
            font-weight: bold; 
            color: #3b82f6; 
            margin-bottom: 15px; 
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
          }
          th, td { 
            border: 1px solid #d1d5db; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background: #3b82f6; 
            color: white; 
            font-weight: 600;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .footer { 
            margin-top: 50px; 
            border-top: 3px solid #e5e7eb; 
            padding-top: 20px; 
            text-align: center; 
            color: #6b7280; 
          }
          .footer strong {
            color: #10b981;
            font-size: 16px;
          }
          .qa-badge {
            display: inline-block;
            background: #d1fae5;
            color: #065f46;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 10px 0;
          }
          @media print { 
            .no-print { display: none; } 
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔬 Laboratory Test Report</h1>
          <h2>${data.reportNumber || 'N/A'}</h2>
          <div class="qa-badge">✅ Quality Approved</div>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <div class="section-title">📋 Sample Information</div>
          <table>
            <tr><th style="width: 30%;">Report Number</th><td>${data.reportNumber || '—'}</td></tr>
            <tr><th>Sample Number</th><td>${data.sampleNumber || '—'}</td></tr>
            <tr><th>Description</th><td>${data.sampleDescription || '—'}</td></tr>
            <tr><th>Project Name</th><td>${data.projectName || '—'}</td></tr>
            <tr><th>Format Number</th><td>${data.formatNumber || '—'}</td></tr>
            <tr><th>Party Reference</th><td>${data.partyReferenceNumber || '—'}</td></tr>
            <tr><th>Date Received</th><td>${data.dateOfReceiving ? new Date(data.dateOfReceiving).toLocaleDateString() : '—'}</td></tr>
            <tr><th>Reporting Date</th><td>${data.reportingDate ? new Date(data.reportingDate).toLocaleDateString() : '—'}</td></tr>
            <tr><th>Analysis Period</th><td>${data.periodOfAnalysis || '—'}</td></tr>
            <tr><th>Protocol</th><td>${data.samplingAndAnalysisProtocol || '—'}</td></tr>
            <tr><th>Address</th><td>${data.address || '—'}</td></tr>
          </table>
        </div>

        ${data.generalInfo && data.generalInfo.length > 0 ? `
          <div class="section">
            <div class="section-title">📝 General Information</div>
            <table>
              <thead><tr><th>Field Name</th><th>Value</th></tr></thead>
              <tbody>
                ${data.generalInfo.map((item: any) => `
                  <tr><td><strong>${item.name}</strong></td><td>${item.value}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${data.results && data.results.length > 0 ? `
          <div class="section">
            <div class="section-title">🧪 Test Results</div>
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Protocol</th>
                  <th>Standard</th>
                  <th>NABL</th>
                </tr>
              </thead>
              <tbody>
                ${data.results.map((item: any) => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td style="background: #dbeafe; font-weight: bold; color: #1e3a8a;">${item.result}</td>
                    <td>${item.unit}</td>
                    <td>${item.protocal || '—'}</td>
                    <td>${item.standarded || '—'}</td>
                    <td>${item.isNABL ? '<span style="color: #059669; font-weight: bold;">✓ Yes</span>' : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>✅ Quality Approved</strong></p>
          <p>This report has been verified and approved by Quality Assurance</p>
          <p style="margin-top: 10px;">Generated by Laboratory Information Management System (LIMS)</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 14px 32px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
            🖨️ Print Report
          </button>
          <button onclick="window.close()" style="padding: 14px 32px; background: #f3f4f6; color: #374151; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; margin-left: 12px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  private generateBasicReport(printWindow: Window, sample: any) {
    // Simplified report with sample data only (no general info or results)
    this.generatePrintableReport(printWindow, {
      ...sample,
      generalInfo: [],
      results: []
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────────

  logout() {
    this.qualityService.logout().subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect()
    });
  }

  private clearAndRedirect() {
    localStorage.removeItem('qualityToken');
    localStorage.removeItem('qualityUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    this.router.navigate(['/quality/login']);
  }
}

