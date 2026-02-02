import { Component, Input, SimpleChanges } from '@angular/core';
import { SampleHeader } from "../sample-header/sample-header";
import { GeneralInformationModel } from '../../models/general-information';
import { GeneralInformationservice } from '../../services/general-information';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SampleService, TestParameter } from '../../services/sample-service';


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

  newInfo: GeneralInformationModel = {
    name: '',
    value: '',
    reportNumber: ''
  };

  constructor(
    private infoService: GeneralInformationservice,
    private route: ActivatedRoute,
    private sampleService: SampleService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.reportNumber = params.get('reportNumber')!;
      this.loadSample(this.reportNumber);

      console.log('✅ Report Number from route:', this.reportNumber);

      this.newInfo.reportNumber = this.reportNumber;
      this.loadInformation();
    });
  }

  loadInformation() {
    this.isLoadingInfo = true;
    this.infoService
      .getByReportNumber(this.reportNumber)
      .subscribe({
        next: (res) => {
          this.isLoadingInfo = false;
          if (res.status === 'SUCCESS') {
            console.log("General Information: ", res);
            
            if (!res.data || res.data.length === 0) {
              // General Information is empty, auto-fill from test parameters
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
          
          // Load test parameters once sample is loaded
          if (this.sample?.sampleDescription) {
            this.loadTestParameters(this.sample.sampleDescription);
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
    this.sampleService
      .getTestParametersBySampleDescription(sampleDescription)
      .subscribe({
        next: (res) => {
          this.isLoadingParams = false;
          if (res.status === 'SUCCESS') {
            console.log("Test Parameters: ", res);
            this.testParameters = res.data;
            console.log("Test Parameter: ", this.testParameters);
            
            
            // Auto-fill if general information is empty
            if (this.informations.length === 0 && this.testParameters.length > 0) {
              this.autoFillFromTestParameters();
            }
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
      value: param.values || '',   // ✅ FIXED
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
        this.informations = [...this.informations, res.data]; // immutable update
        this.newInfo.name = '';
        this.newInfo.value = '';
        this.selectedParameter = null;

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
        this.informations = [...this.informations]; // force UI refresh

        this.showMessage('Information deleted 🗑️');
      }
    },
    error: () => {
      this.showMessage('Delete failed ❌', 'error');
    }
  });
}


  updateTestParameter(param: TestParameter) {
    if (!param.unit || !param.unit.trim()) {
      alert('⚠️ Unit cannot be empty');
      return;
    }

    console.log("Updating parameter:", param);
    
    this.sampleService.updateTestParameter(param).subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          console.log('✅ Parameter updated successfully');
          alert('✅ Unit updated successfully');
        } else {
          alert('❌ Failed to update unit');
        }
      },
      error: (err) => {
        console.error('Error updating parameter:', err);
        alert('❌ Error updating unit');
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
  this.newInfo.value = param.values || '';   // ✅ FIX HERE
  this.newInfo.reportNumber = this.reportNumber;
}

uiMessage = '';
uiMessageType: 'success' | 'error' | '' = '';

showMessage(message: string, type: 'success' | 'error' = 'success') {
  this.uiMessage = message;
  this.uiMessageType = type;

  setTimeout(() => {
    this.uiMessage = '';
    this.uiMessageType = '';
  }, 3000);
}


}