import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { QualityService } from '../../services/quality-service';
import { CommonModule } from '@angular/common';

interface SampleResultItem {
  id?: number;
  name: string;
  unit: string;
  result: string;
  protocal: string;
  standarded: string;
  sampleDescription: string;
  isNABL?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-quality-sample-result',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './quality-sample-result.html',
  styleUrl: './quality-sample-result.css',
})
export class QualitySampleResult implements OnInit {
  @Input() sample: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onUpdate = new EventEmitter<void>();

  sampleResultsList: SampleResultItem[] = [];
  loading = false;
  saving = false;
  editMode: { [key: number]: boolean } = {};
  
  // Add new item form
  showAddForm = false;
  addForm: FormGroup;
  
  // Edit forms - one per item
  editForms: { [key: number]: FormGroup } = {};

  constructor(
    private analystService: QualityService,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      unit: ['', Validators.required],
      result: ['', Validators.required],
      protocal: [''],
      standarded: [''],
      isNABL: [false]
    });
  }

  ngOnInit() {
    this.loadSampleResults();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════

  loadSampleResults() {
    if (!this.sample?.sampleDescription) {
      console.error('No sample description provided');
      return;
    }

    this.loading = true;
    this.analystService.getSampleResultsByDescription(this.sample.sampleDescription)
      .subscribe({
        next: (response) => {
          // Backend returns array directly, not wrapped in response object
          this.sampleResultsList = Array.isArray(response) ? response : [];
          
          // Initialize edit forms for each item
          this.sampleResultsList.forEach(item => {
            if (item.id) {
              this.editForms[item.id] = this.fb.group({
                name: [item.name, Validators.required],
                unit: [item.unit, Validators.required],
                result: [item.result, Validators.required],
                protocal: [item.protocal || ''],
                standarded: [item.standarded || ''],
                isNABL: [item.isNABL || false]
              });
            }
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading sample results:', error);
          this.sampleResultsList = [];
          this.loading = false;
        }
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD NEW ITEM
  // ═══════════════════════════════════════════════════════════════════════════

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.addForm.reset({ isNABL: false });
    }
  }

  addNewItem() {
    if (this.addForm.invalid) {
      this.markFormGroupTouched(this.addForm);
      return;
    }

    const newItem: SampleResultItem = {
      name: this.addForm.value.name,
      unit: this.addForm.value.unit,
      result: this.addForm.value.result,
      protocal: this.addForm.value.protocal || '',
      standarded: this.addForm.value.standarded || '',
      sampleDescription: this.sample.sampleDescription,
      isNABL: this.addForm.value.isNABL || false
    };

    this.saving = true;
    this.analystService.createSampleResult(newItem).subscribe({
      next: (response) => {
        // Backend returns created object directly
        if (response) {
          this.addForm.reset({ isNABL: false });
          this.showAddForm = false;
          this.loadSampleResults();
          this.showSuccessMessage('Result added successfully');
        } else {
          this.showErrorMessage('Failed to add result');
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error adding result:', error);
        this.showErrorMessage('Failed to add result');
        this.saving = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT ITEM
  // ═══════════════════════════════════════════════════════════════════════════

  enableEdit(item: SampleResultItem) {
    if (item.id) {
      this.editMode[item.id] = true;
    }
  }

  cancelEdit(item: SampleResultItem) {
    if (item.id) {
      this.editMode[item.id] = false;
      // Reset form to original values
      this.editForms[item.id].patchValue({
        name: item.name,
        unit: item.unit,
        result: item.result,
        protocal: item.protocal,
        standarded: item.standarded,
        isNABL: item.isNABL
      });
    }
  }

  saveEdit(item: SampleResultItem) {
    if (!item.id || !this.editForms[item.id]) return;

    const form = this.editForms[item.id];
    if (form.invalid) {
      this.markFormGroupTouched(form);
      return;
    }

    const updatedItem: SampleResultItem = {
      id: item.id,
      name: form.value.name,
      unit: form.value.unit,
      result: form.value.result,
      protocal: form.value.protocal || '',
      standarded: form.value.standarded || '',
      sampleDescription: this.sample.sampleDescription,
      isNABL: form.value.isNABL || false
    };

    this.saving = true;
    this.analystService.updateSampleResult(updatedItem).subscribe({
      next: (response) => {
        // Backend returns updated object directly
        if (response) {
          this.editMode[item.id!] = false;
          this.loadSampleResults();
          this.showSuccessMessage('Result updated successfully');
        } else {
          this.showErrorMessage('Failed to update result');
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating result:', error);
        this.showErrorMessage('Failed to update result');
        this.saving = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE ITEM
  // ═══════════════════════════════════════════════════════════════════════════

  deleteItem(item: SampleResultItem) {
    if (!item.id) return;

    const confirmed = confirm(`Are you sure you want to delete "${item.name}"?`);
    if (!confirmed) return;

    this.saving = true;
    this.analystService.deleteSampleResult(item.id).subscribe({
      next: () => {
        this.loadSampleResults();
        this.showSuccessMessage('Result deleted successfully');
        this.saving = false;
      },
      error: (error) => {
        console.error('Error deleting result:', error);
        this.showErrorMessage('Failed to delete result');
        this.saving = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  isEditing(item: SampleResultItem): boolean {
    return item.id ? !!this.editMode[item.id] : false;
  }

  getEditForm(item: SampleResultItem): FormGroup | null {
    return item.id ? this.editForms[item.id] : null;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string) {
    alert(message); // Replace with your notification system
  }

  private showErrorMessage(message: string) {
    alert(message); // Replace with your notification system
  }

  close() {
    this.onClose.emit();
  }

  refresh() {
    this.loadSampleResults();
    this.onUpdate.emit();
  }
}