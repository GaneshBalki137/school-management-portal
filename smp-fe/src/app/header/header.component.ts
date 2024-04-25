import { Component, OnChanges } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent{

   constructor(private authService:AuthService){
    
  }
 
  toggleSidebar() {
    const element= document.body as HTMLBodyElement
    element.classList.toggle('toggle-sidebar');
  }
}
