import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicianSampleResult } from './technician-sample-result';

describe('TechnicianSampleResult', () => {
  let component: TechnicianSampleResult;
  let fixture: ComponentFixture<TechnicianSampleResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicianSampleResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechnicianSampleResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
