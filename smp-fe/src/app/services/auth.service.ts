import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { LogInService } from "./login.service";
import { JwtPayload } from "jwt-decode";
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient, private cookieService: CookieService, private router: Router, private loginService: LogInService) { }

  userlogin(login_id: string, password: string) {
    return this.http.post('http://localhost:3000/login', { login_id: login_id, password: password }, { withCredentials: true })
  }

  isLoggedIn(): boolean {
    // const token = this.getToken();
    // console.log("Is Logged in : " + !!token && !this.isTokenExpired(token))
    // return !!token && !this.isTokenExpired(token);

    const token = this.getToken();
    console.log("Is Logged in : " + !!token && !this.isTokenExpired(token))
    return !!token && !this.isTokenExpired(token);
  }
  getToken(): string | null {
    // return sessionStorage.getItem('token');
    return this.cookieService.get('token');
  }
  storeToken(token: string, login_id: string, role: string): void {
    // sessionStorage.setItem('token', token);
    // sessionStorage.setItem('login_id', login_id);
    // sessionStorage.setItem('role', role);
    this.cookieService.set('token', token);
    this.cookieService.set('login_id', login_id);
    this.cookieService.set('role', role);
    
  }
  getUserRole(): string | null {
    // return sessionStorage.getItem('role');
    return this.cookieService.get('role');
  }
  decodeToken(token: string): DecodedToken {
     // Check if the token is null or empty
  if (!token) {
    console.error('Token is null or empty');
    return null;
  }


    //     const jwtPayload = JSON.parse(atob(token.split('.')[1]));
    //     const login_id = jwtPayload.sub;
    //     const role = jwtPayload.role;
    //     const exp=jwtPayload.exp;

    //     // Create the decoded token object
    //   const decodedToken: DecodedToken = {
    //     sub: login_id,
    //     role: role,
    //     exp: exp
    //   };
    // console.log("Decoded Token : "+decodedToken)
    //   // Return the decoded token
    //   return decodedToken;




    try {
      const jwtPayload = JSON.parse(atob(token.split('.')[1]));
      const login_id = jwtPayload.sub;
      const role = jwtPayload.role;
      const exp = jwtPayload.exp;

      const decodedToken: DecodedToken = {
        sub: login_id,
        role: role,
        exp: exp
      };

      return decodedToken;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }

  }
  isTokenExpired(token: string): boolean {
    // const expiry = this.decodeToken(token).exp;
    // console.log("IS Token Expired : "+expiry)
    // return Date.now() >= expiry * 1000;

    const decodedToken = this.decodeToken(token);
    if (!decodedToken) return true; // Token is considered expired if decoding fails
    const expiry = decodedToken.exp;
    return Date.now() >= expiry * 1000;
  }
  logOut(): void {
    // sessionStorage.removeItem('token');
    // sessionStorage.removeItem('login_id');
    // sessionStorage.removeItem('role');
    
    this.cookieService.delete('token');
    this.cookieService.delete('login_id');
    this.cookieService.delete('role');
    console.log("This is My Tocken After Logout : "+ this.cookieService.get('token'))

    
    this.router.navigate(['/login']);
  }
  redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'teacher':
        this.router.navigate(['/teacher']);
        break;
      case 'student':
        this.router.navigate(['/student']);
        break;
      default:
        this.router.navigate(['/not-found']);
        break;
    }
  }
}


interface DecodedToken extends JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

