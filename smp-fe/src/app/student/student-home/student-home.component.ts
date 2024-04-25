import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-home',
  templateUrl: './student-home.component.html',
  styleUrl: './student-home.component.css'
})
export class StudentHomeComponent implements OnInit{
  currentYear: number;
  login_id: string;
  role: string;

  constructor(private router: Router,private authService:AuthService) { 
    this.currentYear=new Date().getFullYear();
  }

  ngOnInit(): void {
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
  isSidebarOpen = false;

  toggleSidebar() {
    console.log('toggle sidebar');
    this.isSidebarOpen = !this.isSidebarOpen;
    const sidebarEl = document.getElementById('sidebar');
    const sidebarSmallEl = document.getElementById('sidebar-small');
    if (sidebarEl) {
      sidebarEl.classList.toggle('closed');
      console.log('Toggling sidebar (large)'); // Add a console log for verification
    }
    if (sidebarSmallEl) {
      sidebarSmallEl.classList.toggle('closed');
      console.log('Toggling sidebar (small)'); // Add a console log for verification
    }
  }
}
