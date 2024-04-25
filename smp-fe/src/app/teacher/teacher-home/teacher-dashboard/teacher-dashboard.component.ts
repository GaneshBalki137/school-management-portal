import { Component, OnInit } from '@angular/core';
import { Notice } from '../../../models/notice.model';
import { NoticeService } from '../../../services/notice.service';
import { CommonService } from '../../../services/common.service';
import { Timetable } from '../../../models/timetable.model';
import { TeacherService } from '../../teacher.service';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css'
})
export class TeacherDashboardComponent implements OnInit{

  notices: Notice[];
  day_of_week:string;
  todays_timetable:Timetable[];
  currentHour:string;
  dashboardNumbers: any;

  constructor(private noticeService: NoticeService,private commonService: CommonService,private teacherService: TeacherService,private cookieService: CookieService) {  }
 ngOnInit(): void {
  const userIdString = this.cookieService.get('user_id');
  const teacher_id = parseInt(userIdString, 10);
  this.currentHour=this.commonService.currentHour();
 this.teacherService.getTotalClasses(teacher_id).subscribe((data=>this.dashboardNumbers=data));
  this.noticeService.getAllNotices().subscribe(notices => this.notices = notices);
  this.day_of_week=this.commonService.todaysDay();
  console.log(this.day_of_week)
  this.teacherService.getTimetable(teacher_id,this.day_of_week).subscribe(data =>{
    this.todays_timetable=data.slice(-3);
  })
 }
  isNoticeExpired(expiry_date:string):boolean {
    if(!expiry_date){
      return false;
    }
    const today=new Date();
    const expiry=new Date(expiry_date);
    return today>expiry;
  }
  isCurrentHour(startTime: string): boolean {
   
    return startTime === this.currentHour;
}

}
