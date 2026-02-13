import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TechanicianService } from '../../services/techanician-service';
import { CommonModule } from '@angular/common';

interface GeneralInformationItem {
  id?: number;
  name: string;
  value: string;
  reportNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-techanician-general-info',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './techanician-general-info.html',
  styleUrl: './techanician-general-info.css',
})
export class TechanicianGeneralInfo implements OnInit {
  @Input() sample: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onUpdate = new EventEmitter<void>();

  generalInfoList: GeneralInformationItem[] = [];
  loading = false;
  saving = false;
  editMode: { [key: number]: boolean } = {};
  
  showAddForm = false;
  addForm: FormGroup;
  editForms: { [key: number]: FormGroup } = {};

  constructor(
    private technicianService: TechanicianService,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      value: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadGeneralInformation();
  }

  loadGeneralInformation() {
    if (!this.sample?.reportNumber) {
      console.error('No report number provided');
      return;
    }

    this.loading = true;
    this.technicianService.getGeneralInformationByReportNumber(this.sample.reportNumber)
      .subscribe({
        next: (response) => {
          if (response?.status === 'SUCCESS') {
            this.generalInfoList = Array.isArray(response.data) 
              ? response.data 
              : response.data?.content || [];
            
            this.generalInfoList.forEach(item => {
              if (item.id) {
                this.editForms[item.id] = this.fb.group({
                  name: [item.name, Validators.required],
                  value: [item.value, Validators.required]
                });
              }
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading general information:', error);
          this.loading = false;
        }
      });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.addForm.reset();
    }
  }

  addNewItem() {
    if (this.addForm.invalid) {
      this.markFormGroupTouched(this.addForm);
      return;
    }

    const newItem: GeneralInformationItem = {
      name: this.addForm.value.name,
      value: this.addForm.value.value,
      reportNumber: this.sample.reportNumber
    };

    this.saving = true;
    this.technicianService.addGeneralInformation(newItem).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          this.addForm.reset();
          this.showAddForm = false;
          this.loadGeneralInformation();
          this.showSuccessMessage('Item added successfully');
        } else {
          this.showErrorMessage(response?.message || 'Failed to add item');
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error adding item:', error);
        this.showErrorMessage('Failed to add item');
        this.saving = false;
      }
    });
  }

  enableEdit(item: GeneralInformationItem) {
    if (item.id) {
      this.editMode[item.id] = true;
    }
  }

  cancelEdit(item: GeneralInformationItem) {
    if (item.id) {
      this.editMode[item.id] = false;
      this.editForms[item.id].patchValue({
        name: item.name,
        value: item.value
      });
    }
  }

  saveEdit(item: GeneralInformationItem) {
    if (!item.id || !this.editForms[item.id]) return;

    const form = this.editForms[item.id];
    if (form.invalid) {
      this.markFormGroupTouched(form);
      return;
    }

    const updatedItem: GeneralInformationItem = {
      id: item.id,
      name: form.value.name,
      value: form.value.value,
      reportNumber: this.sample.reportNumber
    };

    this.saving = true;
    this.technicianService.updateGeneralInformation(updatedItem).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          this.editMode[item.id!] = false;
          this.loadGeneralInformation();
          this.showSuccessMessage('Item updated successfully');
        } else {
          this.showErrorMessage(response?.message || 'Failed to update item');
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating item:', error);
        this.showErrorMessage('Failed to update item');
        this.saving = false;
      }
    });
  }

  deleteItem(item: GeneralInformationItem) {
    if (!item.id) return;

    const confirmed = confirm(`Are you sure you want to delete "${item.name}"?`);
    if (!confirmed) return;

    this.saving = true;
    this.technicianService.deleteGeneralInformation(item.id).subscribe({
      next: (response) => {
        if (response?.status === 'SUCCESS') {
          this.loadGeneralInformation();
          this.showSuccessMessage('Item deleted successfully');
        } else {
          this.showErrorMessage(response?.message || 'Failed to delete item');
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error deleting item:', error);
        this.showErrorMessage('Failed to delete item');
        this.saving = false;
      }
    });
  }

  isEditing(item: GeneralInformationItem): boolean {
    return item.id ? !!this.editMode[item.id] : false;
  }

  getEditForm(item: GeneralInformationItem): FormGroup | null {
    return item.id ? this.editForms[item.id] : null;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string) {
    alert(message);
  }

  private showErrorMessage(message: string) {
    alert(message);
  }

  close() {
    this.onClose.emit();
  }

  refresh() {
    this.loadGeneralInformation();
    this.onUpdate.emit();
  }
}