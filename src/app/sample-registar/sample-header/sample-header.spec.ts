import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleHeader } from './sample-header';

describe('SampleHeader', () => {
  let component: SampleHeader;
  let fixture: ComponentFixture<SampleHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
