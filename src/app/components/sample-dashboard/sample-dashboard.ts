import { Component } from '@angular/core';
import { ApiResponse, PageResponse, SampleService } from '../../services/sample-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SampleHeader } from "../../sample-registar/sample-header/sample-header";
import { finalize, interval, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';


@Component({
  selector: 'app-sample-dashboard',
  imports: [FormsModule, CommonModule,SampleHeader],
  templateUrl: './sample-dashboard.html',
  styleUrl: './sample-dashboard.css',
})
export class SampleDashboard {
samples: any[] = [];
  loading: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  cacheData: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private sampleService: SampleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 Component initialized');
    this.loadSamples();
    interval(30000) // every 30 seconds
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      console.log('⏱ Auto refresh');
      this.loadSamples();
    });
  }

  ngOnDestroy(): void {
    console.log('🛑 Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSamples(): void {
    this.loading = true;

    const request = {
      page: this.currentPage,
      size: this.pageSize,
      fromDate: '2026-01-22T00:00:00',
      toDate: '2026-01-22T23:59:59'
    };

    console.log('📡 Fetching samples...', request);

    this.sampleService
      .getAllSamples(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          console.log('✓ Loading finished');
        })
      )
      .subscribe({
        next: (res: ApiResponse<PageResponse>) => {
          console.log('📥 Response received:', res);
          if (res.status === 'SUCCESS') {
            this.samples = res.data.content;
            this.cacheData = [...this.samples];
            this.totalElements = res.data.totalElements;
            this.totalPages = res.data.totalPages;
            console.log('✅ Samples loaded:', this.samples.length);
          } else {
            console.error('❌ API error:', res.message);
            this.samples = this.cacheData;
          }
        },
        error: (err) => {
          console.error('❌ Network error:', err);
          if (this.cacheData.length > 0) {
            this.samples = this.cacheData;
            console.log('📦 Restored from cache');
          }
        }
      });
  }

  registerNewSample(): void {
    console.log('📝 Navigate to register new sample');
    this.router.navigate(['/samples/register']); // Change route as needed
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadSamples();
    }
  }

   getTechnicianCheckedCount(): number {
    return this.samples.filter(sample => sample.techanicianChecked).length;
  }
  getQualityCheckedCount(): number {
    return this.samples.filter(sample => sample.qualityChecked).length;
  }

 


  viewSample(sample: any): void {
  console.log('👁 View sample:', sample);
     this.router.navigate(
    ['/sample/general-information', sample.reportNumber]
  );
}

editSample(sample: any): void {
  console.log('✏️ Edit sample:', sample);
  this.router.navigate(['/samples/edit', sample.id]);
}

}