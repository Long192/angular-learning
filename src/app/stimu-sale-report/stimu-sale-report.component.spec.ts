import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StimuSaleReportComponent } from './stimu-sale-report.component';

describe('StimuSaleReportComponent', () => {
  let component: StimuSaleReportComponent;
  let fixture: ComponentFixture<StimuSaleReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StimuSaleReportComponent]
    });
    fixture = TestBed.createComponent(StimuSaleReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
