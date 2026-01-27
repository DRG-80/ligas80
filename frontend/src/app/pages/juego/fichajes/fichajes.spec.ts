import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fichajes } from './fichajes';

describe('Fichajes', () => {
  let component: Fichajes;
  let fixture: ComponentFixture<Fichajes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fichajes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fichajes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
