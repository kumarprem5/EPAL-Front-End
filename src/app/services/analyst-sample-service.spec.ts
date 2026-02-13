import { TestBed } from '@angular/core/testing';

import { AnalystSampleService } from './analyst-sample-service';

describe('AnalystSampleService', () => {
  let service: AnalystSampleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalystSampleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
