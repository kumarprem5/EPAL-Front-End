import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SampleService, TestParameter } from '../../services/sample-service';
import { Router } from '@angular/router';
import { SampleRequest } from '../../interfaces/sample-request';
import { CommonModule } from '@angular/common';
import { SampleHeader } from "../sample-header/sample-header";
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

@Component({
  selector: 'app-sample-registration',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SampleHeader],
  templateUrl: './sample-registration.html',
  styleUrl: './sample-registration.css',
})
export class SampleRegistration {
 sampleForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  successMessage = '';

  // Dropdown and test parameters
  sampleDescriptions: string[] = [];
  loadingDescriptions = false;
  testParameters: TestParameter[] = [];
  loadingParameters = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private sampleService: SampleService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSampleDescriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form with validators
   */
  private initializeForm(): void {
    this.sampleForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      sampleDescription: ['', Validators.required],
      samplingAndAnalysisProtocol: [''],
      formatNumber: [''],
      partyReferenceNumber: [''],
      reportingDate: ['', Validators.required],
      periodOfAnalysis: [''],
      dateOfReceiving: ['', Validators.required]
    });
  }

  /**
   * Load sample descriptions from backend
   * FIXED: Properly handles response format [{sampleDescription: "value"}]
   */
  loadSampleDescriptions(): void {
    this.loadingDescriptions = true;
    
    // Disable the dropdown while loading
    this.sampleForm.get('sampleDescription')?.disable();
    
    this.sampleService.getAllSampleDescriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingDescriptions = false;
          
          if (response.status === 'SUCCESS' && response.data) {
            // ✅ FIXED: Map the array of objects to array of strings
            // Backend returns: [{sampleDescription: "Ambient Noise"}, ...]
            // We need: ["Ambient Noise", ...]
            this.sampleDescriptions = response.data.map(
              (item: any) => item.sampleDescription
            );
            
            console.log("Sample Descriptions (mapped):", this.sampleDescriptions);
          }
          
          // Enable the dropdown after loading
          this.sampleForm.get('sampleDescription')?.enable();
        },
        error: (error) => {
          this.loadingDescriptions = false;
          console.error('Error loading sample descriptions:', error);
          this.errorMessage = 'Failed to load sample descriptions';
          this.submitError = true;
          
          // Enable the dropdown even on error
          this.sampleForm.get('sampleDescription')?.enable();
          
          setTimeout(() => {
            this.submitError = false;
          }, 3000);
        }
      });
  }

  /**
   * Handle sample description change
   */
  onSampleDescriptionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedDescription = selectElement.value;
    
    if (selectedDescription) {
      this.loadTestParameters(selectedDescription);
    } else {
      this.testParameters = [];
    }
  }

  /**
   * Load test parameters based on selected description
   */
  loadTestParameters(sampleDescription: string): void {
    this.loadingParameters = true;
    this.testParameters = [];
    
    this.sampleService.getTestParametersBySampleDescription(sampleDescription)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingParameters = false;
          if (response.status === 'SUCCESS' && response.data) {
            this.testParameters = response.data;
            console.log('Loaded test parameters:', this.testParameters);
          }
        },
        error: (error) => {
          this.loadingParameters = false;
          console.error('Error loading test parameters:', error);
        }
      });
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.sampleForm.invalid) {
      this.markFormGroupTouched(this.sampleForm);
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;
    this.errorMessage = '';

    const sampleRequest: SampleRequest = this.sampleForm.value;

    this.sampleService.addSample(sampleRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.successMessage = response.message || 'Sample registered successfully!';
          
          if (response.data) {
            console.log('Generated Sample Number:', response.data.sampleNumber);
            console.log('Generated Report Number:', response.data.reportNumber);
          }
          
          this.sampleForm.reset();
          this.testParameters = [];
          
          setTimeout(() => {
            this.submitSuccess = false;
          }, 5000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.submitError = true;
          this.errorMessage = error.message || 'Failed to register sample. Please try again.';
          console.error('Error creating sample:', error);
        }
      });
  }

  /**
   * Reset the form
   */
  onReset(): void {
    this.sampleForm.reset();
    this.submitSuccess = false;
    this.submitError = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.testParameters = [];
  }

  /**
   * Cancel and navigate back
   */
  onCancel(): void {
    if (this.sampleForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/samples/list']);
      }
    } else {
      this.router.navigate(['/samples/list']);
    }
  }

  /**
   * Check if a field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.sampleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for a field
   */
  getFieldError(fieldName: string): string {
    const field = this.sampleForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    
    return '';
  }

  /**
   * Get user-friendly label for field
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      projectName: 'Project Name',
      address: 'Address',
      sampleDescription: 'Sample Description',
      samplingAndAnalysisProtocol: 'Sampling & Analysis Protocol',
      formatNumber: 'Format Number',
      partyReferenceNumber: 'Party Reference Number',
      reportingDate: 'Reporting Date',
      periodOfAnalysis: 'Period of Analysis',
      dateOfReceiving: 'Date of Receiving'
    };
    
    return labels[fieldName] || fieldName;
  }

  /**
   * Mark all fields in form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get today's date in YYYY-MM-DD format for max date validation
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
