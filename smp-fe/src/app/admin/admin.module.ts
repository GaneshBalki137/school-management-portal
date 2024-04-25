import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-router.module';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { AdminDashboardComponent } from './admin-home/admin-dashboard/admin-dashboard.component';
import { AdminStudentComponent } from './admin-home/admin-student/admin-student.component';
import { AdminTeacherComponent } from './admin-home/admin-teacher/admin-teacher.component';
import { FormsModule} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AddStudentComponent } from './admin-home/admin-student/add-student/add-student.component';
import { AdminNoticeComponent } from './admin-home/admin-notice/admin-notice.component'; 
import { AcademicDetailsComponent } from './admin-home/academic-details/academic-details.component';
import { StudentGradesComponent } from './admin-home/academic-details/student-grades/student-grades.component';
import { StudentListComponent } from './admin-home/academic-details/student-list/student-list.component';
import { SubjectsAllocationComponent } from './admin-home/subjects-allocation/subjects-allocation.component';
import { ScheduleComponent } from './admin-home/schedule/schedule.component';
import { SidebarComponent } from './admin-home/sidebar/sidebar.component';
import { AdmissionsGraphComponent } from './admin-home/admin-dashboard/admissions-graph/admissions-graph.component';

@NgModule({
  declarations: [
    AdminHomeComponent,
    AdminDashboardComponent,
    AdminStudentComponent,
    AdminTeacherComponent,
    AddStudentComponent,
    AdminNoticeComponent,
    AcademicDetailsComponent,
    StudentGradesComponent,
    StudentListComponent,
    SubjectsAllocationComponent,
    ScheduleComponent,
    SidebarComponent,
    AdmissionsGraphComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    RouterModule
  ]
})
export class AdminModule { }
