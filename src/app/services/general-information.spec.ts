import { TestBed } from '@angular/core/testing';

import { GeneralInformationservice } from './general-information';
import { GeneralInformation } from '../sample-registar/general-information/general-information';

describe('GeneralInformation', () => {
  let service: GeneralInformation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeneralInformation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
