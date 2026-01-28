import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleEdit } from './sample-edit';

describe('SampleEdit', () => {
  let component: SampleEdit;
  let fixture: ComponentFixture<SampleEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
