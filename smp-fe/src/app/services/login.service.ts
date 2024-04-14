import { Injectable, OnInit } from "@angular/core";

@Injectable()
export class LogInService implements OnInit {

    user : any

    username : string 
    password : string 
    isLoggedIn: boolean=false;
    constructor(){
        this.username = ''
        this.password = ''
        this.isLoggedIn = false
    }

    ngOnInit() : void {
    }    



    
    
}