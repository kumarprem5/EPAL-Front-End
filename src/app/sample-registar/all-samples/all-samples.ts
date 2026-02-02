import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiResponse, PageResponse, Sample, SampleService } from '../../services/sample-service';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, Subject, takeUntil } from 'rxjs';
import { SampleHeader } from "../sample-header/sample-header";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FilterOptions {
  searchTerm: string;
  status: 'all' | 'pending' | 'analysis' | 'approved';
  fromDate: string;
  toDate: string;
  sampleType: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

@Component({
  selector: 'app-all-samples',
  imports: [SampleHeader,CommonModule,FormsModule],
  templateUrl: './all-samples.html',
  styleUrl: './all-samples.css',
})
export class AllSamples implements OnInit, OnDestroy {

  samples: Sample[] = [];
  filteredSamples: Sample[] = [];
  isLoading = false;
  
  filters: FilterOptions = {
    searchTerm: '',
    status: 'all',
    fromDate: '',
    toDate: '',
    sampleType: 'all'
  };

  pagination: PaginationInfo = {
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0
  };

  pageSizeOptions = [10, 25, 50, 100];
  
  searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // For displaying stats
  stats = {
    total: 0,
    pending: 0,
    analysis: 0,
    approved: 0
  };

  constructor(
    private sampleService: SampleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSamples();
    
    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filters.searchTerm = searchTerm;
        this.pagination.currentPage = 0;
        this.loadSamples();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSamples(): void {
    this.isLoading = true;

    const filter = {
      page: this.pagination.currentPage,
      size: this.pagination.pageSize,
      fromDate: this.filters.fromDate || undefined,
      toDate: this.filters.toDate || undefined
    };

    this.sampleService.getAllSamples(filter)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: ApiResponse<PageResponse>) => {
          if (response.status === 'SUCCESS' && response.data) {
            this.samples = response.data.content;
            this.pagination.totalPages = response.data.totalPages;
            this.pagination.totalElements = response.data.totalElements;
            
            this.applyClientSideFilters();
            this.calculateStats();
          }
        },
        error: (error) => {
          console.error('Error loading samples:', error);
        }
      });
  }

  applyClientSideFilters(): void {
    let filtered = [...this.samples];

    // Search filter
    if (this.filters.searchTerm) {
      const searchLower = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(sample =>
        sample.sampleNumber?.toLowerCase().includes(searchLower) ||
        sample.reportNumber?.toLowerCase().includes(searchLower) ||
        sample.projectName?.toLowerCase().includes(searchLower) ||
        sample.sampleDescription?.toLowerCase().includes(searchLower) ||
        sample.address?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(sample => {
        const status = this.getSampleStatus(sample);
        return status === this.filters.status;
      });
    }

    // Sample type filter
    if (this.filters.sampleType && this.filters.sampleType !== 'all') {
      filtered = filtered.filter(sample =>
        sample.sampleDescription?.toLowerCase().includes(this.filters.sampleType.toLowerCase())
      );
    }

    this.filteredSamples = filtered;
  }

  getSampleStatus(sample: Sample): 'pending' | 'analysis' | 'approved' {
    if (sample.techanicianChecked && sample.qualityChecked) {
      return 'approved';
    } else if (sample.techanicianChecked || sample.qualityChecked) {
      return 'analysis';
    }
    return 'pending';
  }

  calculateStats(): void {
    this.stats.total = this.pagination.totalElements;
    this.stats.pending = this.samples.filter(s => !s.techanicianChecked && !s.qualityChecked).length;
    this.stats.analysis = this.samples.filter(s => 
      (s.techanicianChecked && !s.qualityChecked) || (!s.techanicianChecked && s.qualityChecked)
    ).length;
    this.stats.approved = this.samples.filter(s => s.techanicianChecked && s.qualityChecked).length;
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.pagination.currentPage = 0;
    this.applyClientSideFilters();
  }

  onPageSizeChange(): void {
    this.pagination.currentPage = 0;
    this.loadSamples();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.loadSamples();
    }
  }

  nextPage(): void {
    this.goToPage(this.pagination.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.pagination.currentPage - 1);
  }

  getPageNumbers(): number[] {
    const total = this.pagination.totalPages;
    const current = this.pagination.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 0; i < total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(0, 1, 2, 3, 4, -1, total - 1);
      } else if (current >= total - 4) {
        pages.push(0, -1, total - 5, total - 4, total - 3, total - 2, total - 1);
      } else {
        pages.push(0, -1, current - 1, current, current + 1, -1, total - 1);
      }
    }

    return pages;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  getStatusClass(sample: Sample): string {
    const status = this.getSampleStatus(sample);
    return `status-badge status-${status}`;
  }

  getStatusText(sample: Sample): string {
    const status = this.getSampleStatus(sample);
    const statusMap = {
      'analysis': 'Under Analysis',
      'approved': 'Approved',
      'pending': 'Pending'
    };
    return statusMap[status];
  }
viewSample(sample: Sample): void {
  this.router.navigate([
    'sample',
    'general-information',
    sample.reportNumber
  ]);
}


  editSample(sample: Sample): void {
    this.router.navigate(['/samples/edit', sample.id]);
  }

  exportToExcel(): void {
    // Implement export functionality
    console.log('Exporting to Excel...');
  }

  clearFilters(): void {
    this.filters = {
      searchTerm: '',
      status: 'all',
      fromDate: '',
      toDate: '',
      sampleType: 'all'
    };
    this.pagination.currentPage = 0;
    this.loadSamples();
  }

  refreshData(): void {
    this.loadSamples();
  }

  addNewSample(): void {
    this.router.navigate(['/samples/register']);
  }
}