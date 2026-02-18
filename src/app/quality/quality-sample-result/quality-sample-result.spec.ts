import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualitySampleResult } from './quality-sample-result';

describe('QualitySampleResult', () => {
  let component: QualitySampleResult;
  let fixture: ComponentFixture<QualitySampleResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualitySampleResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualitySampleResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
