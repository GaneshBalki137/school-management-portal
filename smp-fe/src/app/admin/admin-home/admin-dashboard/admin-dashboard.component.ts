import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Notice } from '../../../models/notice.model';
import { NoticeService } from '../../../services/notice.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit{
  studentCount: number;
  teacherCount: number;

  notices: Notice[];
  noticeId: number;
  title: string;
  content: string;
  publishDate: string;
  expiryDate: string;


  constructor(private http:HttpClient,private noticeService: NoticeService,private authService: AuthService){}
  
  ngOnInit(): void {
    this.getTotalCount()

    this.noticeService.getAllNotices()
    .subscribe(notices => 
      this.notices = notices);
  }

  getTotalCount(){
    let headers = this.authService.getTokenForHeader();
    this.http.get<any>(`http://127.0.0.1:3000/get_total_count`, {headers})
      .subscribe((data: any) => {
        this.studentCount = data.student_count;
        this.teacherCount = data.teacher_count;
      },
      (error) => {
        console.error('Error fetching total count:', error);
      });
  }

  isNoticeExpired(expiry_date:string):boolean {
    if(!expiry_date){
      return false;
    }
    const today=new Date();
    const expiry=new Date(expiry_date);
    return today>expiry;
  }
}
