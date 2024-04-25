import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-academics',
  templateUrl: './student-academics.component.html',
  styleUrl: './student-academics.component.css'
})
export class StudentAcademicsComponent implements OnInit {
  selectedSemester: number=1;
  semesters: number[] = [1, 2, 3, 4]; // Assuming semesters are numbered
  grades: any[] = [];
  showGrades: boolean = false;
  student_id: number ;
  constructor(private http: HttpClient,private cookieService:CookieService,private authService:AuthService) { }

  ngOnInit(): void {
    const userIdString = this.cookieService.get('user_id');
    const student_id = parseInt(userIdString, 10);
    this.student_id = student_id;
    this.onSemesterChange("1");
  }

  onSemesterChange(sem:string): void {
    this.selectedSemester=parseInt(sem);
    if (this.selectedSemester) {
      // Make HTTP request to fetch grades for the selected semester
      let headers= this.authService.getTokenForHeader();
      this.http.get<any[]>(`http://127.0.0.1:3000/get_grades_of_sem/${this.student_id}/${this.selectedSemester}`,{headers})
        .subscribe(
          (data) => {
            // Process the data received from the API
            this.grades = data;
            this.showGrades = true;
          },
          (error) => {
            // Handle error if any
            console.error('Error fetching grades:', error);
          }
        );
    } else {
      this.showGrades = false;
    }
  }
}
