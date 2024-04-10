import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherHomeComponent } from './teacher-home/teacher-home.component';
import { TeacherDashboardComponent } from './teacher-home/teacher-dashboard/teacher-dashboard.component';
import { TeacherRoutingModule } from './teacher.routing.module';
import { TeacherAttendenceComponent } from './teacher-home/teacher-attendence/teacher-attendence.component';


@NgModule({
  declarations: [
    TeacherHomeComponent,
    TeacherDashboardComponent,
    TeacherAttendenceComponent
  ],
  imports: [
    CommonModule,
    TeacherRoutingModule
  ]
})
export class TeacherModule { }
