import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalystSampleResultComponent } from './analyst-sample-result.component';

describe('AnalystSampleResultComponent', () => {
  let component: AnalystSampleResultComponent;
  let fixture: ComponentFixture<AnalystSampleResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalystSampleResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalystSampleResultComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
