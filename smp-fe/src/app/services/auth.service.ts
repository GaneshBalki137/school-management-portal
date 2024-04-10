import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { LogInService } from "./login.service";


@Injectable({
  providedIn:'root'
})
export class AuthService {
  constructor(private http: HttpClient, private cookieService: CookieService,private router: Router,private loginService:LogInService){}
  
  userlogin(login_id: string, password: string){
        return this.http.post('http://localhost:8000/api/login', {login_id: login_id, password: password},{withCredentials: true})
  }
}