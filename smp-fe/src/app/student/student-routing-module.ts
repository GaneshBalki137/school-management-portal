import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { StudentHomeComponent } from "./student-home/student-home.component";
import { StudentDashboardComponent } from "./student-home/student-dashboard/student-dashboard.component";
import { StudentTimetableComponent } from "./student-home/student-timetable/student-timetable.component";
import { StudentAttendanceComponent } from "./student-home/student-attendance/student-attendance.component";
import { StudentAcademicsComponent } from "./student-home/student-academics/student-academics.component";
import { NoticeComponent } from "../notice/notice.component";

const routes:Routes=[
 {path: 'student', component: StudentHomeComponent,
                    children:[
                        {path: '',component:StudentDashboardComponent},
                        {path: 'dashboard', component:StudentDashboardComponent},
                        {path: 'timetable', component:StudentTimetableComponent},
                        {path: 'attendance', component:StudentAttendanceComponent},
                        {path: 'academics', component:StudentAcademicsComponent},
                        {path: 'official/notices', component: NoticeComponent},
                    ]                   
}
    
]

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports:[RouterModule]
})
export class StudentRoutingModule {};