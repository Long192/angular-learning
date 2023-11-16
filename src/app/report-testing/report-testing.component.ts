import { ContentObserver } from '@angular/cdk/observers';
import {
  // AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DesignerComponent, ViewerComponent } from '@grapecity/activereports-angular';

import * as activeReport from '@grapecity/activereports';

// import { dataSources } from '../../utils/constantVar';

@Component({
  selector: 'app-report-testing',
  templateUrl: './report-testing.component.html',
  styleUrls: ['./report-testing.component.scss'],
})
export class ReportTestingComponent implements OnInit {
  @ViewChild(ViewerComponent, { static: false }) reportViewer!: ViewerComponent;
  @ViewChild(DesignerComponent, { static: false })
  reportDesigner: DesignerComponent = new DesignerComponent();
  designerHidden = false;
  firstPreview = true;
  reportStorage = new Map();
  counter = 0;
  // initialReport: any = { id: '../../assets/report.rdlx-json' };
  // dataSources: any;

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    console.log(this.reportDesigner);
    fetch('../../assets/dataResource.json')
      .then(res => res.json())
      .then(data => (this.reportDesigner.dataSources = data));

    fetch('../../assets/report.rdlx-json')
      .then(res => res.json())
      .then(data => {
        this.reportDesigner.report = {
          definition: data,
          displayName: 'test',
        };
      });
  }

  updateToolbar(): void {
    var designButton = {
      key: '$openDesigner',
      text: 'Edit in Designer',
      iconCssClass: 'mdi mdi-pencil',
      enabled: true,
      action: () => {
        this.designerHidden = false;
        this.changeDetectorRef.detectChanges();
      },
    };
    this.reportViewer.toolbar.addItem(designButton);
    this.reportViewer.toolbar.updateLayout({
      default: [
        '$openDesigner',
        '$split',
        '$navigation',
        '$split',
        '$refresh',
        '$split',
        '$history',
        '$split',
        '$zoom',
        '$fullscreen',
        '$split',
        '$print',
        '$split',
        '$singlepagemode',
        '$continuousmode',
        '$galleymode',
      ],
    });
  }

  onReportPreview = (report: any) => {
    if (this.firstPreview) {
      this.updateToolbar();
      this.firstPreview = false;
    }
    this.designerHidden = true;
    this.reportViewer.open(report.definition);
    this.changeDetectorRef.detectChanges();
    return Promise.resolve();
  };

  onSaveReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    const reportId = info.id || `NewReport${++this.counter}`;
    this.reportStorage.set(reportId, info.definition);
    return Promise.resolve({ displayName: reportId });
  };

  onSaveAsReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    const reportId = `NewReport${++this.counter}`;
    this.reportStorage.set(reportId, info.definition);
    return Promise.resolve({ id: reportId, displayName: reportId });
  };

  async ngOnInit() {
    // this.reportDesigner.open(this.initialReport.definition)
    // const data = await
    // this.changeDetectorRef.detectChanges();
    // this.reportDesigner.report = await
    // console.log(activeReport.Core.Rdl);
    setTimeout(() => {
      console.log(this.reportDesigner);
    }, 5000);
  }
}
