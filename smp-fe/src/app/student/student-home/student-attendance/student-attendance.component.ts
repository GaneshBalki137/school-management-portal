import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.component.html',
  styleUrl: './student-attendance.component.css'
})
export class StudentAttendanceComponent implements OnInit {
  attendanceRecords: any[] = [];
  sortedBy: string = 'date';
  constructor(private http: HttpClient,private cookieService:CookieService,private authService:AuthService) { }

  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const student_id = parseInt(userIdString, 10);
    let headers = this.authService.getTokenForHeader();
    this.http.get<any[]>(`http://127.0.0.1:3000/get_attendance_for_student/${student_id}`,{headers})
      .subscribe(
        (data) => {
          // Process the data received from the API
          this.attendanceRecords = data;
        },
        (error) => {
          // Handle error if any
          console.error('Error fetching attendance records:', error);
        }
      );
  }
  onSortChange(sortBy: string): void {
    this.sortedBy = sortBy;
    this.sortAttendanceRecords();
  }

  sortAttendanceRecords(): void {
    this.attendanceRecords.sort((a, b) => {
      if (a[this.sortedBy] < b[this.sortedBy]) return -1;
      if (a[this.sortedBy] > b[this.sortedBy]) return 1;
      return 0;
    });
  }
}
