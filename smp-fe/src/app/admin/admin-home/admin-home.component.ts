import { Component,OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit{
  constructor(private authService:AuthService){}
  ngOnInit():void{
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      this.authService.redirectBasedOnRole(role)
    }else{
      
    }
  }

}
