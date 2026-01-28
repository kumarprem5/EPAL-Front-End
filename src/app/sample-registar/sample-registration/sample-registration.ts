import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SampleService } from '../../services/sample-service';
import { Router } from '@angular/router';
import { SampleRequest } from '../../interfaces/sample-request';
import { CommonModule } from '@angular/common';
import { SampleHeader } from "../sample-header/sample-header";

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

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private sampleService: SampleService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Any initialization logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the form with validators
   * Removed sampleNumber and reportNumber as they are auto-generated
   */
  private initializeForm(): void {
    this.sampleForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      sampleDescription: ['', [Validators.required, Validators.minLength(10)]],
      samplingAndAnalysisProtocol: [''],
      formatNumber: [''],
      partyReferenceNumber: [''],
      reportingDate: ['', Validators.required],
      periodOfAnalysis: [''],
      dateOfReceiving: ['', Validators.required]
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
          
          // Show the generated sample number and report number if available
          if (response.data) {
            console.log('Generated Sample Number:', response.data.sampleNumber);
            console.log('Generated Report Number:', response.data.reportNumber);
          }
          
          this.sampleForm.reset();
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.submitSuccess = false;
            // Optionally navigate to sample list
            // this.router.navigate(['/samples/list']);
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
   * @param fieldName - Name of the form field
   * @returns boolean indicating if field is invalid
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.sampleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for a field
   * @param fieldName - Name of the form field
   * @returns Error message string
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
   * @param fieldName - Name of the form field
   * @returns User-friendly label
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
   * @param formGroup - Form group to mark
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