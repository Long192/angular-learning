import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjCore from '@grapecity/wijmo';
import { Store } from '@ngrx/store';
import { setReport } from 'src/slices/ReportSlice';
import { ReportService } from 'src/service/ReportService';
import { Router } from '@angular/router';
import { MergeManagerService } from 'src/service/MergeManagerService';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss'],
})
export class SaleListComponent implements OnInit, OnDestroy {
  @ViewChild('reportGrid', { static: true }) reportGrid!: wjGrid.FlexGrid;

  dataSource: any;
  column: any;
  hiddenButton = true;
  groupCellElement!: HTMLElement;

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

    this.reportGrid.mergeManager = new MergeManagerService(
      0,
      this.reportGrid.columnFooters.columns.findIndex(item => item.aggregate) - 1
    );
  }

  formatItem() {
    this.reportGrid.formatItem.addHandler((sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) => {
      if (
        event.cell.innerText == '0' &&
        !event.cell.classList.contains('wj-header') &&
        !event.cell.classList.contains('wj-group')
      ) {
        event.cell.innerText = '';
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

    let maxLevel = Math.max(...column.columns.filter((item: any) => item.level).map((item: any) => item.level));

    let newColumnList: any[] = [];

    for (maxLevel; maxLevel > 0; maxLevel--) {
      const listItemLevel = column.columns.filter((item: any) => item.level && item.level == maxLevel);

      newColumnList = column.columns.map((columnItem: any) => {
        delete columnItem.rowSpan;
        delete columnItem.colSpan;
        delete columnItem.checkBox;
        delete columnItem.type;
        delete columnItem.date;

        if (!columnItem.group) {
          return columnItem;
        }

        listItemLevel.forEach((item: any) => {
          if (columnItem.group === item.parent) {
            const { parent, level, group, ...newObj } = item;
            columnItem.columns ? columnItem.columns.push(newObj) : (columnItem.columns = new Array(newObj));
          }
        });

        const { group, ...newItem } = columnItem;

        return newItem;
      });
    }

    this.column = {
      columnGroup: column.collumnGroup,
      column: newColumnList.filter(item => !item.level),
    };
  }

  async toReportPage() {
    this.reportGrid.scrollIntoView(0, 0);
    this.reportGrid.isDisabled = true;

    if (!this.reportGrid.cells.getCellElement(0, 0)) {
      await this.sleep(1000);
    }

    const report = new ReportService(this.reportGrid, {
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
    });

    this.store.dispatch(setReport({ report: report.report }));

    this.router.navigate(['/sale-report']);
  }

  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async ngOnInit() {
    this.reportGrid.beginUpdate();
    await this.getData();
    await this.getColumn();
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
