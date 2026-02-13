import { TestBed } from '@angular/core/testing';

import { TechanicianService } from './techanician-service';

describe('TechanicianService', () => {
  let service: TechanicianService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TechanicianService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
