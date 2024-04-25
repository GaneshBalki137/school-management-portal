import { Component } from '@angular/core';
import { Notice } from '../../../models/notice.model';
import { NoticeService } from '../../../services/notice.service';

@Component({
  selector: 'app-admin-notice',
  templateUrl: './admin-notice.component.html',
  styleUrl: './admin-notice.component.css'
})
export class AdminNoticeComponent {
  notices: Notice[];


  noticeId: number;
  title: string;
  content: string;
  publishDate: string;
  expiryDate: string;

  constructor(private noticeService: NoticeService){}
   ngOnInit(): void {
    this.noticeService.getAllNotices()
    .subscribe(notices => 
      this.notices = notices);
   }

   isNoticeExpired(expiry_date:string):boolean {
    if(!expiry_date){
      return false;
    }
    const today=new Date();
    const expiry=new Date(expiry_date);
    return today>expiry;
  }

  
  addNotice(){
    console.log("inside addNotice");
    const notice: Notice = {
      notice_id: 1,
      title: this.title,
      content: this.content,
      publish_date: this.publishDate,
      expiry_date: this.expiryDate,
    }

    this.noticeService.addNotice(notice)
    .subscribe({
      next: (resp : any) => {
        console.log("RESPONSE--"+resp);
        this.notices = resp

        this.noticeService.getAllNotices()
       .subscribe(notices => 
      this.notices = notices);
      }
      ,
      error: (err: any) => {
        console.log("ERROR--"+err);
      }
    }
     )
  }

  deleteNotice(notice_id: number){
    this.noticeService.deleteNotice(notice_id)
      .subscribe(
        {
          next: (resp : any) => {
            this.notices = resp
          }
         ,
          error: (err: any) => {
            console.log("err: "+err);
          }
        }
      )
  }
}
