import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityLogin } from './quality-login';

describe('QualityLogin', () => {
  let component: QualityLogin;
  let fixture: ComponentFixture<QualityLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualityLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
