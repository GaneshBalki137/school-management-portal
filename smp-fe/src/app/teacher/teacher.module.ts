import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
import { TeacherDashboardComponent } from './teacher-home/teacher-dashboard/teacher-dashboard.component';
import { TeacherRoutingModule } from './teacher.routing.module';
import { AddGradesComponent } from './teacher-home/add-grades/add-grades.component';
import { TeacherService } from './teacher.service';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './teacher-home/sidebar/sidebar.component';
import { MarkAttendenceComponent } from './teacher-home/mark-attendence/mark-attendence.component';

@NgModule({
  declarations: [
    TeacherHomeComponent,
    TeacherDashboardComponent,
    AddGradesComponent,
    SidebarComponent,
    MarkAttendenceComponent
  ],
  imports: [
    CommonModule,
    TeacherRoutingModule,
    FormsModule
  ],
  providers:[
         TeacherService
  ]
})
export class TeacherModule { }
