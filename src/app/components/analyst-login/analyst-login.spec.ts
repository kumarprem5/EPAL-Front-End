import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalystLogin } from './analyst-login';

describe('AnalystLogin', () => {
  let component: AnalystLogin;
  let fixture: ComponentFixture<AnalystLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalystLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalystLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
