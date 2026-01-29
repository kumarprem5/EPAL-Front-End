import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResult } from './add-result';

describe('AddResult', () => {
  let component: AddResult;
  let fixture: ComponentFixture<AddResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
