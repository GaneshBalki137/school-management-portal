import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentHomeComponent } from './student-home/student-home.component';
import { StudentRoutingModule } from './student-routing-module';
import { StudentDashboardComponent } from './student-home/student-dashboard/student-dashboard.component';
import { StudentTimetableComponent } from './student-home/student-timetable/student-timetable.component';
import { StudentAttendanceComponent } from './student-home/student-attendance/student-attendance.component';
import { StudentAcademicsComponent } from './student-home/student-academics/student-academics.component';
import { SidebarComponent } from './student-home/sidebar/sidebar.component';



@NgModule({
  declarations: [
    StudentHomeComponent,
    StudentDashboardComponent,
    StudentTimetableComponent,
    StudentAttendanceComponent,
    StudentAcademicsComponent,
    SidebarComponent,
  ],
  imports: [
    CommonModule,
    StudentRoutingModule
  ]
})
export class StudentModule { }
