import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjCore from '@grapecity/wijmo';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.scss'],
})
export class SaleListComponent implements OnInit, OnDestroy {
  @ViewChild('reportGrid', { static: true }) reportGrid!: wjGrid.FlexGrid;

  async initGrid() {
    this.reportGrid.headersVisibility = wjGrid.HeadersVisibility.Column;

    const column = await this.getColumn();
    const data = await this.getData();

    this.reportGrid.initialize({
      itemsSource: new wjCore.CollectionView(data, {
        groupDescriptions: column.columnGroup,
      }),
      autoGenerateColumns: false,
      columns: column.column,
    });

    this.reportGrid.autoSizeRows();
  }

  formatItem() {
    this.reportGrid.formatItem.addHandler((sender: wjGrid.FlexGrid, event: wjGrid.FormatItemEventArgs) => {
      if (event.cell.innerText == '0' && !event.cell.classList.contains('wj-group')) {
        event.cell.innerText = '';
      }
    });

    this.reportGrid.groupHeaderFormat = '{value}';
  }

  addGridEvent() {
    this.reportGrid.copied.addHandler((sender: wjCore.Control, event: wjCore.EventArgs) => {
      console.log('controll', sender), console.log('event', event);
    });
  }

  getRandomDate(from: Date, to: Date) {
    return new Date(to.getTime() + Math.random() * (to.getTime() - from.getTime()));
  }

  randomBool(): Boolean {
    return Math.random() >= 0.5;
  }

  async getData() {
    return await fetch('../../assets/saleReportData.json')
      .then(res => res.json())
      .then(data =>
        data.Table1.map((item: any) => ({
          ...item,
          Quantity: item.Quantity * 1000,
          date: this.getRandomDate(new Date(2023, 0, 1), new Date()),
          checkBox: this.randomBool(),
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

        delete columnItem.colSpan;

        return newItem;
      });
    }

    return {
      columnGroup: column.collumnGroup,
      column: newColumnList.filter(item => !item.level),
    };
  }

  ngOnInit(): void {
    this.initGrid();
    this.formatItem();
    this.addGridEvent();
  }

  ngOnDestroy(): void {
    this.reportGrid.dispose();
  }
}
