import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiResponse, PageResponse, Sample, SampleService } from '../../services/sample-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SampleHeader } from "../../sample-registar/sample-header/sample-header";
import { finalize, interval, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

interface StatCard {
  icon: string;
  iconClass: string;
  title: string;
  value: number;
}

interface DashboardSample {
  id: string;
  type: string;
  collectionDate: string;
  collector: string;
  location: string;
  status: 'analysis' | 'approved' | 'pending';
  tests?: string;
}

interface Report {
  id: string;
  type: string;
  generatedDate: string;
  period: string;
}

@Component({
  selector: 'app-sample-dashboard',
  imports: [FormsModule, CommonModule,SampleHeader],
  templateUrl: './sample-dashboard.html',
  styleUrl: './sample-dashboard.css',
})
export class SampleDashboard implements OnInit, OnDestroy {
  stats: StatCard[] = [
    { icon: '📦', iconClass: 'total', title: 'Total Samples', value: 0 },
    { icon: '🔬', iconClass: 'analysis', title: 'Under Analysis', value: 0 },
    { icon: '✅', iconClass: 'approved', title: 'Approved', value: 0 },
    { icon: '📅', iconClass: 'today', title: 'Today\'s Samples', value: 0 }
  ];

  recentSamples: DashboardSample[] = [];
  librarySamples: DashboardSample[] = [];
  
  reports: Report[] = [
    {
      id: 'RPT-2026-W04',
      type: 'Weekly Summary',
      generatedDate: 'Jan 27, 2026',
      period: 'Week 4, 2026'
    },
    {
      id: 'RPT-2026-M01',
      type: 'Monthly Report',
      generatedDate: 'Jan 1, 2026',
      period: 'January 2026'
    },
    {
      id: 'RPT-2025-Q4',
      type: 'Quarterly Analysis',
      generatedDate: 'Dec 31, 2025',
      period: 'Q4 2025'
    }
  ];

  private destroy$ = new Subject<void>();
  isLoading = false;

  constructor(
    private sampleService: SampleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Auto-refresh every 5 minutes
    interval(300000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    const filter = {
      page: 0,
      size: 50,
    };

    this.sampleService.getAllSamples(filter)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response: ApiResponse<PageResponse>) => {
          if (response.status === 'SUCCESS' && response.data) {
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
    
    if (!samples || samples.length === 0) {
      return;
    }
    
    // Update statistics
    this.updateStatistics(samples, pageResponse.totalElements);
    
    // Process samples for display
    const dashboardSamples = samples.map(sample => this.mapToDashboardSample(sample));
    
    // Sort by date (most recent first)
    dashboardSamples.sort((a, b) => {
      const dateA = new Date(a.collectionDate).getTime();
      const dateB = new Date(b.collectionDate).getTime();
      return dateB - dateA;
    });
    
    // Get recent samples (last 5)
    this.recentSamples = dashboardSamples.slice(0, 5);
    
    // Get library samples (first 4 for grid display)
    this.librarySamples = dashboardSamples.slice(0, 4);
  }

  private updateStatistics(samples: Sample[], totalElements: number): void {
    const total = totalElements;
    
    const underAnalysis = samples.filter(s => 
      !s.techanicianChecked || !s.qualityChecked
    ).length;
    
    const approved = samples.filter(s => 
      s.techanicianChecked && s.qualityChecked
    ).length;
    
    const today = new Date().toISOString().split('T')[0];
    const todaySamples = samples.filter(s => {
      if (!s.dateOfReceiving) return false;
      const sampleDate = s.dateOfReceiving.split('T')[0];
      return sampleDate === today;
    }).length;

    this.stats[0].value = total;
    this.stats[1].value = underAnalysis;
    this.stats[2].value = approved;
    this.stats[3].value = todaySamples;
  }

  private mapToDashboardSample(sample: Sample): DashboardSample {
    let status: 'analysis' | 'approved' | 'pending' = 'pending';
    
    if (sample.techanicianChecked && sample.qualityChecked) {
      status = 'approved';
    } else if (sample.techanicianChecked || sample.qualityChecked) {
      status = 'analysis';
    }

    const collectionDate = this.formatDate(sample.dateOfReceiving);
    
    // Truncate location if too long
    const location = this.truncateLocation(sample.address || sample.projectName || 'Unknown');

    return {
      id: sample.sampleNumber || `EPL-${sample.id}`,
      type: this.determineSampleType(sample.sampleDescription),
      collectionDate: collectionDate,
      collector: 'Lab Technician',
      location: location,
      status: status,
      tests: sample.samplingAndAnalysisProtocol || undefined
    };
  }

  private truncateLocation(location: string, maxLength: number = 50): string {
    if (!location) return 'Unknown';
    
    // If location is short enough, return as is
    if (location.length <= maxLength) {
      return location;
    }
    
    // Try to find a good break point (comma, dash, or space)
    const breakPoints = [',', ' - ', ' '];
    
    for (const breakPoint of breakPoints) {
      const parts = location.split(breakPoint);
      if (parts.length > 1 && parts[0].length <= maxLength) {
        return parts[0].trim() + '...';
      }
    }
    
    // If no good break point, just truncate
    return location.substring(0, maxLength) + '...';
  }

  private determineSampleType(description: string): string {
    if (!description) return 'Sample';
    
    const desc = description.toLowerCase();
    
    if (desc.includes('drinking water')) {
      return 'Drinking Water';
    } else if (desc.includes('water') || desc.includes('h2o')) {
      return 'Water Sample';
    } else if (desc.includes('soil') || desc.includes('earth')) {
      return 'Soil Sample';
    } else if (desc.includes('air') || desc.includes('atmosphere')) {
      return 'Air Quality';
    } else if (desc.includes('chemical')) {
      return 'Chemical Sample';
    } else {
      return 'Environmental Sample';
    }
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
  }

  addNewSample(): void {
    this.router.navigate(['samples/register']);
  }

  getStatusClass(status: string): string {
    return `status-badge status-${status}`;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'analysis': 'Under Analysis',
      'approved': 'Approved',
      'pending': 'Pending'
    };
    return statusMap[status] || status;
  }

  // Helper method to get full location for tooltip (optional)
  getFullLocation(sample: DashboardSample): string {
    return sample.location;
  }

  goToAllSamples() {
  this.router.navigate(['/samples/all']);
}
}