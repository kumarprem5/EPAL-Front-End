import { Component, Input, SimpleChanges } from '@angular/core';
import { SampleHeader } from "../sample-header/sample-header";
import { GeneralInformationModel } from '../../models/general-information';
import { GeneralInformationservice } from '../../services/general-information';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SampleService, TestParameter } from '../../services/sample-service';

interface MasterCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  subCategories?: SubCategory[];
}

interface SubCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  masterCategory?: MasterCategory;
  parameterGroups?: ParameterGroup[];
}

interface ParameterGroup {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  subCategory?: SubCategory;
  resultParameters?: ResultParameter[];
}

interface ResultParameter {
  id: number;
  parameterName: string;
  unit?: string;
  minValue?: string;
  maxValue?: string;
  description?: string;
  active: boolean;
  isNBL: boolean;
  sampleDescription?: string;
  parameterGroup?: ParameterGroup;
}

interface SampleResult {
  id?: number;
  unit: string;
  name: string;
  result: string;
  sampleDescription: string;
  protocal: string;
  standarded: string;
  isNABL?: boolean;
}

@Component({
  selector: 'app-general-information',
  imports: [SampleHeader,CommonModule,FormsModule],
  templateUrl: './general-information.html',
  styleUrl: './general-information.css',
})
export class GeneralInformation {
reportNumber!: string;
  sample: any;
  selectedParameter: TestParameter | null = null;

  informations: GeneralInformationModel[] = [];
  testParameters: TestParameter[] = [];
  isLoadingInfo = false;
  isLoadingParams = false;

  // Cascading dropdown data
  masterCategories: MasterCategory[] = [];
  subCategories: SubCategory[] = [];
  parameterGroups: ParameterGroup[] = [];
  resultParameters: ResultParameter[] = [];

  // Selected Sample Results (from backend)
  selectedSampleResults: SampleResult[] = [];
  isLoadingSampleResults = false;

  // Selected values
  selectedMasterCategory: MasterCategory | null = null;
  selectedSubCategory: SubCategory | null = null;
  selectedParameterGroup: ParameterGroup | null = null;

  // Loading states for cascading dropdowns
  isLoadingMasterCategories = false;
  isLoadingSubCategories = false;
  isLoadingParameterGroups = false;
  isLoadingResultParameters = false;

  newInfo: GeneralInformationModel = {
    name: '',
    value: '',
    reportNumber: ''
  };

  uiMessage = '';
  uiMessageType: 'success' | 'error' | '' = '';

