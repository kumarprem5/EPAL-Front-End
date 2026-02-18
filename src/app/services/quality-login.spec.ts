import { TestBed } from '@angular/core/testing';

import { QualityLogin } from './quality-login';

describe('QualityLogin', () => {
  let service: QualityLogin;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QualityLogin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
