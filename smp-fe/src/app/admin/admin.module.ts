import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-router.module';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { AdminDashboardComponent } from './admin-home/admin-dashboard/admin-dashboard.component';
import { AdminStudentComponent } from './admin-home/admin-student/admin-student.component';
import { AdminTeacherComponent } from './admin-home/admin-teacher/admin-teacher.component';



@NgModule({
  declarations: [
    AdminHomeComponent,
    AdminDashboardComponent,
    AdminStudentComponent,
    AdminTeacherComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
