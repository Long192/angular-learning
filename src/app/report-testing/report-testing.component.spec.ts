import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportTestingComponent } from './report-testing.component';

describe('ReportTestingComponent', () => {
  let component: ReportTestingComponent;
  let fixture: ComponentFixture<ReportTestingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportTestingComponent]
    });
    fixture = TestBed.createComponent(ReportTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
