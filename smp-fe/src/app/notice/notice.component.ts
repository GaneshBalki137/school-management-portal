import { Component, OnInit } from '@angular/core';
import { Notice } from '../models/notice.model';
import { NoticeService } from '../services/notice.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-notice',
  templateUrl: './notice.component.html',
  styleUrl: './notice.component.css'
})
export class NoticeComponent implements OnInit {
  notices: Notice[];
  selectedTypeNotices: Notice[];
  selectedType: string = ''
  constructor(private noticeService: NoticeService){}
   ngOnInit(): void {
    this.noticeService.getAllNotices().subscribe(notices => {this.notices = notices
      this.getNotices('active')
      this.selectedType='all';
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
  getNotices(type: string){
      if(type=='all'){
        this.selectedType='all';
        this.selectedTypeNotices=this.notices;
      }
      else if(type=='active'){
        this.selectedType='active';
        this.selectedTypeNotices=this.notices.filter(notice => !this.isNoticeExpired(notice.expiry_date))
      }
      else if (type=='expired'){
        this.selectedType='expired';
        this.selectedTypeNotices=this.notices.filter(notice => this.isNoticeExpired(notice.expiry_date))
      }
  }
}
