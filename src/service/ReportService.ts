import { Inject, Injectable, inject } from '@angular/core';
import { Core } from '@grapecity/activereports';
import { rowTypeEnum } from 'src/enums/ReportEnum';
import * as wjGrid from '@grapecity/wijmo.grid';
import { constructorReportService } from 'src/types/reportServiceParameter';

@Injectable()
export class ReportService {
  report!: Core.Rdl.Report;
  private count = 1;
  private groupArray: any[] = [];

  constructor(grid: wjGrid.FlexGrid, @Inject('constructParam') constructParam: constructorReportService) {
    this.report = this.createReport(grid, constructParam);
  }

  createReport = (grid: wjGrid.FlexGrid, constructParam: constructorReportService): Core.Rdl.Report => {
    return {
      Name: constructParam.reportName,
      Width: '0in',
      Layers: this.createLayer(constructParam.layers),
      CustomProperties: [
        {
          Name: 'DisplayType',
          Value: 'Page',
        },
        {
          Name: 'SizeType',
          Value: 'Default',
        },
        {
          Name: 'PaperOrientation',
          Value: 'Portrait',
        },
      ],
      Page: this.createPage(constructParam.Page),
      DataSources: this.getDataSource(constructParam.dataSource),
      ReportSections: [
        {
          Name: constructParam.reportSectionName,
          Type: 'Continuous' as 'Continuous',
          Width: constructParam.reportSectionWidth,
          Page: this.createPage(constructParam.Page),
          Body: {
            Height: '1in',
            ReportItems: [
              this.createTable(grid, constructParam.tableName),
              this.createTextBox(
                'Nguời lập',
                { Left: '1.5098in', Top: '1.802in', Width: '1in', Height: '0.25in' },
                {
                  FontWeight: 'Bold',
                  TextAlign: 'Center',
                  VerticalAlign: 'Middle',
                }
              ),
              this.createTextBox(
                '(ký, họ tên)',
                { Left: '1.5132in', Top: '2.0708in', Width: '1in', Height: '0.25in' },
                {
                  FontStyle: 'Italic',
                  TextAlign: 'Center',
                  VerticalAlign: 'Middle',
                }
              ),
              this.createTextBox(
                'Ngày ..... tháng ..... năm .....',
                { Left: '7.9035in', Top: '1.5354in', Width: '2.7146in', Height: '0.25in' },
                {
                  FontStyle: 'Italic',
                  TextAlign: 'Center',
                  VerticalAlign: 'Middle',
                }
              ),
              this.createTextBox(
                'Kế toán trưởng',
                { Left: '8.609in', Top: '1.7917in', Width: '1.2563in', Height: '0.25in' },
                {
                  FontWeight: 'Bold',
                  TextAlign: 'Center',
                  VerticalAlign: 'Middle',
                }
              ),
              this.createTextBox(
                '(Ký, họ tên)',
                { Left: '8.7368in', Top: '2.0799in', Width: '1in', Height: '0.25in' },
                {
                  FontStyle: 'Italic',
                  TextAlign: 'Center',
                  VerticalAlign: 'Middle',
                }
              ),
            ],
          },
          PageHeader: {
            Height: '1.25in',
            ReportItems: [
              this.createTextBox(constructParam.companyName || '', { Width: '5in', Height: '0.25in' }, {}),
              this.createTextBox(constructParam.address || '', { Top: '0.25in', Width: '5in', Height: '0.25in' }, {}),
              this.createTextBox(
                constructParam.title || '',
                { Top: '0.5in', Width: '12in', Height: '0.4042in' },
                { FontSize: '20pt', TextAlign: 'Center', VerticalAlign: 'Center' }
              ),
              this.createTextBox(
                constructParam.subTitle || '',
                { Top: '0.9201in', Width: '12in', Height: '0.25in' },
                { TextAlign: 'Center', VerticalAlign: 'Center' }
              ),
            ],
          },
          PageFooter: {
            ReportItems: [
              this.createTextBox(
                '="Trang " & Globals!PageNumber & " / " & Globals!TotalPages',
                { Width: '1in', Height: '0.25in' },
                {}
              ),
            ],
          },
        },
      ],
      DataSets: [this.getDataSet(constructParam.dataSource.dataSourceName, constructParam.dataSource.data)],
    };
  };

  private createLayer = (layers?: Core.Rdl.Layer[]) => layers || [{ Name: 'default' }];

