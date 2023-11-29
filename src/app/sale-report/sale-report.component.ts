import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { DesignerComponent, ViewerComponent } from '@grapecity/activereports-angular';
import * as activeReportCore from '@grapecity/activereports';
import { createReport } from 'src/utils/createReportFunc';
import { Store } from '@ngrx/store';
import { reportSelector } from 'src/slices/ReportSlice';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.scss'],
})
export class SaleReportComponent implements OnInit {
  @ViewChild(DesignerComponent, { static: true }) reportDesigner!: DesignerComponent;
  @ViewChild(ViewerComponent, { static: true }) reportViewer!: ViewerComponent;

  designerHidden = false;
  firstPreview = true;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private store: Store<{ report: any }>
  ) {}

  updateToolbar() {
    const designButton = {
      key: '$desingerButton',
      text: 'Open Designer',
      iconCssClass: 'mdi mdi-pencil',
      enable: true,
      action: () => {
        this.designerHidden = false;
      },
    };

    this.reportViewer.toolbar.addItem(designButton);

    this.reportViewer.toolbar.updateLayout({
      default: [
        '$desingerButton',
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

    return Promise.resolve();
  };

  onSaveReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    // const reportId = info.id || `NewReport${++this.counter}`;
    // this.reportStorage.set(reportId, info.definition);
    return Promise.resolve({ displayName: 'report' });
  };

  onSaveAsReport = (info: any) => {
    console.log(JSON.stringify(info.definition));
    // const reportId = `NewReport${++this.counter}`;
    // this.reportStorage.set(reportId, info.definition);
    return Promise.resolve({ id: 'report', displayName: 'report' });
  };

  async ngOnInit() {
    let definition;
    this.store
      .select(reportSelector)
      .subscribe((data: any) => (definition = data.report))
      .unsubscribe();

    if (definition && Object.keys(definition).length) {
      this.reportDesigner.report = {
        displayName: 'saleReport',
        definition: definition,
      };
    }
  }
}
