import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmissionsGraphComponent } from './admissions-graph.component';

describe('AdmissionsGraphComponent', () => {
  let component: AdmissionsGraphComponent;
  let fixture: ComponentFixture<AdmissionsGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdmissionsGraphComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdmissionsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
