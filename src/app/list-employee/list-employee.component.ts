import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { CustomPagination } from '../../service/CustomPaginationService';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { getEmployee, selectorEmployee } from 'src/slices/EmployeeSlice';
import * as wjcCore from '@grapecity/wijmo';
import * as wjcGrid from '@grapecity/wijmo.grid';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-list-employee',
  templateUrl: './list-employee.component.html',
  styleUrls: ['./list-employee.component.scss'],
  providers: [{ provide: MatPaginatorIntl, useClass: CustomPagination }],
})
export class ListEmployeeComponent implements OnInit, OnDestroy {
  @ViewChild('flex', { static: true }) flex!: wjcGrid.FlexGrid;

  page = 1;
  limit = 50;
  // ListEmployee: any = this.store.select(state => state.employe);
  ListEmployee: any = [];
  column: any = [];
  paginationData: any = [];
  pageSizeOption = [10, 20, 50, 100];
  columnSubscrible: any;

  constructor(
    private router: Router,
    private store: Store<{ employe: any }>,
    private http: HttpClient
  ) {}

  getDataJson() {
    this.columnSubscrible = this.http.get('../../assets/column.json').subscribe(res => (this.column = res));
  }

  getColumns() {
    return this.column.map((item: any) => item.dataKey);
  }

  paginator(event?: any) {
    if (event) {
      this.page = event.pageIndex + 1;
      this.limit = event.pageSize;
    }
    const skip = (this.page - 1) * this.limit;
    const take = skip + this.limit;
    // if (this.ListEmployee.state().employee.length) {
    if (this.ListEmployee.length) {
      this.paginationData = new wjcCore.CollectionView(this.ListEmployee, {
        groupDescriptions: ['GenderName'],
        getError: (item: any, prop: string, parsing: boolean) => {
          if (parsing) {
            return 'error';
          }

          return;
        },
      });
    }
  }

  toCreate(): void {
    this.router.navigate(['/create']);
  }

  getColumnHeader() {
    return this.column.map((item: any) => item.header);
  }

  addEvent() {
    this.flex.formatItem.addHandler((s, e) => {
      this.formatFunc(e.panel, e.row, e.col, e.cell);
    });

    // this.flex.

    // this.flex.autoSizedColumn.addHandler((s, e) => {
    //   console.log('auto size');
    //   this.flex.onCopying(e);
    // });

    // this.flex.copying.addHandler((s, e) => {
    //   console.log('run');
    //   console.log(e)
    // });

    // this.flex.invalidInput.addHandler((s, e) => {
    //   console.log(e);
    // });

    // this.flex.autoSizeColumns()

    // console.log(this.flex.columnFooters);

    // this.flex.gotFocus.addHandler((s, e) => {
    //   console.log(e);
    // });

    // this.flex.refreshed.addHandler((s, e) => {
    //   console.log("re")
    // })

    // this.flex.onRefreshed();

    // console.log(this.flex.containsFocus());

    // setTimeout(() => {
    // console.log('refresh');
    // this.flex.refresh();
    // this.flex.dispose();
    // this.flex.isDisabled = false
    // console.log(this.flex.collectionView);
    // console.log('time out');
    // console.log(this.flex.containsFocus());
    // this.flex.beginUpdate();
    // }, 5000);

    // this.flex.keyActionTab = 1

    // this.flex.invalidInput.addHandler((s, e) => {
    //   console.log('run');
    // });

    // this.flex.addEventListener(this.flex.hostElement, 'click', () => {
    //   console.log(this.flex.keyActionTab);
    // });

    // this.flex.groupCollapsedChanged.addHandler((s, e) => {
    //   console.log(e)
    // })

    // this.flex.cellEditEnding.addHandler((s, e) => {
    //   console.log(e)
    //   e.stayInEditMode = true
    // })

    // this.flex.draggingColumnOver.addHandler((s, e) => {
    //   console.log(e)
    // });

    // this.flex.cellEditEnding.addHandler((s, e) => {
    //   console.log(e)
    // });

    // this.flex.prepareCellForEdit.addHandler((s, e) => {
    // console.log(e);
    // });

    // this.flex.startEditing(true, 3, 3, true);
  }

  formatFunc(panel: any, rowRange: number, columnRange: number, cell: any) {
    this.flex.copied.addHandler;
    if (panel.cellType == 1 && !panel.grid.editRange) {
      if (panel.columns[columnRange].binding == 'Price') {
        cell.innerText = this.priceFormat(panel.grid.getCellData(rowRange, columnRange, false), 1);
      }
    }
  }

  priceFormat(price: number, digit: number) {
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let index;

    const priceFormat = [
      {
        value: 1,
        symbol: 'VND',
      },
      {
        value: 1e9,
        symbol: 'T VND',
      },
    ];

    for (index = priceFormat.length - 1; index > 0; index--) {
      if (Math.abs(price) >= priceFormat[index].value) {
        break;
      }
    }
    return index
      ? (Math.abs(price) / priceFormat[index].value).toFixed(digit).replace(rx, '') + priceFormat[index].symbol
      : price.toLocaleString() + priceFormat[index].symbol;
  }

  ngOnInit(): void {
    this.addEvent();
    this.getDataJson();
    this.flex.headersVisibility = wjcGrid.HeadersVisibility.Column;
    // console.log(this.flex.headersVisibility);
    // this.store.dispatch(getEmployee());
    this.store
      .select(selectorEmployee)
      .subscribe(data => {
        const formatData = JSON.parse(JSON.stringify(data.employeeList), (key: string, val: any) => {
          if (typeof val === 'string') {
            let matchDate = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/);
            // console.log(matchDate)
            if (matchDate) {
              return new Date(
                Date.UTC(+matchDate[1], +matchDate[2] - 1, +matchDate[3], +matchDate[4], +matchDate[5], +matchDate[6])
              );
            }

            matchDate = val.match(/^\/Date\((\d+)\)$/);
            if (matchDate) {
              return new Date(parseInt(matchDate[1]));
            }
          }
          return val;
        });

        this.ListEmployee = formatData
      })
      .unsubscribe();
    this.store.dispatch(getEmployee());
    this.paginator();
  }

  ngOnDestroy(): void {
    this.columnSubscrible.unsubscribe();
    this.flex.dispose();
  }
}
