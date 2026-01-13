import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LigasJuego } from './ligas-juego';

describe('LigasJuego', () => {
  let component: LigasJuego;
  let fixture: ComponentFixture<LigasJuego>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LigasJuego]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LigasJuego);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
