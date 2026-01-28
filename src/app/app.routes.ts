import { Routes } from '@angular/router';
import { HomePage } from './components/home-page/home-page';
import { SampleLogin } from './components/sample-login/sample-login';
import { SampleDashboard } from './components/sample-dashboard/sample-dashboard';
import { SampleRegistration } from './sample-registar/sample-registration/sample-registration';
import { SampleEdit } from './sample-registar/sample-edit/sample-edit';
import { GeneralInformation } from './sample-registar/general-information/general-information';

export const routes: Routes = [
 { path: 'home', component: HomePage },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'sample/login', component: SampleLogin },
  { path: 'sample/dashboard', component: SampleDashboard },
   { path: 'samples/register', component: SampleRegistration},
   {
  path: 'samples/edit/:id',
  component: SampleEdit
},
  {path: 'sample/general-information/:reportNumber',
  component: GeneralInformation}
];
