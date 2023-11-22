import { Inject, Injectable, inject } from '@angular/core';
import { Core } from '@grapecity/activereports';
import { aggregateEnum, rowTypeEnum } from 'src/enums/ReportEnum';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjCore from '@grapecity/wijmo';
import { constructorReportService } from 'src/types/reportServiceParameter';

@Injectable()
export class ReportService {
  report!: Core.Rdl.Report;
  private count = 1;

  constructor(grid: wjGrid.FlexGrid, @Inject('constructParam') constructParam: constructorReportService) {
    this.report = this.createReport(grid, constructParam);
  }

  createReport = (grid: wjGrid.FlexGrid, constructParam: constructorReportService) => {
    const column = grid.columns;

    return {
      Name: constructParam.reportName || 'Report',
      Width: '0in',
      Layers: this.createLayer(constructParam.layers),
      // CustomProperties: ,
      Page: this.createPage(constructParam.Page),
      DataSources: this.getDataSource(constructParam.dataSource),
      ReportSections: [
        {
          Name: 'section',
          Type: 'Continuous' as 'Continuous',
          Page: this.createPage(constructParam.Page),
          Body: {
            Height: '1in',
            ReportItems: [],
          },
          PageHeader: {},
          PageFooter: {},
        },
      ],
      // DataSets: ,
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

  createTable = (column: any) => {
    const header = this.createHeader(column);
    const columnWidth = this.getHeaderRow(column.columns)
      .filter((item: any) => !item?.level)
      .map((item: any) => ({
        Width: `${(item?.width || 99) * 0.0104166667}in`,
      }));

    return {
      Type: 'table',
      Name: column.report.reportTable.name,
      TableColumns: columnWidth,
      Header: header,
      TableGroups: this.createGroup(column, header.TableRows),
      Details: this.createDetail(column, header.TableRows),
      Top: '0in',
      Height: '0.25in',
    };
  };

  createHeader = (column: any) => {
    const header: any = {
      TableRows: [],
      RepeatOnNewPage: true,
    };

    const firstRow = this.getHeaderRow(column.columns);

    header.TableRows.push({
      Height: '0.25in',
      TableCells: this.createRow(firstRow, rowTypeEnum.header),
    });

    const levelList = column.columns.filter((item: any) => item.level).map((item: any) => item.level);

    const maxlevel = Math.max(...(levelList || 0));

    if (maxlevel) {
      let preLevelRow = firstRow;
      for (let level = 1; level <= maxlevel; level++) {
        const levelList = column.columns.filter((item: any) => item.level && item.level === level);
        const parentIndexList = preLevelRow.reduce((storage: any, current: any, index: number) => {
          if (current && current.group && levelList.find((levelItem: any) => levelItem.parent === current.group)) {
            return [
              ...storage,
              {
                parent: current.group,
                index: index,
                level,
              },
            ];
          }

          return storage;
        }, []);

        const newRow = new Array(header.TableRows[0].TableCells.length).fill(null);

        parentIndexList.forEach((item: any) => {
          const startItem = levelList.filter((levelItem: any) => item.parent === levelItem.parent);

          newRow.splice(item.index, startItem.length, ...startItem);
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
          return [
            ...storage,
            this.createCell(`=Fields!${current.binding}.Value * 1000`, current.type || 'textbox', style),
          ];
        }

        return [
          ...storage,
          this.createCell(`=Fields!${current.binding}.Value`, current.type || 'textbox', {
            ...style,
            Format: current.date ? 'd' : 'n0',
          }),
        ];
      }

      if (!current) {
        return [...storage, null];
      }

      if (current.aggregate && rowType === rowTypeEnum.group) {
        return [
          ...storage,
          this.createCell(
            `=${aggregateEnum[current.aggregate as keyof typeof aggregateEnum]}(Fields!${current.binding}.Value)`
          ),
        ];
      }

      const cell = this.createCell(
        current.header || current.binding,
        rowType === rowTypeEnum.header ? 'textbox' : current.type,
        style,
        current.colSpan,
        current.rowSpan
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

  getHeaderRow = (columns: any) => {
    const firstRowArray = columns.filter((item: any) => !item.level);

    const firstRow: any = [];

    firstRowArray.map((item: any) => {
      if (item.colSpan) {
        firstRow.push(...[item].concat(new Array(item.colSpan - 1).fill(null)));
        return;
      }
      firstRow.push(item);
    });

    return firstRow;
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

  getDataSet = async (sourceName: any, data: any) => {
    const dataSource = sourceName.map((nameItem: any) =>
      data.map((dataItem: any) => {
        const template = dataItem.datasets.find((templateItem: any) => {
          return templateItem.id === nameItem.dataSetName;
        });

        if (dataItem.id === nameItem.dataSourceName && template) {
          delete template.template.Filters;
          return {
            ...template.template,
            CaseSensitivity: 'Auto',
            KanatypeSensitivity: 'Auto',
            AccentSensitivity: 'Auto',
            WidthSensitivity: 'Auto',
          };
        }

        return null;
      })
    );

    return dataSource.flat(1).filter((item: any) => item);
  };

  createGroup = (column: any, header: any) => {
    const groupRow: any = [
      {
        Group: {
          Name: 'tableGroup',
          GroupExpressions: [],
        },
        Header: {
          TableRows: [
            {
              Height: '0.25in',
              TableCells: [],
            },
          ],
        },
      },
    ];

    const aggregateRow = this.createAggregate(column, header);

    column.collumnGroup.forEach((item: string, index: number) => {
      aggregateRow[index + 1].Item.Value = `=Fields!${item}.Value`;
      groupRow[0].Group.GroupExpressions.push(`=Fields!${item}.Value`);
    });

    groupRow[0].Header.TableRows[0].TableCells.push(...aggregateRow);

    return groupRow;
  };

  createAggregate = (column: any, header: any) => {
    const aggregateList = column.columns.filter((item: any) => item.aggregate);

    const aggregateRow = this.getBindingList(header).map((item: any) => {
      const aggregateCell = aggregateList.find((aggregateItem: any) => aggregateItem.header === item.Item.Value);

      if (aggregateCell) {
        return aggregateCell;
      }

      return 'default';
    });

    return this.createRow(aggregateRow, rowTypeEnum.group);
  };

  getBindingList = (header: any) => {
    const bindingList: any[] = [];

    for (let index = header.length - 1; index >= 0; index--) {
      if (!bindingList.length) {
        bindingList.push(...header[index].TableCells);
      }

      header[index].TableCells.forEach((item: any, cellIndex: number) => {
        if (!bindingList[cellIndex] || bindingList[cellIndex].group) {
          bindingList.splice(cellIndex, 1, item);
        }
      });
    }

    return bindingList;
  };

  createDetail = (column: any, header: any) => {
    const bindingList = this.getBindingList(header);

    // console.log(bindingList);

    const bindingColumn = bindingList.map((item: any) =>
      column.columns.find(
        (columnItem: any) => columnItem.header === item.Item.Value || columnItem.binding === item.Item.Value
      )
    );

    const detailRow = this.createRow(bindingColumn, rowTypeEnum.detail);

    return {
      TableRows: [
        {
          Height: '0.25in',
          TableCells: detailRow,
        },
      ],
    };
  };
}