  private createPage = (page?: Core.Rdl.Page) => ({
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

  private createTable = (grid: wjGrid.FlexGrid, tableName: string) => {
    const header = this.createHeader(grid);
    const columnWidth = this.getHeaderRow(grid.columnHeaders.columns)
      .filter((item: any) => !item?.level)
      .map((item: any) => ({
        Width: `${(item?.width || 99) * 0.0104166667}in`,
      }));

    // this.createFooter(grid);

    const table: Core.Rdl.Table = {
      Type: 'table' as 'table',
      Name: tableName,
      TableColumns: columnWidth,
      Header: header,
      Details: this.createDetail(grid.columns),
      Footer: this.createFooter(grid),
      Width: '0in',
      Height: '0.25in',
    };

    if (grid.collectionView.groups) {
      table.TableGroups = this.createGroup(grid);
    }

    return table;
  };

  private createHeader = (grid: wjGrid.FlexGrid) => {
    const header: any = {
      TableRows: [],
      RepeatOnNewPage: true,
    };

    const computedStyle = getComputedStyle(grid.columnHeaders.getCellElement(0, 0));

    const style = {
      BackgroundColor: computedStyle.getPropertyValue('background-color'),
      FontWeight: computedStyle.getPropertyValue('font-weight') ? 'Bold' : '',
      Color: computedStyle.getPropertyValue('color') || 'Black',
      TextAlign: 'Center',
    };

    const firstRow = this.getHeaderRow(grid.columnHeaders.columns);

    header.TableRows.push({
      Height: '0.25in',
      TableCells: this.createRow(firstRow, rowTypeEnum.header, style),
    });

    const levelList = grid.columns.filter((item: any) => item.level).map((item: any) => item.level);

    const maxlevel = Math.max(...(levelList || 0));

    if (maxlevel) {
      for (let level = 1; level <= maxlevel; level++) {
        const levelList = grid.columns.filter((item: any) => item.level === level);
        const newRow = new Array(header.TableRows[0].TableCells.length).fill(null);

        levelList.forEach((item: any) => {
          newRow.splice(item._rng.col, 1, item);
        });

        header.TableRows.push({
          Height: '0.25in',
          TableCells: this.createRow(newRow, rowTypeEnum.header, style),
        });
      }
    }

    return header;
  };

  private createRow = (column: any[], rowType: string, style?: any) =>
    column.reduce((storage: any, current: any) => {
      if (!current) {
        return [...storage, null];
      }

      const cellStyle = {
        ...style,
        TextAlign: current.align,
      };

      if (current === 'default') {
        return [...storage, this.createCell('', '', cellStyle)];
      }

      if (rowType === rowTypeEnum.detail) {
        if (this.getDataType(current.dataType)?.value === 'boolean') {
          current.type = 'checkbox';
        }

        return [
          ...storage,
          this.createCell(`=Fields!${current.binding}.Value`, current.type || 'textbox', {
            ...cellStyle,
            Format: this.getDataType(current.dataType)?.format || '',
          }),
        ];
      }

      if (current.aggregate && rowType === rowTypeEnum.group) {
        return [
          ...storage,
          this.createCell(`=${this.getAggrateType(current.aggregate)}(Fields!${current.binding}.Value)`, '', cellStyle),
        ];
      }

      const cell = this.createCell(
        current.header || current.binding,
        rowType === rowTypeEnum.header ? 'textbox' : current.type,
        rowType === rowTypeEnum.header ? style : cellStyle,
        current._rng.col2 != current._rng.col ? current._rng.col2 - current._rng.col + 1 : 0,
        current._rng.row2 != current._rng.row ? current._rng.row2 - current._rng.row + 1 : 0
      );

      return [...storage, cell];
    }, []);

  private createCell = (value?: any, type?: string, style?: any, colSpan?: number, rowSpan?: number) => {
    let item: any = {
      Item: {
        Type: type || 'textbox',
        Name: `${type || 'textBox'}${++this.count}`,
        CanGrow: true,
        KeepTogether: true,
        Value: value || '',
        Width: '0in',
        Style: {
          Border: {
            Style: 'Solid',
          },
          PaddingLeft: '2pt',
          PaddingRight: '2pt',
          PaddingTop: '2pt',
          PaddingBottom: '2pt',
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

    if (!item.ColSpan) {
      delete item.ColSpan;
    }

    if (!item.RowSpan) {
      delete item.RowSpan;
    }

    if (!item.Item.Style.Format) {
      delete item.Item.Style.Format;
    }

    return item;
  };

  private getHeaderRow = (columns: wjGrid.ColumnCollection) => {
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

  private getDataSource = (dataSource: any) => [
    {
      Name: dataSource.dataSourceName || 'DataSource',
      ConnectionProperties: {
        DataProvider: 'JSONEMBED',
        ConnectString: 'jsondata=' + JSON.stringify(dataSource.data),
      },
    },
  ];

  private getDataSet = (sourceName: string, data: any, datasetName?: string) => {
    return {
      Name: datasetName || 'dataset',
      Fields: Object.keys(data[0]).map((item: string) => ({ Name: item, DataField: item })),
      Query: {
        DataSourceName: sourceName || 'DataSource',
        CommandText: 'jpath=$.[*]',
      },
    };
  };

  private createGroup = (grid: wjGrid.FlexGrid) => {
    const group = grid.collectionView.groups;
    this.processGroup(group);
    const groupRows: any = [];

    const computedStyle = getComputedStyle(grid.cells.getCellElement(0, 0));

    const style = {
      BackgroundColor: computedStyle.getPropertyValue('background-color'),
      FontWeight: computedStyle.getPropertyValue('font-weight') ? 'Bold' : '',
      Color: computedStyle.getPropertyValue('color') || 'Black',
    };

    this.groupArray.forEach(item => {
      const aggregateRow = this.createAggregate(grid.columns, style);
      aggregateRow[0].Item.Value = `=Fields!${item}.Value`;

      let meetValue = false;

      const mergeRow = aggregateRow.map((item: any, index: number) => {
        if (!item.Item.Value && !meetValue) {
          return null;
        }

        if (index != 0) {
          meetValue = true;
        }

        return item;
      });

      const colSpan = mergeRow.filter((item: any) => item === null).length;

      mergeRow[0].ColSpan = colSpan + 1;
      mergeRow[0].Item.Style = {
        ...mergeRow[0].Item.Style,
        ...style,
      };

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

  private createAggregate = (column: any, style: any) => {
    const aggregateList = column.filter((item: any) => item.aggregate);

    const aggregateRow = column.map((item: any) => {
      const aggregateCell = aggregateList.find((aggregateItem: any) => aggregateItem.header === item.header);

      if (aggregateCell) {
        return aggregateCell;
      }

      return 'default';
    });

    return this.createRow(aggregateRow, rowTypeEnum.group, style);
  };

  private createDetail = (column: any) => {
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
      if (!this.groupArray.includes(item.groupDescription.propertyName)) {
        this.groupArray.push(item.groupDescription.propertyName);
      }

      if (!item.isBottomLevel) {
        this.processGroup(item.groups);
      }
    });
  }

  private getAggrateType(key: number) {
    const agrateType = [
      { key: 1, value: 'Sum' },
      { key: 2, value: 'Count' },
      { key: 3, value: 'Avg' },
    ];

    return agrateType.find(item => item.key === key)?.value;
  }

  private getDataType(key: number) {
    const dataType = [
      { key: 1, value: 'string', format: '' },
      { key: 2, value: 'number', format: 'n0' },
      { key: 3, value: 'boolean', format: '' },
      { key: 4, value: 'date', format: 'd' },
    ];

    return dataType.find(item => item.key === key);
  }

  private createFooter(grid: wjGrid.FlexGrid) {
    const computedStyle = getComputedStyle(grid.columnFooters.getCellElement(0, 0));

    const style = {
      BackgroundColor: computedStyle.getPropertyValue('background-color'),
      FontWeight: computedStyle.getPropertyValue('font-weight') ? 'Bold' : '',
    };
    const aggregateRow = this.createAggregate(grid.columns, style);

    // console.log(aggregateRow[0])

    let meetValue: any;

    grid.columnFooters.columns.forEach((item: any, index) => {
      if (grid.columnFooters.getCellData(0, index, true) && !aggregateRow[index].Item.Value) {
        aggregateRow[index].Item.Value = grid.columnFooters.getCellData(0, index, true);
      }

      if (grid.columnFooters.getCellData(0, index, true) && index != 0) {
        meetValue = true;
      }

      if (!meetValue && index != 0) {
        aggregateRow[index] = null;
      }

      if (!meetValue) {
        aggregateRow[0].ColSpan = index + 1;
      }
    });

    // console.log(grid.columnFooters.getCellData(0, 0, true));

    return {
      TableRows: [
        {
          Height: '0.25in',
          TableCells: aggregateRow,
        },
      ],
    };
  }

  private createTextBox(value: string, option: any, style: any) {
    return {
      Type: 'textbox',
      Name: `TextBox${++this.count}`,
      CanGrow: true,
      KeepTogether: true,
      Value: value,
      Style: {
        PaddingLeft: '2pt',
        PaddingRight: '2pt',
        PaddingTop: '2pt',
        PaddingBottom: '2pt',
        ...style,
      },
      ...option,
    };
  }
}
