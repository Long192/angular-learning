import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjCore from '@grapecity/wijmo';
import { Store } from '@ngrx/store';
import { setReport } from 'src/slices/ReportSlice';
import { ReportService } from 'src/service/ReportService';
import { Router } from '@angular/router';
import { MergeManagerService } from 'src/service/MergeManagerService';
import { comparator } from 'src/utils/constantVar';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss'],
})
export class SaleListComponent implements OnInit, OnDestroy {
  @ViewChild('reportGrid', { static: true }) reportGrid!: wjGrid.FlexGrid;
  @ViewChild('pdfViewer') pdfViewer!: ElementRef;
  @ViewChild('style') styleDiv!: ElementRef;

  dataSource: any;
  column: any;
  hiddenButton = true;
  groupCellElement!: HTMLElement;
  report!: ReportService;

  constructor(
    private router: Router,
    private store: Store<{ report: any }>
  ) {}

  async initGrid() {
    this.reportGrid.headersVisibility = wjGrid.HeadersVisibility.Column;

    this.reportGrid.initialize({
      itemsSource: new wjCore.CollectionView(this.dataSource, {
        groupDescriptions: this.column.columnGroup,
      }),
      autoGenerateColumns: false,
      columns: this.column.column,
    });

    const newRow = new wjGrid.GroupRow();

    newRow.cssClassAll = 'grid-footer';
    newRow.align = 'right';

    this.reportGrid.columnFooters.rows.push(newRow);
    this.reportGrid.columnFooters.setCellData(0, 0, 'Tổng cộng:');
    this.reportGrid.alternatingRowStep = 1;

    this.reportGrid.mergeManager = new MergeManagerService(
      0,
      this.reportGrid.columnFooters.columns.findIndex(item => item.aggregate) - 1
    );
  }

  formatItem() {
    this.reportGrid.formatItem.addHandler((sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) => {
      const item = this.column.rules.find((item: any) => item.key === event.getColumn().binding);
      const defaultCondition =
        item && event.panel.cellType === wjGrid.CellType.Cell && !event.cell.classList.contains('wj-group');

      if (
        defaultCondition &&
        comparator[item.operation](sender.getCellData(event.row, event.col, false), item.compareValue)
      ) {
        if (item.property.includes('style')) {
          const property = item.property.replace('style.', '');
          event.cell.classList.add(`grid-dnx-class-${property}-${item.key}`);
        } else {
          (event.cell[item.property as keyof HTMLElement] as any) = item.value;
        }
      }
    });

    this.reportGrid.groupHeaderFormat = '{value}';
  }

  getRandomDate(from: Date, to: Date) {
    return new Date(to.getTime() + Math.random() * (to.getTime() - from.getTime()));
  }

  randomBool(): Boolean {
    return Math.random() >= 0.5;
  }

  async getData() {
    this.dataSource = await fetch('../../assets/saleReportData.json')
      .then(res => res.json())
      .then(data =>
        data.map((item: any) => ({
          ...item,
          Quantity: item.Quantity * 1000,
          Date: new Date(item.Date),
        }))
      );
  }

  async getColumn() {
    const column = await fetch('../../assets/saleReportColumn.json').then(res => res.json());

    this.column = {
      columnGroup: column.collumnGroup,
      column: column.columns,
      rules: column.rules,
    };
  }

  async toReportPage() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    await this.createReport();

    this.store.dispatch(setReport({ report: this.report.report }));

    this.router.navigate(['/sale-report']);
  }

  async dowloadReport() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    await this.createReport();

    const pdf = await this.report.export();

    const blobFile = URL.createObjectURL(pdf);

    const iframe = this.pdfViewer.nativeElement;

    iframe.src = blobFile;

    iframe.onload = async () => {
      await iframe.contentWindow?.print();
      URL.revokeObjectURL(blobFile);
    };

    this.reportGrid.isDisabled = false;
  }

  async createReport() {
    if (!this.report) {
      if (!this.reportGrid.cells.getCellElement(0, 0)) {
        await this.sleep(1000);
      }
      this.reportGrid.select(-1, -1);
      this.report = new ReportService(this.reportGrid, {
        reportName: 'Sale Report',
        reportSectionName: 'Sale Report Section',
        title: 'Phân tích bán hàng',
        subTitle: 'ngày 06/11/2023',
        tableName: 'sale list',
        companyName: 'CÔNG TY THƯƠNG MẠI BRAVO',
        address: 'Tầng 7 tòa 311-313 Trường Chinh, Thanh Xuân, Hà Nội',
        Page: {
          PageHeight: '10in',
          PageWidth: '12.5in',
          LeftMargin: '0.25in',
          RightMargin: '0.25in',
        },
        dataSource: {
          dataSourceName: 'SaleData',
          data: this.dataSource,
        },
        reportSectionWidth: '12in',
        rules: this.column.rules,
      });
    }
  }

  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generrateStyle() {
    const styleList = this.column.rules.filter((item: any) => item.property.includes('style'));

    styleList.forEach((item: any) => {
      const property = item.property.replace('style.', '');
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = `.grid-dnx-class-${property}-${item.key} {${property} : ${item.value} !important}`;

      this.styleDiv.nativeElement.appendChild(style);
    });
  }

  async ngOnInit() {
    this.reportGrid.beginUpdate();
    await this.getData();
    await this.getColumn();
    this.generrateStyle();
    this.initGrid();
    this.formatItem();
    this.reportGrid.endUpdate();
    this.reportGrid.autoSizeRows();
    this.hiddenButton = false;
  }

  ngOnDestroy(): void {
    this.reportGrid.dispose();
  }
}
