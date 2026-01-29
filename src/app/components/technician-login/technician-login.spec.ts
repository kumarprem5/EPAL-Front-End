import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicianLogin } from './technician-login';

describe('TechnicianLogin', () => {
  let component: TechnicianLogin;
  let fixture: ComponentFixture<TechnicianLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicianLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechnicianLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
