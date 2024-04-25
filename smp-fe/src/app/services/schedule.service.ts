import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Timetable } from "../models/timetable.model";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    constructor(private http:HttpClient,private authService:AuthService){}

    addToSchedule(schedule: Timetable){
        let headers = this.authService.getTokenForHeader();
        return this.http.post<Timetable>("http://127.0.0.1:3000/add_schedule", schedule,{headers});
    }
}