import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginModule } from './login/login.module';
import { AuthService } from './services/auth.service';
import { LogInService } from './services/login.service';
import { TeacherModule } from './teacher/teacher.module';
import { DropdownModule } from './shared/dropdown.module';
import { NoticeComponent } from './notice/notice.component';
import { StudentService } from './services/student.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { StudentModule } from './student/student.module';
import { AdminModule } from './admin/admin.module';

@NgModule({
  declarations: [
    AppComponent,
    NoticeComponent,
    HeaderComponent
  ],
  imports: [
    
    BrowserModule,
    AppRoutingModule,
    LoginModule,
    TeacherModule,
    AdminModule,
    StudentModule,
    DropdownModule,
    FormsModule
  ],
  providers: [
    AuthService,LogInService,StudentService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
