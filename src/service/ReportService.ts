import { Inject, Injectable, inject } from '@angular/core';
import { Core } from '@grapecity/activereports';
import { rowTypeEnum } from 'src/enums/ReportEnum';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjCore from '@grapecity/wijmo';
import { constructorReportService } from 'src/types/reportServiceParameter';

@Injectable()
export class ReportService {
  report!: Core.Rdl.Report;
  private count = 1;
  private groupArray: any[] = [];

  constructor(grid: wjGrid.FlexGrid, @Inject('constructParam') constructParam: constructorReportService) {
    this.report = this.createReport(grid, constructParam);
    console.log(grid.collectionView.groups);
  }

  createReport = (grid: wjGrid.FlexGrid, constructParam: constructorReportService) => {
    return {
      Name: constructParam.reportName,
      Width: '0in',
      Layers: this.createLayer(constructParam.layers),
      // CustomProperties: ,
      Page: this.createPage(constructParam.Page),
      DataSources: this.getDataSource(constructParam.dataSource),
      ReportSections: [
        {
          Name: constructParam.reportSectionName,
          Type: 'Continuous' as 'Continuous',
          Page: this.createPage(constructParam.Page),
          Body: {
            Height: '1in',
            ReportItems: [this.createTable(grid, constructParam.tableName)],
          },
          PageHeader: {},
          PageFooter: {},
        },
      ],
      DataSets: [this.getDataSet(constructParam.dataSource.dataSourceName, constructParam.dataSource.data)],
    };
  };

  createLayer = (layers?: Core.Rdl.Layer[]) => layers || [{ Name: 'default' }];

  createPage = (page?: Core.Rdl.Page) => ({
    PageWidth: '8.5in',
    PageHeight: '11in',
    RightMargin: '1in',
    LeftMargin: '1in',
    TopMargin: '1in',
    BottomMargin: '1in',
    Columns: 1,
    ColumnSpacing: '0in',
    ...page,
  });

  createTable = (grid: wjGrid.FlexGrid, tableName: string) => {
    const header = this.createHeader(grid);
    const columnWidth = this.getHeaderRow(grid.columnHeaders.columns)
      .filter((item: any) => !item?.level)
      .map((item: any) => ({
        Width: `${(item?.width || 99) * 0.0104166667}in`,
      }));

    // this.createGroup(grid, header.TableRows);

    // console.log(this.createGroup(grid));

    return {
      Type: 'table' as 'table',
      Name: tableName,
      TableColumns: columnWidth,
      Header: header,
      TableGroups: this.createGroup(grid),
      Details: this.createDetail(grid.columns),
      Top: '0in',
      Height: '0.25in',
    };
  };

  createHeader = (grid: wjGrid.FlexGrid) => {
    const header: any = {
      TableRows: [],
      RepeatOnNewPage: true,
    };

    const firstRow = this.getHeaderRow(grid.columnHeaders.columns);

    header.TableRows.push({
      Height: '0.25in',
      TableCells: this.createRow(firstRow, rowTypeEnum.header),
    });

    const levelList = grid.columns.filter((item: any) => item.level).map((item: any) => item.level);

    const maxlevel = Math.max(...(levelList || 0));

    if (maxlevel) {
      let preLevelRow = firstRow;
      for (let level = 1; level <= maxlevel; level++) {
        const levelList = grid.columns.filter((item: any) => item.level === level);
        const newRow = new Array(header.TableRows[0].TableCells.length).fill(null);

        levelList.forEach((item: any) => {
          newRow.splice(item._rng.col, 1, item);
        });

        header.TableRows.push({
          Height: '0.25in',
          TableCells: this.createRow(newRow, rowTypeEnum.header),
        });

        preLevelRow = newRow;
      }
    }

    return header;
  };

  createRow = (column: any[], rowType: string, style?: any) =>
    column.reduce((storage: any, current: any) => {
      if (current === 'default') {
        return [...storage, this.createCell()];
      }

      if (rowType === rowTypeEnum.detail) {
        if (current.binding === 'Quantity') {
          return [...storage, this.createCell(`=Fields!${current.binding}.Value`, current.type || 'textbox', style)];
        }

        return [
          ...storage,
          this.createCell(`=Fields!${current.binding}.Value`, current.type || 'textbox', {
            ...style,
            Format: current.format || 'n0',
          }),
        ];
      }

      if (!current) {
        return [...storage, null];
      }

      if (current.aggregate && rowType === rowTypeEnum.group) {
        console.log(current);
        return [
          ...storage,
          this.createCell(`=${this.getAggrateType(current.aggregate)}(Fields!${current.binding}.Value)`),
        ];
      }

      // console.log(current);

      const cell = this.createCell(
        current.header || current.binding,
        rowType === rowTypeEnum.header ? 'textbox' : current.type,
        style,
        current._rng.col2 - current._rng.col + 1,
        current._rng.row2 - current._rng.row + 1
      );

      return [...storage, cell];
    }, []);

