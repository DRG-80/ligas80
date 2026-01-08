import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LigasCliente } from './ligas-cliente';

describe('LigasCliente', () => {
  let component: LigasCliente;
  let fixture: ComponentFixture<LigasCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LigasCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LigasCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
