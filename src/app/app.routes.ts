import { Routes } from '@angular/router';
import { HomePage } from './components/home-page/home-page';
import { SampleLogin } from './components/sample-login/sample-login';
import { SampleDashboard } from './components/sample-dashboard/sample-dashboard';
import { SampleRegistration } from './sample-registar/sample-registration/sample-registration';
import { SampleEdit } from './sample-registar/sample-edit/sample-edit';
import { GeneralInformation } from './sample-registar/general-information/general-information';
import { AllSamples } from './sample-registar/all-samples/all-samples';
import { AnalystLogin } from './components/analyst-login/analyst-login';
import { AnalystDashboard } from './analyst/analyst-dashboard/analyst-dashboard';
import { AnalystAuth } from './services/analyst-auth';
import { AnalystGeneralInfoComponent } from './analyst/analyst-general-info.component/analyst-general-info.component';
import { AnalystSampleResultComponent } from './analyst/analyst-sample-result.component/analyst-sample-result.component';
import { TechnicianLogin } from './components/technician-login/technician-login';
import { TechnicianDashboard } from './techanician/technician-dashboard/technician-dashboard';
import { TechnicianSampleResult } from './techanician/technician-sample-result/technician-sample-result';
import { TechanicianGeneralInfo } from './techanician/techanician-general-info/techanician-general-info';
import { QualityLogin } from './components/quality-login/quality-login';
import { QualityDashboard } from './quality/quality-dashboard/quality-dashboard';
import { QualityGeneralInfo } from './quality/quality-general-info/quality-general-info';
import { QualitySampleResult } from './quality/quality-sample-result/quality-sample-result';

export const routes: Routes = [
  { path: 'home', component: HomePage },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'sample/login', component: SampleLogin },
  { path: 'sample/dashboard', component: SampleDashboard },
  { path: 'samples/register', component: SampleRegistration },
  { path: 'samples/edit/:id', component: SampleEdit },
  { path: 'sample/general-information/:reportNumber', component: GeneralInformation },
  { path: 'samples/all', component: AllSamples },
  { path: 'analyst/login', component: AnalystLogin },
  // { path: 'analyst/login', component: AnalystLogin },
  {
    path: 'analyst/dashboard',
    component: AnalystDashboard

  },

  {
    path: 'edit-general-info',
    component: AnalystGeneralInfoComponent
  },

  {
    path: 'edit-sample-result',
    component: AnalystSampleResultComponent
  },
  { path: 'techanician/login', component: TechnicianLogin },
  { path: 'techanician/dashboard', component: TechnicianDashboard },
  { path: 'techanician/general-info', component: TechanicianGeneralInfo },
  { path: 'techanician/sample-result', component: TechnicianSampleResult },

  { path: 'quality/login', component: QualityLogin },
  { path: 'quality/dashboard', component: QualityDashboard },
  { path: 'quality/general-info', component: QualityGeneralInfo },
  { path: 'quality/sample-result', component: QualitySampleResult },
];

