import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSamples } from './all-samples';

describe('AllSamples', () => {
  let component: AllSamples;
  let fixture: ComponentFixture<AllSamples>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSamples]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSamples);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
