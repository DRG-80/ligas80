import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpezarSection } from './empezar-section';

describe('EmpezarSection', () => {
  let component: EmpezarSection;
  let fixture: ComponentFixture<EmpezarSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpezarSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpezarSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
