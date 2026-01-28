import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleRegistration } from './sample-registration';

describe('SampleRegistration', () => {
  let component: SampleRegistration;
  let fixture: ComponentFixture<SampleRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
