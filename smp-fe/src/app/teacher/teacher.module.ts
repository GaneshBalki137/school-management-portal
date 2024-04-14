import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
import { TeacherDashboardComponent } from './teacher-home/teacher-dashboard/teacher-dashboard.component';
import { TeacherRoutingModule } from './teacher.routing.module';
import { TeacherAttendenceComponent } from './teacher-home/teacher-attendence/teacher-attendence.component';
import { MarkAttendenceComponent } from './teacher-home/mark-attendence/mark-attendence.component';
import { AddGradesComponent } from './teacher-home/add-grades/add-grades.component';
import { TeacherService } from './teacher.service';


@NgModule({
  declarations: [
    TeacherHomeComponent,
    TeacherDashboardComponent,
    TeacherAttendenceComponent,
    MarkAttendenceComponent,
    AddGradesComponent
  ],
  imports: [
    CommonModule,
    TeacherRoutingModule
  ],
  providers:[
         TeacherService
  ]
})
export class TeacherModule { }
