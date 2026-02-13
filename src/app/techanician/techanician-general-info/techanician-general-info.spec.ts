import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechanicianGeneralInfo } from './techanician-general-info';

describe('TechanicianGeneralInfo', () => {
  let component: TechanicianGeneralInfo;
  let fixture: ComponentFixture<TechanicianGeneralInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechanicianGeneralInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechanicianGeneralInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
