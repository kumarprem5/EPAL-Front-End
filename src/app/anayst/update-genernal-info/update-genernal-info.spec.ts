import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateGenernalInfo } from './update-genernal-info';

describe('UpdateGenernalInfo', () => {
  let component: UpdateGenernalInfo;
  let fixture: ComponentFixture<UpdateGenernalInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateGenernalInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateGenernalInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