  createCell = (value?: any, type?: string, style?: any, colSpan?: number, rowSpan?: number) => {
    let item: any = {
      Item: {
        Type: type || 'textbox',
        Name: `${type || 'textBox'}${++this.count}`,
        CanGrow: true,
        KeepTogether: true,
        Value: value || '',
        Style: {
          Border: {
            Style: 'Solid',
          },
          PaddingLeft: '2pt',
          PaddingRight: '2pt',
          PaddingTop: '2pt',
          PaddingBottom: '2pt',
          TextAlign: 'Center',
          VerticalAlign: 'Middle',
          Format: 'n0',
          ...style,
        },
        Height: '0.25in',
      },
      ColSpan: colSpan || 0,
      RowSpan: rowSpan || 0,
    };

    if (type === 'checkbox') {
      item.Item.CheckAlignment = 'MiddleCenter';
      item.Item.Checked = value.toString().charAt(0).toUpperCase() + value.toString().slice(1);
      delete item.Item.Value;
    }

    return item;
  };

  getHeaderRow = (columns: wjGrid.ColumnCollection) => {
    // const firstRowArray = new Array(columns.length).fill(null)
    const firstRow = columns.map((item: any) => {
      if (item.level) {
        return item.parentGroup;
      }

      return item;
    });

    let prevHeader: string;

    return firstRow.map((item: any) => {
      if (prevHeader === item.header) {
        return null;
      }
      prevHeader = item.header;
      return item;
    });
  };

  getDataSource = (dataSource: any) => [
    {
      Name: dataSource.dataSourceName || 'DataSource',
      ConnectionProperties: {
        DataProvider: 'JSONEMBED',
        ConnectString: 'jsondata=' + JSON.stringify(dataSource.data),
      },
    },
  ];

  getDataSet = (sourceName: string, data: any, datasetName?: string) => {
    return {
      Name: datasetName || 'dataset',
      Fields: Object.keys(data[0]).map((item: string) => ({ Name: item, DataField: item })),
      Query: {
        DataSourceName: sourceName,
        CommandText: 'jpath=$.[*]',
      },
    };
  };

  createGroup = (grid: wjGrid.FlexGrid) => {
    const group = grid.collectionView.groups;
    this.processGroup(group);
    const groupRows: any = [];

    this.groupArray.forEach(item => {
      const aggregateRow = this.createAggregate(grid.columns);

      aggregateRow[0].Item.Value = `=Fields!${item}.Value`;

      const mergeRow = aggregateRow.map((item: any) => {
        if (!item.Item.Value) {
          return null;
        }

        return item;
      });

      const colSpan = mergeRow.filter((item: any) => item === null).length;

      mergeRow[0].ColSpan = colSpan + 1;

      groupRows.push({
        Group: {
          Name: item,
          GroupExpressions: [`=Fields!${item}.Value`],
        },
        Header: {
          TableRows: [
            {
              Height: '0.25in',
              TableCells: mergeRow,
            },
          ],
        },
      });
    });

    return groupRows;
  };

  createAggregate = (column: any) => {
    const aggregateList = column.filter((item: any) => item.aggregate);

    const aggregateRow = column.map((item: any) => {
      const aggregateCell = aggregateList.find((aggregateItem: any) => aggregateItem.header === item.header);

      if (aggregateCell) {
        return aggregateCell;
      }

      return 'default';
    });

    console.log(aggregateRow);

    return this.createRow(aggregateRow, rowTypeEnum.group);
  };

  // getBindingList = (header: any) => {
  //   const bindingList: any[] = [];

  //   for (let index = header.length - 1; index >= 0; index--) {
  //     if (!bindingList.length) {
  //       bindingList.push(...header[index].TableCells);
  //     }

  //     header[index].TableCells.forEach((item: any, cellIndex: number) => {
  //       if (!bindingList[cellIndex] || bindingList[cellIndex].group) {
  //         bindingList.splice(cellIndex, 1, item);
  //       }
  //     });
  //   }

  //   return bindingList;
  // };

  createDetail = (column: any) => {
    const detailRow = this.createRow(column, rowTypeEnum.detail);

    return {
      TableRows: [
        {
          Height: '0.25in',
          TableCells: detailRow,
        },
      ],
    };
  };

  private processGroup(group: any[]) {
    group.forEach((item: any) => {
      // console.log(!!this.groupArray.indexOf(item.groupDescription.propertyName))
      if (!this.groupArray.includes(item.groupDescription.propertyName)) {
        this.groupArray.push(item.groupDescription.propertyName);
      }

      if (!item.isBottomLevel) {
        this.processGroup(item.groups);
      }
    });
  }

  getAggrateType(key: number) {
    const agrateType = [
      { key: 1, value: 'Sum' },
      { key: 2, value: 'Count' },
      { key: 3, value: 'Avg' },
    ];

    return agrateType.find(item => item.key === key)?.value;
  }
}
