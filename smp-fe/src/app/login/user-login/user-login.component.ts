import { Component, OnChanges, OnInit } from '@angular/core';
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

session_login_id:string;
session_role:string;

constructor(private authService:AuthService,private router:Router,private loginService:LogInService) { }

ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      this.authService.redirectBasedOnRole(role)
    }else{
      //console.log(this.authService.getUserRole()+" :-> No one is Logged in")
      console.log("In Login Component and No one is Logged in")
    }
}
// async handleSubmit(): Promise<void> {
//   console.log(this.login_id);
//   console.log(this.password);
//   this.loading=true;
  

//   try {
//     await this.authService.userlogin(this.login_id, this.password).subscribe({
//       next: (data:any) => {
//         console.log(data);
//         const token = data.token;
//         console.log("this is the token" +token);

//         const jwtPayload = JSON.parse(atob(token.split('.')[1]));
//           const login_id = jwtPayload.sub;
//           const role = jwtPayload.role;


//           console.log("the role is : "+role)
//           sessionStorage.setItem('token', token);
//           sessionStorage.setItem('login_id', login_id);
//           sessionStorage.setItem('role', role);
//         this.loading=false;
//         // Navigate based on the role
//         switch (role) {
//           case 'admin':
//             this.router.navigate(['/admin']);
//             break;
//           case 'teacher':
//             this.router.navigate(['/teacher/dashboard']);
//             break;
//           case 'student':
//             this.router.navigate(['/student/dashboard']);
//             break;
//           default:
//             this.router.navigate(['/not-found']);
//             break;
//         }
//       },
//       error: (err) => {
//         console.log(err);
//         this.loading=false;
//       }
//     })
    
//   }catch(err){
//     console.error(err);
//     alert('Login Failed');
//   }finally {
//     this.loading=false;
//   }
//  }

async handleSubmit(): Promise<void> {
  this.loading = true;

  try {
    const data:any = await this.authService.userlogin(this.login_id, this.password).toPromise();
    const token = data.token;
    const jwtPayload = this.authService.decodeToken(token);

    const role = jwtPayload.role;
    this.authService.storeToken(token, jwtPayload.sub, role);
    this.authService.redirectBasedOnRole(role);
  } catch (error) {
    console.error(error);
    // Handle login error
    alert('Login Failed');
  } finally {
    this.loading = false;
  }
}


//  redirectBasedOnRole(role: string): void {
//   switch (role) {
//     case 'admin':
//       this.router.navigate(['/admin']);
//       break;
//     case 'teacher':
//       this.router.navigate(['/teacher']);
//       break;
//     case 'student':
//       this.router.navigate(['/student']);
//       break;
//     default:
//       this.router.navigate(['/not-found']);
//       break;
//   }
// }
}
