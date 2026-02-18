import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityDashboard } from './quality-dashboard';

describe('QualityDashboard', () => {
  let component: QualityDashboard;
  let fixture: ComponentFixture<QualityDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualityDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
