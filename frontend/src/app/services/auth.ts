import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post('/login', data, { withCredentials: true });
  }

  register(data: { name: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post('/register', data, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post('/logout', {}, { withCredentials: true });
  }

  user(): Observable<any> {
    return this.http.get('/api/user', { withCredentials: true });
  }

}
