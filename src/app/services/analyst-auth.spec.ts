import { TestBed } from '@angular/core/testing';

import { AnalystAuth } from './analyst-auth';

describe('AnalystAuth', () => {
  let service: AnalystAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalystAuth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
