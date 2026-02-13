import { TestBed } from '@angular/core/testing';

import { TechanicainLoginAuth } from './techanicain-login-auth';

describe('TechanicainLoginAuth', () => {
  let service: TechanicainLoginAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TechanicainLoginAuth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
