import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LogInService } from '../../services/login.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.css'
})
export class UserLoginComponent implements OnInit {
login_id: string;
password: string;
loading:boolean=false;
role:string='teacher'
ngOnInit(): void {}

constructor(private authService:AuthService,private router:Router,private loginService:LogInService) { }


async handleSubmit(): Promise<void> {
  console.log(this.login_id);
  console.log(this.password);
  this.loading=true;
  // if (this.role=='teacher'){
  //             this.router.navigate(['/teacher']);
  //            }

  try {
    await this.authService.userlogin(this.login_id, this.password).subscribe({
      next: (data:any) => {
        console.log(data);
        // this.loginService.user=data.user;
        // this.loginService.username=data.user.login_id;
        // localStorage.setItem('user', JSON.stringify(data.user));
        // this.loading=false;
        // if (data.user.role=='admin'){
        //   this.router.navigate(['/admin/dashboard']);
        // }
        // else if(data.user.role=='teacher'){
        //   this.router.navigate(['/teacher/dashboard']);
        // }else if(data.user.role=='student'){
        //   this.router.navigate(['/student/dashboard']);
        // }else{
        //   this.router.navigate(['/not-found']);
        // }
      },
      error: (err) => {
        console.log(err);
        this.loading=false;
      }
    })
    
  }catch(err){
    console.error(err);
    alert('Login Failed');
  }finally {
    this.loading=false;
  }
 }
}
