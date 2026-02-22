import { TestBed } from '@angular/core/testing';

import { JobCardSevice } from './job-card-sevice';

describe('JobCardSevice', () => {
  let service: JobCardSevice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JobCardSevice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
