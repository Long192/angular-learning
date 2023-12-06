import { Component, ElementRef, OnDestroy, OnInit, Signal, ViewChild } from '@angular/core';
import { signal } from '@angular/core';
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
  gridHeight!: string;

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
      columns: this.column.columns,
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

    this.reportGrid.formatItem.addHandler((sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) => {
      this.formatItemByRule(sender, event);
      this.addClass(event);
    });

    this.reportGrid.groupHeaderFormat = '{value}';
  }

  addClass(event: wjGrid.FormatItemEventArgs) {
    event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-cell`);
    switch (event.panel.cellType) {
      case wjGrid.CellType.ColumnHeader:
        event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-header`);
        break;
      case wjGrid.CellType.Cell:
        if (event.panel.rows[event.row] instanceof wjGrid.GroupRow) {
          event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-group`);
          break;
        }
        event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-body`);

        if (event.cell.classList.contains('wj-alt')) {
          event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-alt`);
        }

        break;
      case wjGrid.CellType.ColumnFooter:
        event.cell.classList.add(`grid-dnx-class-${this.column.style.common.key}-fotter`);
    }
  }

  getGridHeight() {
    return this.gridHeight || 'auto';
  }

  formatItemByRule(sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) {
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

    this.gridHeight = column.style.common.gridHeight;

    this.column = {
      columnGroup: column.collumnGroup,
      columns: column.columns,
      rules: column.rules,
      style: column.style,
    };
  }

  async toReportPage() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    await this.createReport(false);

    this.store.dispatch(setReport({ report: this.report.report }));

    this.router.navigate(['/sale-report']);
  }

  async dowloadReport() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    await this.createReport(false);

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

  async createReport(renderFromColumnJson: boolean) {
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
        renderFromColumnJson,
        style: this.column.style
      });
    }
  }

  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generrateStyle() {
    const styleList = this.column.rules.filter((item: any) => item.property.includes('style'));

    Object.keys(this.column.style.dynamix).forEach((item: any) => {
      const style = document.createElement('style');
      let styleClass = `.grid-dnx-class-${this.column.style.common.key}-${item} { `;
      style.type = 'text/css';
      this.column.style.dynamix[item].forEach((styleItem: any) => {
        if (styleItem.gridProperty) {
          styleClass = styleClass.concat(`${styleItem.gridProperty} : ${styleItem.value} !important ; `);
        }
      });
      styleClass += '}';

      style.innerHTML = styleClass;

      this.styleDiv.nativeElement.appendChild(style);
    });

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
    this.reportGrid.endUpdate();
    this.reportGrid.autoSizeRows();
    this.hiddenButton = false;
  }

  ngOnDestroy(): void {
    this.reportGrid.dispose();
  }
}
