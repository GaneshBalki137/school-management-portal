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
  loading: boolean = false;
  role: string = '';

  session_login_id: string;
  session_role: string;

  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router, private loginService: LogInService) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getUserRole();
      this.authService.redirectBasedOnRole(role)
    } else {
      //console.log(this.authService.getUserRole()+" :-> No one is Logged in")
      console.log("In Login Component and No one is Logged in")
    }
  }

  async handleSubmit(): Promise<void> {
    this.loading = true;

    try {
      const data: any = await this.authService.userlogin(this.login_id, this.password).toPromise();
      const token = data.token;
      const jwtPayload = this.authService.decodeToken(token);

      const role = jwtPayload.role;
      this.authService.storeToken(token, jwtPayload.sub, role);
      this.authService.redirectBasedOnRole(role);
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Invalid username or password';
      // Handle login error
      //alert('Login Failed');
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
