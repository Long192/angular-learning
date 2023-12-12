import { columnJson } from './../types/reportServiceParameter';
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
  private columnFromJson;
  private groupArray: any[] = [];
  private style;
  private group;

  constructor(grid: wjGrid.FlexGrid, @Inject('constructParam') constructParam: constructorReportService) {
    this.group = constructParam.group;
    this.rule = constructParam.rules;
    this.columnFromJson = constructParam.columnJson;
    this.style = constructParam.style;
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
              this.createTable(grid, constructParam.tableName, constructParam.renderFromColumnJson),
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

  private createTable = (grid: wjGrid.FlexGrid, tableName: string, createFromColumnJson: boolean) => {
    const header = this.createHeader(createFromColumnJson ? this.columnFromJson : grid);
    const columnWidth = this.getHeaderRow(createFromColumnJson ? this.columnFromJson : grid.columnHeaders.columns)
      .filter((item: any) => !item?.level && !item?.group)
      .map((item: any) => ({
        Width: `${(item?.width || 99) * 0.0104166667}in`,
      }));

    const table: Core.Rdl.Table = {
      Type: 'table' as 'table',
      Name: tableName,
      TableColumns: columnWidth,
      Header: header,
      Details: this.createDetail(createFromColumnJson ? undefined : grid),
      Footer: createFromColumnJson ? this.createFotterFromColumnJson() : this.createFooter(grid),
      Width: '0in',
      Top: '1.25in',
      Height: '0.25in',
    };

    if (grid?.collectionView.groups && !createFromColumnJson) {
      table.TableGroups = this.createGroup(grid);
    }

    if (Array.isArray(this.group) && this.group.length && createFromColumnJson) {
      table.TableGroups = this.craeteGroupFromColumnJson(this.columnFromJson);
    }

    console.log(table);

    return table;
  };

  private createHeader = (grid: wjGrid.FlexGrid | columnJson[]) => {
    let levelList: number[], firstRow: any, style: any;
    const header: any = {
      TableRows: [],
      RepeatOnNewPage: true,
    };

    if (grid instanceof wjGrid.FlexGrid) {
      firstRow = this.getHeaderRow(grid.columnHeaders.columns);
      levelList = grid.columns.filter((item: any) => item.level).map((item: any) => item.level);
      const computedStyle = getComputedStyle(grid.columnHeaders.getCellElement(0, 0));
      style = {
        BackgroundColor: computedStyle.getPropertyValue('background-color'),
        FontWeight: this.getFontWeight(+computedStyle.getPropertyValue('font-weight') as number),
        Color: computedStyle.getPropertyValue('color') || 'Black',
        TextAlign: computedStyle.getPropertyValue('text-align'),
      };
    } else {
      firstRow = this.getHeaderFromJsonColumn(this.columnFromJson);
      levelList = grid.filter(item => item.level).map((item: any) => item.level);
      style = this.getStyleByColumnJson(this.style.dynamix.header);
    }

    const maxlevel = Math.max(...(Array.isArray(levelList) && levelList.length ? levelList : [0]));

    if (maxlevel && !(grid instanceof wjGrid.FlexGrid)) {
      firstRow = firstRow.map((item: any) => {
        if (item && !item.group) {
          item.rowSpan = grid instanceof wjGrid.FlexGrid ? maxlevel : maxlevel + 1;
        }

        return item;
      });
    }

    header.TableRows.push({
      Height: '0.25in',
      TableCells: this.createRow(firstRow, rowTypeEnum.header, style),
    });

    let preRow = firstRow;

    if (maxlevel) {
      for (let level = 1; level <= maxlevel; level++) {
        const columnLevelList =
          grid instanceof wjGrid.FlexGrid
            ? grid.columns.filter((item: any) => item.level === level)
            : grid.filter((item: any) => item.level === level);
        let newRow = new Array(header.TableRows[0].TableCells.length).fill(null);

        columnLevelList.forEach((item: any, index: number) => {
          if (grid instanceof wjGrid.FlexGrid) {
            newRow.splice(item._rng.col, 1, item);
          } else {
            const colIndex = preRow.findIndex(
              (IndexItem: any) => IndexItem && IndexItem.group && item.parent === IndexItem.group
            );

            newRow.splice(colIndex + index, 1, item);

            if (level < maxlevel) {
              newRow = newRow.map(item => {
                if (item) {
                  item.rowSpan = maxlevel - level;
                }

                return item;
              });
            }
          }
        });

        preRow = newRow;

        header.TableRows.push({
          Height: '0.25in',
          TableCells: this.createRow(newRow, rowTypeEnum.header, style),
        });
      }
    }

    return header;
  };

  private getStyleByColumnJson(styleArray: any) {
    const style = styleArray.reduce((storage: any, current: any) => {
      if (current.reportProperty) {
        switch (current.reportProperty) {
          case 'Padding':
            console.log(current);
            const paddingArray = current.value.split('px ');
            return {
              ...storage,
              PaddingTop: `${paddingArray[0] * 0.75}pt`,
              PaddingLeft: `${paddingArray[1] * 0.75}pt`,
              PaddingBottom: `${paddingArray[2] * 0.75}pt`,
              paddingLeft: `${paddingArray[3] * 0.75}pt`,
            };

          default:
            return {
              ...storage,
              [current.reportProperty]: current.value.includes('px')
                ? `${current.value.replace('px', '') * 0.75}pt`
                : current.value,
            };
        }
      }

      return storage;
    }, {});
    return style;
  }

  private createRow = (column: any[], rowType: string, style?: any, rule?: any) =>
    column.reduce((storage: any, current: any) => {
      style = {
        ...style,
        ...this.getStyleByColumnJson(this.style.dynamix.cell),
      };

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
            value = `=iif(Fields!${current.binding}.Value ${
              ruleComparator[matchRuleItem.operation as keyof typeof ruleComparator]
            } ${matchRuleItem.compareValue}, "${matchRuleItem.value}", Fields!${current.binding}.Value )`;
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
              ...this.getDetailStyle(current),
              Format: current.format || this.getDataType(current.dataType)?.format || '',
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

      let colSpan: number, rowSpan: number;

      if (!current._rng) {
        colSpan = current.colSpan;
        rowSpan = current.rowSpan;
      } else {
        colSpan = current._rng.col2 != current._rng.col ? current._rng.col2 - current._rng.col + 1 : 0;
        rowSpan = current._rng.row2 != current._rng.row ? current._rng.row2 - current._rng.row + 1 : 0;
      }

      const cell = this.createCell(
        {
          Value: current.header || current.binding,
          Type: rowType === rowTypeEnum.header ? 'textbox' : current.type,
          Name: `${rowType === rowTypeEnum.header ? 'textbox' : current.type}${++this.count}`,
        },
        rowType === rowTypeEnum.header ? style : cellStyle,
        colSpan,
        rowSpan
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

  private getHeaderRow = (columns: wjGrid.ColumnCollection | columnJson[]) => {
    const firstRow = columns.map((item: any) => {
      if (item.level) {
        return item.parentGroup || null;
      }

      return item;
    });

    let prevHeader: string;

    return firstRow.map((item: any) => {
      if (prevHeader === item?.header || prevHeader === item?.binding) {
        return null;
      }
      prevHeader = item?.header || item?.binding;
      return item;
    });
  };

  private getHeaderFromJsonColumn(columns: columnJson[]) {
    return columns
      .filter(item => !item.level)
      .reduce((storage: any, current: any) => {
        if (current.colSpan) {
          return [...storage, ...[current].concat(new Array(current.colSpan - 1).fill(null))];
        }

        return [...storage, current];
      }, []);
  }

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

    const style = this.getStyleByColumnJson(this.style.dynamix.group);

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

  private craeteGroupFromColumnJson(column: columnJson[]) {
    const groupRows: any[] = [];

    this.group.forEach((item: any) => {
      const aggregateRow = this.createAggregate(
        this.getBindingList(),
        this.getStyleByColumnJson(this.style.dynamix.group)
      );
      aggregateRow[0].Item.Value = `=Fields!${item}.Value`;

      let prevCell: number = 0;

      aggregateRow.forEach((item: any, index: number) => {
        if (item.Item.Value) {
          prevCell = index;
          return;
        }

        aggregateRow[prevCell].ColSpan ? aggregateRow[prevCell].ColSpan++ : (aggregateRow[prevCell].ColSpan = 2);
        aggregateRow[index] = null;
      });
      groupRows.push({
        Group: {
          Name: item,
          GroupExpressions: [`=Fields!${item}.Value`],
        },
        Header: {
          TableRows: [
            {
              Height: '0.25in',
              TableCells: aggregateRow,
            },
          ],
        },
      });
    });

    return groupRows;
  }

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

  private createDetail = (grid?: wjGrid.FlexGrid) => {
    let detailRow;
    if (grid) {
      detailRow = this.createRow(grid.columns, rowTypeEnum.detail, {}, this.getRules());
    } else {
      detailRow = this.createRow(this.getBindingList(), rowTypeEnum.detail, {}, this.getRules());
    }

    return {
      TableRows: [
        {
          Height: '0.25in',
          TableCells: detailRow,
        },
      ],
    };
  };

  private getBindingList() {
    let bindingList: any = this.columnFromJson.filter((item: any) => !item.level);

    const levelList = this.columnFromJson.filter((item: any) => item.level);

    let maxLevel = Math.max(...(levelList.map((item: any) => item.level) || 0));

    for (maxLevel; maxLevel > 0; maxLevel--) {
      bindingList.forEach((item: any, index: number) => {
        if (item.group) {
          const itemList = levelList.filter(
            (levelItem: any) => levelItem.level === maxLevel && item.group === levelItem.parent
          );
          bindingList.splice(index, 1, ...itemList);
        }
      });
    }

    return bindingList;
  }

  private getDetailStyle(column: any) {
    const ruleStyle = this.getRules().find((item: any) => item.key === column.binding);
    let style: any = {};

    style = this.style.dynamix.body.reduce((storage: any, current: any) => {
      if (current.reportProperty) {
        return {
          ...storage,
          [current]: current.value,
        };
      }

      return storage;
    }, {});

    style = {
      ...style,
      ...this.style.dynamix.alt.reduce((storage: any, current: any) => {
        if (current.reportProperty) {
          return {
            ...storage,
            [current.reportProperty]: `=iif(RowNumber() Mod ${this.style.common.alternateStep + 1} = 0, "${
              current.value
            }", "${style[current] || ''}")`,
          };
        }

        return storage;
      }, {}),
    };

    if (ruleStyle?.style) {
      style = {
        ...style,
        ...Object.keys(ruleStyle.style).reduce((storage: any, current: any) => {
          if (!current.value) {
            let newStyle: string;
            if (style[current]?.includes('=')) {
              newStyle = `=iif(Fields!${column.binding}.Value ${
                ruleComparator[ruleStyle.operation as keyof typeof ruleComparator]
              } ${ruleStyle.compareValue}, "${ruleStyle.styleValue}" , ${style[current].replace('=', '')})`;
            } else {
              newStyle = `=iif(Fields!${column.binding}.Value ${
                ruleComparator[ruleStyle.operation as keyof typeof ruleComparator]
              } ${ruleStyle.compareValue}, "${ruleStyle.styleValue}" , "${style[current] || ''}")`;
            }

            return {
              ...storage,
              [current]: newStyle,
            };
          }

          return storage;
        }, {}),
      };
    }

    return style;
  }

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

  private getAggrateType(key: number | string) {
    const agrateType = [
      { key: 1, value: 'Sum' },
      { key: 2, value: 'Count' },
      { key: 3, value: 'Avg' },
    ];

    return agrateType.find(item => item.key === key || item.value === key)?.value;
  }

  private getDataType(key: number | string) {
    const dataType = [
      { key: 1, value: 'string', format: '' },
      { key: 2, value: 'number', format: 'n0' },
      { key: 3, value: 'boolean', format: '' },
      { key: 4, value: 'date', format: 'd' },
    ];

    return dataType.find(item => item.key === key || item.value === key);
  }

  private createFooter(grid: wjGrid.FlexGrid) {
    const style = this.getStyleByColumnJson(this.style.dynamix.fotter);

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

  private createFotterFromColumnJson() {
    const aggregateRow = this.createAggregate(
      this.getBindingList(),
      this.getStyleByColumnJson(this.style.dynamix.fotter)
    );

    let prevCell: number = 0;

    aggregateRow[0].Item.Value = this.style.common.fotterText;

    aggregateRow.forEach((item: any, index: number) => {
      if (item.Item.Value) {
        prevCell = index;
        return;
      }

      aggregateRow[prevCell].ColSpan ? aggregateRow[prevCell].ColSpan++ : (aggregateRow[prevCell].ColSpan = 2);
      aggregateRow[index] = null;
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
    console.log("run")
    const result = await PdfExport.exportDocument(doc, {
      fonts: [
        {
          name: 'Arial',
          source: '../assets/SVN-Arial/SVN-Arial 3.ttf',
        },
      ],
      pdfVersion: '1.4',
    });
    console.log("run2")
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
