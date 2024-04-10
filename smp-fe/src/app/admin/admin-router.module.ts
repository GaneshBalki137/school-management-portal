import { RouterModule, Routes } from "@angular/router";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { NgModule } from "@angular/core";


const routes:Routes=[
    {path: 'admin', component: AdminDashboardComponent},
    {path: 'admin/dashboard', component:AdminDashboardComponent}
]

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports:[RouterModule]
})
export class AdminRoutingModule {};