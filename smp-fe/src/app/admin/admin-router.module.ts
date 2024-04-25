import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { AdminHomeComponent } from "./admin-home/admin-home.component";
import { AdminDashboardComponent } from "./admin-home/admin-dashboard/admin-dashboard.component";
import { AdminStudentComponent } from "./admin-home/admin-student/admin-student.component"; 
import { AdminTeacherComponent } from "./admin-home/admin-teacher/admin-teacher.component";
import { AddStudentComponent } from "./admin-home/admin-student/add-student/add-student.component";
import { AdminNoticeComponent } from "./admin-home/admin-notice/admin-notice.component";
import { AcademicDetailsComponent } from "./admin-home/academic-details/academic-details.component";
import { StudentGradesComponent } from "./admin-home/academic-details/student-grades/student-grades.component";
import { StudentListComponent } from "./admin-home/academic-details/student-list/student-list.component";
import { SubjectsAllocationComponent } from "./admin-home/subjects-allocation/subjects-allocation.component";
import { ScheduleComponent } from "./admin-home/schedule/schedule.component";

const routes:Routes=[
    {path: 'admin', component: AdminHomeComponent,
                    children:[
                        {path:'', component: AdminDashboardComponent},
                        {path:'dashboard', component: AdminDashboardComponent},
                        {path:'students', component: AdminStudentComponent,
                                            children: [
                                                {path: 'add_student', component: AddStudentComponent}
                                            ]
                        },
                        {path:'teachers', component: AdminTeacherComponent},
                        {path:'notice', component: AdminNoticeComponent},
                        {path:'academic_details', component: AcademicDetailsComponent,
                                            children: [
                                                {path:'student_grades', component: StudentGradesComponent},
                                                {path:'student_list', component: StudentListComponent}
                                            ]
                        },
                        {path:'subjects_allocation', component: SubjectsAllocationComponent},
                        {path: 'schedule', component: ScheduleComponent}
                    ]
    },
    
]

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports:[RouterModule]
})
export class AdminRoutingModule {};