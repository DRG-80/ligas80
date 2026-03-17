import {Injectable, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {catchError, Observable, switchMap, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  //URL del servidor
  private baseUrl = 'https://ligas80api.drg80dev.com';
  public usuarioActual = signal<any>(null);

  constructor(private http: HttpClient) {}

  // Obtener cookie CSRF
  getCSRF(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sanctum/csrf-cookie`, { withCredentials: true });
  }

  // Login
  // pide la cookie al servidr, si va bien, se realiza la petición
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


    return this.http.get(`${this.baseUrl}/api/user`, { withCredentials: true }).pipe(


      //'tap' hace que se actualice el usuario
      tap((userData: any) => {
        this.usuarioActual.set(userData);
      }),


      catchError((err) => {
        this.usuarioActual.set(null);
        throw err;
      })
    );
  }

  //Comprobar si el usuario es un administrador
  tieneIdNegativo(): boolean {
    const user = this.usuarioActual();


    if (!user) return false;

    return user.id < 0;
  }
}
