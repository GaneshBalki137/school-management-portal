import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { TeacherDashboardComponent } from "./teacher-home/teacher-dashboard/teacher-dashboard.component";
import { TeacherHomeComponent } from "./teacher-home/teacher-home.component";
import { TeacherAttendenceComponent } from "./teacher-home/teacher-attendence/teacher-attendence.component";
import { TeacherScheduleComponent } from "./teacher-home/teacher-schedule/teacher-schedule.component";
import { MarkAttendenceComponent } from "./teacher-home/mark-attendence/mark-attendence.component";
import { AddGradesComponent } from "./teacher-home/add-grades/add-grades.component";
import { NoticeComponent } from "../notice/notice.component";

const routes:Routes=[
    {path:'teacher',component:TeacherHomeComponent,
                    children:[
                        {path:'',component:TeacherDashboardComponent},
                        {path:'dashboard',component:TeacherDashboardComponent},
                        {path:'students/mark/attendance',component:MarkAttendenceComponent},
                        {path:'schedule',component:TeacherScheduleComponent},
                        {path:'students/add/grades',component:AddGradesComponent},
                        {path:'official/main/notice-board',component:NoticeComponent}
                    ]
    }
]
@NgModule({
    imports: [ RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class TeacherRoutingModule {}