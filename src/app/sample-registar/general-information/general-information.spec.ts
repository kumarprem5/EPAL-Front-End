import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralInformation } from './general-information';

describe('GeneralInformation', () => {
  let component: GeneralInformation;
  let fixture: ComponentFixture<GeneralInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralInformation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
