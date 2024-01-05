import { AppService } from './../app.service';
import { Component, OnInit } from '@angular/core';
import { Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.designer';

// declare var Stimulsoft: any;
  
@Component({
  selector: 'app-stimu-sale-report',
  templateUrl: './stimu-sale-report.component.html',
  styleUrls: ['./stimu-sale-report.component.scss'],
})
export class StimuSaleReportComponent implements OnInit {
  options = new Stimulsoft.Designer.StiDesignerOptions();
  designer = new Stimulsoft.Designer.StiDesigner(this.options, 'StiDesigner', false);
  
  constructor(private appService: AppService){}

  ngOnInit() {
    this.options.appearance.fullScreenMode = true;
    this.options.appearance.defaultUnit = Stimulsoft.Report.StiReportUnitType.Inches
    // this.designer.report = new Stimulsoft.Report.StiReport();
    this.designer.report = this.appService.getStiReport()
    this.designer.renderHtml('designContent');
  }
}
