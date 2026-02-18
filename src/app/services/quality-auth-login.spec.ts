import { TestBed } from '@angular/core/testing';

import { QualityAuthLogin } from './quality-auth-login';

describe('QualityAuthLogin', () => {
  let service: QualityAuthLogin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QualityAuthLogin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
