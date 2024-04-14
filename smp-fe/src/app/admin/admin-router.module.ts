import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { AdminHomeComponent } from "./admin-home/admin-home.component";
import { AdminDashboardComponent } from "./admin-home/admin-dashboard/admin-dashboard.component";
import { AdminStudentComponent } from "./admin-home/admin-student/admin-student.component"; 
import { AdminTeacherComponent } from "./admin-home/admin-teacher/admin-teacher.component";


const routes:Routes=[
    {path: 'admin', component: AdminHomeComponent,
                    children:[
                        {path:'', component: AdminDashboardComponent},
                        {path:'dashboard', component: AdminDashboardComponent},
                        {path:'students', component: AdminStudentComponent},
                        {path:'teachers', component: AdminTeacherComponent}
                    ]
    },
    
]

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports:[RouterModule]
})
export class AdminRoutingModule {};