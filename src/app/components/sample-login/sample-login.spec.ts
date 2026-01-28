import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleLogin } from './sample-login';

describe('SampleLogin', () => {
  let component: SampleLogin;
  let fixture: ComponentFixture<SampleLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