  constructor(
    private infoService: GeneralInformationservice,
    private route: ActivatedRoute,
    private sampleService: SampleService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.reportNumber = params.get('reportNumber')!;
      console.log('✅ Report Number from route:', this.reportNumber);
      this.loadSample(this.reportNumber);
      this.newInfo.reportNumber = this.reportNumber;
      this.loadInformation();
      this.loadMasterCategories();
    });
  }

  // ========================================
  // CASCADING DROPDOWN METHODS
  // ========================================

  loadMasterCategories() {
    this.isLoadingMasterCategories = true;

    this.sampleService.getMasterCategories().subscribe({
      next: (res: MasterCategory[]) => {
        console.log("Categories:", res);
        this.isLoadingMasterCategories = false;
        this.masterCategories = res;
        console.log('Master Categories loaded:', this.masterCategories);
      },
      error: (err) => {
        this.isLoadingMasterCategories = false;
        console.error('Error loading master categories:', err);
        this.showMessage('Failed to load master categories ❌', 'error');
      }
    });
  }

  onMasterCategoryChange(masterCategory: MasterCategory | null) {
    this.selectedMasterCategory = masterCategory;
    this.selectedSubCategory = null;
    this.selectedParameterGroup = null;
    this.subCategories = [];
    this.parameterGroups = [];
    this.resultParameters = [];

    if (masterCategory) {
      this.loadSubCategories(masterCategory.id);
    }
  }

  loadSubCategories(masterCategoryId: number) {
    this.isLoadingSubCategories = true;

    this.sampleService.getSubCategoriesByMasterCategory(masterCategoryId)
      .subscribe({
        next: (res: any[]) => {
          console.log("Sub Categories:", res);
          this.subCategories = res;
          this.isLoadingSubCategories = false;
        },
        error: (err) => {
          this.isLoadingSubCategories = false;
          console.error(err);
          this.showMessage('Failed to load subcategories ❌', 'error');
        }
      });
  }

  onSubCategoryChange(subCategory: SubCategory | null) {
    this.selectedSubCategory = subCategory;
    this.selectedParameterGroup = null;
    this.parameterGroups = [];
    this.resultParameters = [];

    if (subCategory) {
      this.loadParameterGroups(subCategory.id);
    }
  }

  compareSubCategory(a: any, b: any): boolean {
    return a && b ? a.id === b.id : a === b;
  }

  loadParameterGroups(subCategoryId: number) {
    this.isLoadingParameterGroups = true;

    this.sampleService.getParameterGroupsBySubCategory(subCategoryId)
      .subscribe({
        next: (res: any[]) => {
          console.log('Parameter Groups loaded:', res);
          this.parameterGroups = res;
          this.isLoadingParameterGroups = false;
        },
        error: (err) => {
          this.isLoadingParameterGroups = false;
          console.error(err);
          this.showMessage('Failed to load parameter groups ❌', 'error');
        }
      });
  }

  onParameterGroupChange(parameterGroup: ParameterGroup | null) {
    this.selectedParameterGroup = parameterGroup;
    this.resultParameters = [];

    if (parameterGroup) {
      this.loadResultParameters(parameterGroup.id);
    }
  }

  loadResultParameters(parameterGroupId: number) {
    this.isLoadingResultParameters = true;

    this.sampleService.getResultParametersByGroup(parameterGroupId).subscribe({
      next: (res: any) => {
        this.isLoadingResultParameters = false;
        console.log('API Response:', res);

        if (Array.isArray(res)) {
          this.resultParameters = res;
        } else if (res.status === 'SUCCESS') {
          this.resultParameters = res.data;
        } else if (res.data) {
          this.resultParameters = res.data;
        }

        console.log('Final Result Parameters:', this.resultParameters);
      },
      error: (err) => {
        this.isLoadingResultParameters = false;
        console.error('Error:', err);
      }
    });
  }

  // ========================================
  // SAMPLE RESULT CRUD OPERATIONS
  // ========================================

  // SELECT a parameter and save it as Sample Result
  selectResultParameter(parameter: ResultParameter) {
    if (!this.sample?.sampleDescription) {
      this.showMessage('Sample description not found ❌', 'error');
      return;
    }

    const sampleResult: SampleResult = {
      name: parameter.parameterName,
      unit: parameter.unit || '',
      result: parameter.minValue || '',
      protocal: parameter.description || '',
      standarded: parameter.maxValue || '',
      isNABL: parameter.isNBL,
      sampleDescription: this.sample.sampleDescription
    };

    console.log('Saving Sample Result:', sampleResult);

    this.sampleService.createSampleResult(sampleResult).subscribe({
      next: (res) => {
        console.log('Sample Result saved:', res);
        this.showMessage(`✅ ${parameter.parameterName} selected successfully`);
        // Reload selected sample results
        this.loadSelectedSampleResults();
      },
      error: (err) => {
        console.error('Error saving sample result:', err);
        this.showMessage('Failed to select parameter ❌', 'error');
      }
    });
  }

  // LOAD all selected sample results for this sample
  loadSelectedSampleResults() {
    if (!this.sample?.sampleDescription) {
      return;
    }

    this.isLoadingSampleResults = true;

    this.sampleService.findSampleResultsByDescription(this.sample.sampleDescription).subscribe({
      next: (results: SampleResult[]) => {
        console.log('Selected Sample Results:', results);
        this.selectedSampleResults = results;
        this.isLoadingSampleResults = false;
      },
      error: (err) => {
        console.error('Error loading sample results:', err);
        this.isLoadingSampleResults = false;
        this.showMessage('Failed to load selected parameters ❌', 'error');
      }
    });
  }

  // UPDATE a sample result
  updateSampleResult(sampleResult: SampleResult) {
    if (!sampleResult.name?.trim()) {
      this.showMessage('Parameter name cannot be empty ❌', 'error');
      return;
    }

    console.log('Updating Sample Result:', sampleResult);

    this.sampleService.updateSampleResult(sampleResult).subscribe({
      next: (res) => {
        console.log('Sample Result updated:', res);
        this.showMessage('✅ Parameter updated successfully');
        this.loadSelectedSampleResults();
      },
      error: (err) => {
        console.error('Error updating sample result:', err);
        this.showMessage('Failed to update parameter ❌', 'error');
      }
    });
  }

  // DELETE a sample result
  deleteSampleResult(sampleResult: SampleResult, index: number) {
    if (!sampleResult.id) {
      this.showMessage('Invalid sample result ID ❌', 'error');
      return;
    }

    if (!confirm(`Remove "${sampleResult.name}"?`)) return;

    this.sampleService.deleteSampleResult(sampleResult.id).subscribe({
      next: (message: string) => {
        console.log('Delete response:', message);
        this.selectedSampleResults.splice(index, 1);
        this.selectedSampleResults = [...this.selectedSampleResults];
        this.showMessage('🗑️ Parameter removed successfully');
      },
      error: (err) => {
        console.error('Error deleting sample result:', err);
        this.showMessage('Failed to delete parameter ❌', 'error');
      }
    });
  }

  // ========================================
  // EXISTING GENERAL INFORMATION METHODS
  // ========================================

  loadInformation() {
    this.isLoadingInfo = true;
    this.infoService.getByReportNumber(this.reportNumber).subscribe({
      next: (res) => {
        this.isLoadingInfo = false;
        if (res.status === 'SUCCESS') {
          console.log("General Information: ", res);
          if (!res.data || res.data.length === 0) {
            console.log("📋 General Information is empty, will auto-fill from test parameters");
            this.informations = [];
          } else {
            this.informations = res.data;
          }
        }
      },
      error: (err) => {
        this.isLoadingInfo = false;
        console.error("Error loading general information:", err);
      }
    });
  }

  loadSample(reportNumber: string) {
    this.sampleService.getByReportNumber(reportNumber).subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          this.sample = res.data;
          if (this.sample?.sampleDescription) {
            this.loadTestParameters(this.sample.sampleDescription);
            this.loadInformation();
            // Load selected sample results
            this.loadSelectedSampleResults();
          }
        }
      },
      error: (err) => {
        console.error("Error loading sample:", err);
      }
    });
  }

  loadTestParameters(sampleDescription: string) {
    this.isLoadingParams = true;
    this.sampleService.getTestParametersBySampleDescription(sampleDescription).subscribe({
      next: (res) => { 
        console.log("sample Description: ", sampleDescription);
        this.isLoadingParams = false;
        if (res.status === 'SUCCESS') {
          console.log("Test Parameters: ", res);
          this.testParameters = res.data;
          console.log("Test Parameter: ", this.testParameters);
          
          setTimeout(() => {
            if (this.informations.length === 0 && this.testParameters.length > 0) {
              this.autoFillFromTestParameters();
            }
          }, 300);
        }
      },
      error: (err) => {
        this.isLoadingParams = false;
        console.error("Error loading test parameters:", err);
      }
    });
  }

  autoFillFromTestParameters() {
    this.testParameters.forEach(param => {
      const newInfo: GeneralInformationModel = {
        name: param.parameterName,
        value: param.values || '',
        reportNumber: this.reportNumber
      };

      this.infoService.addInformation(newInfo).subscribe({
        next: (res) => {
          if (res.status === 'SUCCESS') {
            this.informations.push(res.data);
          }
        }
      });
    });
  }

  addInformation() {
    if (!this.newInfo.name.trim() || !this.newInfo.value.trim()) {
      this.showMessage('Please fill all fields', 'error');
      return;
    }

    this.infoService.addInformation(this.newInfo).subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          this.informations = [...this.informations, res.data];
          this.newInfo.name = '';
          this.newInfo.value = '';
          this.selectedParameter = null;
          this.loadInformation();
          this.showMessage('Information added successfully ✅');
        }
      },
      error: () => {
        this.showMessage('Failed to add information ❌', 'error');
      }
    });
  }

  updateInformation(info: GeneralInformationModel) {
    if (!info.name.trim() || !info.value.trim()) {
      this.showMessage('Name & Value cannot be empty', 'error');
      return;
    }

    this.infoService.updateInformation(info).subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          this.showMessage('Information updated successfully 💾');
        }
      },
      error: () => {
        this.showMessage('Update failed ❌', 'error');
      }
    });
  }

  removeInformation(info: GeneralInformationModel, index: number) {
    if (!confirm(`Remove "${info.name}"?`)) return;

    this.infoService.deleteInformation(info.id!).subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          this.informations.splice(index, 1);
          this.informations = [...this.informations];
          this.showMessage('Information deleted 🗑️');
        }
      },
      error: () => {
        this.showMessage('Delete failed ❌', 'error');
      }
    });
  }

  onParameterSelect(param: TestParameter | null) {
    if (!param) {
      this.selectedParameter = null;
      this.newInfo.name = '';
      this.newInfo.value = '';
      return;
    }

    this.selectedParameter = param;
    this.newInfo.name = param.parameterName;
    this.newInfo.value = param.values || '';
    this.newInfo.reportNumber = this.reportNumber;
  }

  showMessage(message: string, type: 'success' | 'error' = 'success') {
    this.uiMessage = message;
    this.uiMessageType = type;

    setTimeout(() => {
      this.uiMessage = '';
      this.uiMessageType = '';
    }, 3000);
  }
}