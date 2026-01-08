import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquiposCliente } from './equipos-cliente';

describe('EquiposCliente', () => {
  let component: EquiposCliente;
  let fixture: ComponentFixture<EquiposCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquiposCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquiposCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
