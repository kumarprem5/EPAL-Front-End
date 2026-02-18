import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityGeneralInfo } from './quality-general-info';

describe('QualityGeneralInfo', () => {
  let component: QualityGeneralInfo;
  let fixture: ComponentFixture<QualityGeneralInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityGeneralInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualityGeneralInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
