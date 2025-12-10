import {Injectable, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {catchError, Observable, switchMap, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private baseUrl = 'http://localhost:8000';
  public usuarioActual = signal<any>(null);

  constructor(private http: HttpClient) {}

  // Obtener cookie CSRF
  getCSRF(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sanctum/csrf-cookie`, { withCredentials: true });
  }

  // Login
  login(email: string, password: string): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.post(
        `${this.baseUrl}/login`,
        { email, password },
        { withCredentials: true }
      )),
      switchMap(() => this.user())

    );
  }

  // Registro
  register(name: string, email: string, password: string, password_confirmation: string): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.post(
        `${this.baseUrl}/register`,
        { name, email, password, password_confirmation },
        { withCredentials: true }
      ))
    );
  }

  //Desloguearse
  logout(): Observable<any> {
    return this.getCSRF().pipe(
      switchMap(() => this.http.post(
        `${this.baseUrl}/logout`,
        {},
        { withCredentials: true }
      ))
    );
  }

  // Obtener usuario autenticado
  user(): Observable<any> {
    // Nota: Para pedir el usuario (GET) no suele hacer falta pedir CSRF antes,
    // pero si lo dejas tampoco pasa nada malo.

    return this.http.get(`${this.baseUrl}/api/user`, { withCredentials: true }).pipe(


      tap((userData: any) => {
        this.usuarioActual.set(userData);
      }),

      // 3. Si da error (ej. 401 no logueado), ponemos la señal en null
      catchError((err) => {
        this.usuarioActual.set(null);
        throw err; // Re-lanzamos el error para que lo vea la consola si hace falta
      })
    );
  }

  tieneIdNegativo(): boolean {
    const user = this.usuarioActual();


    if (!user) return false;

    // 2. Comprobamos el ID
    return user.id < 0;
  }
}
