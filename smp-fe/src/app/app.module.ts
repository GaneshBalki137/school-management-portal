import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginModule } from './login/login.module';
import { AuthService } from './services/auth.service';
import { LogInService } from './services/login.service';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    
    BrowserModule,
    AppRoutingModule,
    LoginModule,
    AdminModule,
    TeacherModule
  ],
  providers: [
    AuthService,LogInService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
