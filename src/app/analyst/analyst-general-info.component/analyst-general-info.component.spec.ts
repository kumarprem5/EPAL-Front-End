import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalystGeneralInfoComponent } from './analyst-general-info.component';

describe('AnalystGeneralInfoComponent', () => {
  let component: AnalystGeneralInfoComponent;
  let fixture: ComponentFixture<AnalystGeneralInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalystGeneralInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalystGeneralInfoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
