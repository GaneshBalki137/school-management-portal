import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-home',
  templateUrl: './teacher-home.component.html',
  styleUrl: './teacher-home.component.css'
})
export class TeacherHomeComponent implements OnInit {
  login_id: string;
  role: string;
  constructor(private router: Router,private authService:AuthService) { 
  }

  ngOnInit():void{
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      console.log(role+ " :-> is Logged in")
      this.authService.redirectBasedOnRole(role)
    }else{
      this.router.navigate(['/login']);
    }
  }

  handleLogOut(){
    this.authService.logOut();
    this.router.navigate(['/login']);
  }

}
