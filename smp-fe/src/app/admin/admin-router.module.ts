import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { AdminHomeComponent } from "./admin-home/admin-home.component";
import { AdminDashboardComponent } from "./admin-home/admin-dashboard/admin-dashboard.component";


const routes:Routes=[
    {path: 'admin', component: AdminHomeComponent,
                    children:[
                        {path:'', component: AdminDashboardComponent},
                        {path:'dashboard', component: AdminDashboardComponent}
                    ]
    },
    
]

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports:[RouterModule]
})
export class AdminRoutingModule {};