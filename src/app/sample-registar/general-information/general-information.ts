import { Component, Input, SimpleChanges } from '@angular/core';
import { SampleHeader } from "../sample-header/sample-header";
import { GeneralInformationModel } from '../../models/general-information';
import { GeneralInformationservice } from '../../services/general-information';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SampleService } from '../../services/sample-service';


@Component({
  selector: 'app-general-information',
  imports: [SampleHeader,CommonModule,FormsModule],
  templateUrl: './general-information.html',
  styleUrl: './general-information.css',
})
export class GeneralInformation {

reportNumber!: string;
sample: any;

  informations: GeneralInformationModel[] = [];

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
    this.infoService
      .getByReportNumber(this.reportNumber)
      .subscribe(res => {
        if (res.status === 'SUCCESS') {

          console.log("General Information: ",res);
          
          this.informations = res.data;
        }
      });
  }

  addInformation() {
    console.log("Report: ",this.newInfo);
    
    this.infoService
      .addInformation(this.newInfo)
      .subscribe(res => {
        if (res.status === 'SUCCESS') {
          this.informations.push(res.data);
          this.newInfo.name = '';
          this.newInfo.value = '';
        }
      });
  }

  updateInformation(info: GeneralInformationModel) {
    this.infoService
      .updateInformation(info)
      .subscribe(res => {
        if (res.status === 'SUCCESS') {
          alert('Updated successfully');
        }
      });
  }
loadSample(reportNumber: string) {
  this.sampleService.getByReportNumber(reportNumber).subscribe(res => {
    if (res.status === 'SUCCESS') {
      this.sample = res.data;
    }
  });
}


}