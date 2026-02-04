import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Jugar } from './jugar';

describe('Jugar', () => {
  let component: Jugar;
  let fixture: ComponentFixture<Jugar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Jugar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Jugar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
