import { Inject, Injectable, inject } from '@angular/core';
import { Core, PdfExport } from '@grapecity/activereports';
import { rowTypeEnum } from 'src/enums/ReportEnum';
import * as wjGrid from '@grapecity/wijmo.grid';
import { constructorReportService } from 'src/types/reportServiceParameter';
import { ruleComparator } from 'src/enums/RulesEnum';

@Injectable()
export class ReportService {
  report!: Core.Rdl.Report;
  private count = 1;
  private rule;
  private groupArray: any[] = [];

  constructor(grid: wjGrid.FlexGrid, @Inject('constructParam') constructParam: constructorReportService) {
    this.rule = constructParam.rules;
    this.report = this.createReport(grid, constructParam);
  }

  createReport = (grid: wjGrid.FlexGrid, constructParam: constructorReportService): Core.Rdl.Report => {
    return {
      Name: constructParam.reportName,
      Width: '0in',
      Layers: this.createLayer(constructParam.layers),
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
              this.createTextBox(constructParam.companyName || '', { Width: '5in', Height: '0.25in' }, {}),
              this.createTextBox(constructParam.address || '', { Top: '0.25in', Width: '5in', Height: '0.25in' }, {}),
              this.createTextBox(
                constructParam.title || '',
                { Top: '0.5in', Width: '12in', Height: '0.4598in' },
                { FontSize: '20pt', TextAlign: 'Center', VerticalAlign: 'Center' }
              ),
              this.createTextBox(
                constructParam.subTitle || '',
                { Top: '0.9757in', Width: '12in', Height: '0.25in' },
                { TextAlign: 'Center', VerticalAlign: 'Center', FontStyle: 'Italic' }
              ),
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
          PageFooter: {
            ReportItems: [
              this.createTextBox(
                '="Trang " & Globals!PageNumber & " / " & Globals!TotalPages',
                {
                  Width: '1in',
                  Height: '0.25in',
                  Visibility: { Hidden: '=iif(Globals!PageNumber <= 2, "true", "false")' },
                },
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

    const table: Core.Rdl.Table = {
      Type: 'table' as 'table',
      Name: tableName,
      TableColumns: columnWidth,
      Header: header,
      Details: this.createDetail(grid),
      Footer: this.createFooter(grid),
      Width: '0in',
      Top: '1.25in',
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
      FontWeight: this.getFontWeight(+computedStyle.getPropertyValue('font-weight') as number),
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

  private createRow = (column: any[], rowType: string, style?: any, rule?: any) =>
    column.reduce((storage: any, current: any) => {
      if (!current) {
        return [...storage, null];
      }

      const cellStyle = {
        ...style,
        TextAlign: current.align,
      };

      if (current === 'default') {
        return [...storage, this.createCell({}, cellStyle)];
      }

      if (rowType === rowTypeEnum.detail) {
        let value = `=Fields!${current.binding}.Value`;
        let ruleStyle = { ...cellStyle };

        const matchRuleItem = rule.find((item: any) => item.key === current.binding);

        if (matchRuleItem) {
          if (matchRuleItem.value !== undefined) {
            value = `=iif(Fields.${current.binding}.Value ${
              ruleComparator[matchRuleItem.operation as keyof typeof ruleComparator]
            } ${matchRuleItem.compareValue}, ${matchRuleItem.value}, Fields.${current.binding}.Value )`;
          }

          if (matchRuleItem.style) {
            ruleStyle = {
              ...ruleStyle,
              ...Object.keys(matchRuleItem.style).reduce((storageStyle: any, currentStyle: any) => {
                if (currentStyle !== 'BackgroundColor') {
                  return {
                    ...storageStyle,
                    [currentStyle]: `=iif(Fields!${current.binding}.Value ${
                      ruleComparator[matchRuleItem.operation as keyof typeof ruleComparator]
                    } ${matchRuleItem.compareValue}, "${matchRuleItem.styleValue}", "")`,
                  };
                } else {
                  return {
                    ...storageStyle,
                    BackgroundColor: `=iif(Fields!${current.binding}.Value ${
                      ruleComparator[matchRuleItem.operation as keyof typeof ruleComparator]
                    } ${matchRuleItem.compareValue}, "${matchRuleItem.styleValue}", ${cellStyle.BackgroundColor.replace(
                      '=',
                      ''
                    )})`,
                  };
                }
              }, {}),
            };
          }
        }

        if (this.getDataType(current.dataType)?.value === 'boolean') {
          current.type = 'checkbox';
        }

        return [
          ...storage,
          this.createCell(
            {
              Value: value,
              Type: current.type || 'textbox',
              Name: `${current.type || 'textbox'}${++this.count}`,
            },
            {
              ...ruleStyle,
              Format: this.getDataType(current.dataType)?.format || '',
            }
          ),
        ];
      }

      if (current.aggregate && rowType === rowTypeEnum.group) {
        return [
          ...storage,
          this.createCell(
            { Value: `=${this.getAggrateType(current.aggregate)}(Fields!${current.binding}.Value)` },
            cellStyle
          ),
        ];
      }

      const cell = this.createCell(
        {
          Value: current.header || current.binding,
          Type: rowType === rowTypeEnum.header ? 'textbox' : current.type,
          Name: `${rowType === rowTypeEnum.header ? 'textbox' : current.type}${++this.count}`,
        },
        rowType === rowTypeEnum.header ? style : cellStyle,
        current._rng.col2 != current._rng.col ? current._rng.col2 - current._rng.col + 1 : 0,
        current._rng.row2 != current._rng.row ? current._rng.row2 - current._rng.row + 1 : 0
      );

      return [...storage, cell];
    }, []);

  private createCell = (option: any, style?: any, colSpan?: number, rowSpan?: number) => {
    let item: any = {
      Item: {
        Type: 'textbox',
        Name: `${'textBox'}${++this.count}`,
        CanGrow: true,
        CanShrink: true,
        KeepTogether: true,
        Value: '',
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
        ...option,
      },
      ColSpan: colSpan || 0,
      RowSpan: rowSpan || 0,
    };

    if (option?.Type === 'checkbox') {
      item.Item.CheckAlignment = 'MiddleCenter';
      item.Item.Checked = option?.Value.toString().charAt(0).toUpperCase() + option?.Value.toString().slice(1);
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
      FontWeight: this.getFontWeight(+computedStyle.getPropertyValue('font-weight') as number),
      Color: computedStyle.getPropertyValue('color') || 'Black',
    };

    this.groupArray.forEach((groupItem, groupIndex) => {
      const aggregateRow = this.createAggregate(grid.columns, style);
      aggregateRow[0].Item.Value = `=Fields!${groupItem}.Value`;

      const mergeRow = aggregateRow.map((item: any, index: number) => {
        const mergeRange = grid.getMergedRange(grid.cells, groupIndex, index);
        if (mergeRange?.columnSpan) {
          item.ColSpan = mergeRange.columnSpan;
        }
        if (index > mergeRange?.col) {
          return null;
        }

        return item;
      });

      groupRows.push({
        Group: {
          Name: groupItem,
          GroupExpressions: [`=Fields!${groupItem}.Value`],
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

  private createDetail = (grid: wjGrid.FlexGrid) => {
    const group = grid.collectionView.groups;
    this.processGroup(group);

    const rowStep = grid.alternatingRowStep;

    const altCell = grid.cells.rows.find(
      (item, index) =>
        grid.cells.getCellElement(index, 0)?.classList.contains('wj-alt') && !(item instanceof wjGrid.GroupRow)
    );

    const altRowBackground = getComputedStyle(
      grid.cells.getCellElement(altCell?.index || this.groupArray.length || 0, 0)
    ).backgroundColor;

    const style = {
      BackgroundColor: `=iif(RowNumber() Mod ${rowStep + 1} = 0, "${altRowBackground}", "" )`,
    };

    const detailRow = this.createRow(grid.columns, rowTypeEnum.detail, style, this.getRules());

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
    this.groupArray = [];
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
      FontWeight: this.getFontWeight(+computedStyle.getPropertyValue('font-weight') as number),
    };

    const aggregateRow = this.createAggregate(grid.columns, style);

    grid.columnFooters.columns.forEach((item: any, index) => {
      const mergeRange = grid.getMergedRange(grid.columnFooters, 0, index);

      if (mergeRange.col < index) {
        aggregateRow[index] = null;
      }

      if (aggregateRow[index] && mergeRange.columnSpan) {
        aggregateRow[index].ColSpan = mergeRange.columnSpan;
      }

      if (grid.columnFooters.getCellData(0, index, true) && !aggregateRow[index].Item.Value) {
        aggregateRow[index].Item.Value = grid.columnFooters.getCellData(0, index, true);
      }
    });

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

  async export() {
    const report = new Core.PageReport();
    await report.load(this.report);
    const doc = await report.run();
    const result = await PdfExport.exportDocument(doc, {
      fonts: [
        {
          name: 'Arial',
          source: '../assets/SVN-Arial/SVN-Arial 3.ttf',
        },
      ],
      pdfVersion: '1.4',
    });
    return result.data;
  }

  private getFontWeight(weight: number) {
    const fontWeight = [
      { weight: 100, style: 'Lighter' },
      { weight: 400, style: 'Normal' },
      { weight: 700, style: 'Bold' },
    ];

    return fontWeight.find(item => item.weight === weight)?.style || 'Normal';
  }

  private getRules() {
    return this.rule.map((item: any) => {
      const newItem: any = {
        key: item.key,
        operation: item.operation,
        compareValue: item.compareValue,
        styleValue: item.value,
      };
      const keyStyle = item.property
        .replace('style.', '')
        .replace(/-([a-z])/g, (match: any, group: any) => group.toUpperCase())
        .replace(/^([a-z])/, (match: any, group: any) => group.toUpperCase());

      if (keyStyle.toLowerCase() === 'innerhtml' || keyStyle.toLowerCase() === 'innertext') {
        newItem.value = item.value;
        return newItem;
      }

      if (keyStyle) {
        newItem.style = {
          [keyStyle]: item.value,
        };
      }

      return newItem;
    });
  }
}
