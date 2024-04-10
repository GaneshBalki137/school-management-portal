import { Injectable, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { CookieService } from "ngx-cookie-service";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { EVENT_MANAGER_PLUGINS } from "@angular/platform-browser";
// import { UserService } from "./user.service";

@Injectable()
export class LogInService implements OnInit {

    user : any

    username : string 
    password : string 
    isLoggedIn: boolean 
    constructor(){
        this.username = ''
        this.password = ''
        this.isLoggedIn = false
    }

    ngOnInit() : void {
    }    



    
    
}