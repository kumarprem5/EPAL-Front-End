import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiResponse, Sample, SampleService } from '../../services/sample-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SampleHeader } from "../sample-header/sample-header";




@Component({
  selector: 'app-sample-edit',
  imports: [CommonModule, FormsModule, SampleHeader],
  templateUrl: './sample-edit.html',
  styleUrl: './sample-edit.css',
})
export class SampleEdit {
  loading = false;
  sampleForm: any = { /* form initialization */ };
  sampleId!: number;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sampleService: SampleService
  ) {}

  ngOnInit(): void {
    this.sampleId = Number(this.route.snapshot.paramMap.get('id'));
    console.log("ID: ",this.sampleId)
    if (!this.sampleId) {
      alert('❌ Invalid sample ID');
      this.router.navigate(['/samples/dashboard']);
      return;
    }
    this.loadSampleById();
  }

 loadSampleById(): void {
  this.sampleService.getById(this.sampleId).subscribe({
    next: (res: ApiResponse<Sample>) => {
      console.log("Response:", res);  // Check if data is coming correctly

      const sample = res.data;  // Response contains the sample data in `data` field

      if (!sample) {
        alert('❌ Sample not found');
        return;
      }

      // Bind the sample data to the form
      this.sampleForm = {
        sampleNumber: sample.sampleNumber ?? '',
        projectName: sample.projectName ?? '',
        address: sample.address ?? '',
        sampleDescription: sample.sampleDescription ?? '',
        samplingAndAnalysisProtocol: sample.samplingAndAnalysisProtocol ?? '',
        reportNumber: sample.reportNumber ?? '',
        formatNumber: sample.formatNumber ?? '',
        partyReferenceNumber: sample.partyReferenceNumber ?? '',
        reportingDate: sample.reportingDate ?? '',
        periodOfAnalysis: sample.periodOfAnalysis ?? '',
        dateOfReceiving: sample.dateOfReceiving ?? ''
      };

      console.log("Form data loaded:", this.sampleForm);  // Check if data is correctly loaded into the form
    },
    error: (err) => {
      console.error('API error:', err);
      alert('❌ Failed to load sample');
    }
  });
}


updateSample(): void {
  this.loading = true;

  // Format dates if they are in Date object format (to "yyyy-MM-dd")
  if (this.sampleForm.reportingDate instanceof Date) {
    this.sampleForm.reportingDate = this.formatDate(this.sampleForm.reportingDate);
  }
  if (this.sampleForm.dateOfReceiving instanceof Date) {
    this.sampleForm.dateOfReceiving = this.formatDate(this.sampleForm.dateOfReceiving);
  }

  console.log("Sample Form (before update):", this.sampleForm);

  // Send the update request
  this.sampleService.updateSample(this.sampleId, this.sampleForm)
    .pipe(finalize(() => (this.loading = false)))
    .subscribe({
      next: () => {
        console.log("Sample Form (after update):", this.sampleForm);
        alert('✅ Sample updated successfully');
        this.router.navigate(['/sample/dashboard']); // Ensure correct route
      },
      error: () => alert('❌ Update failed')
    });
}

// Helper method to format Date to "yyyy-MM-dd"
formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // Converts to "yyyy-MM-dd"
}


  cancel(): void {
    this.router.navigate(['sample/dashboard']);
  }
}