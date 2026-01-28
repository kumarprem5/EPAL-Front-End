import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleDashboard } from './sample-dashboard';

describe('SampleDashboard', () => {
  let component: SampleDashboard;
  let fixture: ComponentFixture<SampleDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
