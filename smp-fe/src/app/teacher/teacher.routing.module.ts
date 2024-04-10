import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { TeacherDashboardComponent } from "./teacher-home/teacher-dashboard/teacher-dashboard.component";
import { TeacherHomeComponent } from "./teacher-home/teacher-home.component";
import { TeacherAttendenceComponent } from "./teacher-home/teacher-attendence/teacher-attendence.component";

const routes:Routes=[
    {path:'teacher',component:TeacherHomeComponent,
                    children:[
                        {path:'dashboard',component:TeacherDashboardComponent},
                        {path:'student/attendence',component:TeacherAttendenceComponent}
                    ]
    }
]
@NgModule({
    imports: [ RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class TeacherRoutingModule {}