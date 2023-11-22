let count = 1;

enum aggregate {
  'Avg' = 'Avg',
  'Cnt' = 'Count',
  'Sum' = 'Sum',
}

enum rowTypeEnum {
  header = 'header',
  detail = 'detail',
  group = 'group',
}

export const createReport = async (columnUrl: string, name: string) => {
  const data = await fetch('../assets/dataResource.json').then((response: Response) => response.json());

  const column = await fetch(columnUrl).then((data: Response) => data.json());

  const datasets = await getDataSet(column.report.dataSource, data);

  const dataSource = column.report.dataSource.map(
    (item: any) => data.find((dataItem: any) => dataItem.id === item.dataSourceName).template
  );

  return {
    Name: column.report.name,
    Width: '0in',
    Layers: [{ Name: 'default' }],
    CustomProperties: [
      { Name: 'DisplayType', Value: 'Page' },
      { Name: 'SizeType', Value: 'Default' },
      { Name: 'PaperOrientation', Value: 'Portrait' },
    ],
    Page: {
      PageWidth: '12.5in',
      PageHeight: '10in',
      RightMargin: '0in',
      LeftMargin: '0in',
      TopMargin: '0in',
      BottomMargin: '0in',
      Columns: 1,
      ColumnSpacing: '0.5in',
    },
    DataSources: dataSource,
    ReportSections: [
      {
        Name: column.report.name + 'section',
        Type: 'Continuous',
        Page: {
          PageWidth: '12.5in',
          PageHeight: '10in',
          RightMargin: '0.25in',
          LeftMargin: '0.25in',
          TopMargin: '0.5in',
          BottomMargin: '0.5in',
          Columns: 1,
          ColumnSpacing: '0.5in',
        },
        Body: {
          Height: '1in',
          ReportItems: [createTable(column)],
        },
        PageHeader: {},
        PageFooter: {},
      },
    ],
    DataSets: datasets,
  };
};

const createTable = (column: any) => {
  const header = createHeader(column);
  const columnWidth = getHeaderRow(column.columns)
    .filter((item: any) => !item?.level)
    .map((item: any) => ({
      Width: `${(item?.width || 99) * 0.0104166667}in`,
    }));

  return {
    Type: 'table',
    Name: column.report.reportTable.name,
    TableColumns: columnWidth,
    Header: header,
    TableGroups: createGroup(column, header.TableRows),
    Details: createDetail(column, header.TableRows),
    Top: '0in',
    Height: '0.25in',
  };
};

const createHeader = (column: any) => {
  const header: any = {
    TableRows: [],
    RepeatOnNewPage: true,
  };

  const firstRow = getHeaderRow(column.columns);

  header.TableRows.push({
    Height: '0.25in',
    TableCells: createRow(firstRow, rowTypeEnum.header),
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
        TableCells: createRow(newRow, rowTypeEnum.header),
      });

      preLevelRow = newRow;
    }
  }

  return header;
};

const createRow = (column: any[], rowType: string, style?: any) =>
  column.reduce((storage: any, current: any) => {
    if (current === 'default') {
      return [...storage, createCell()];
    }

    if (rowType === rowTypeEnum.detail) {
      if (current.binding === 'Quantity') {
        return [...storage, createCell(`=Fields!${current.binding}.Value * 1000`, current.type || 'textbox', style)];
      }

      return [
        ...storage,
        createCell(`=Fields!${current.binding}.Value`, current.type || 'textbox', {
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
        createCell(`=${aggregate[current.aggregate as keyof typeof aggregate]}(Fields!${current.binding}.Value)`),
      ];
    }

    const cell = createCell(
      current.header || current.binding,
      rowType === rowTypeEnum.header ? 'textbox' : current.type,
      style,
      current.colSpan,
      current.rowSpan
    );

    return [...storage, cell];
  }, []);

const createCell = (value?: any, type?: string, style?: any, colSpan?: number, rowSpan?: number) => {
  let item: any = {
    Item: {
      Type: type || 'textbox',
      Name: `${type || 'textBox'}${++count}`,
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

const getHeaderRow = (columns: any) => {
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

const getDataSet = async (sourceName: any, data: any) => {
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

const createGroup = (column: any, header: any) => {
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

  const aggregateRow = createAggregate(column, header);

  column.collumnGroup.forEach((item: string, index: number) => {
    aggregateRow[index + 1].Item.Value = `=Fields!${item}.Value`;
    groupRow[0].Group.GroupExpressions.push(`=Fields!${item}.Value`);
  });

  groupRow[0].Header.TableRows[0].TableCells.push(...aggregateRow);

  return groupRow;
};

const createAggregate = (column: any, header: any) => {
  const aggregateList = column.columns.filter((item: any) => item.aggregate);

  const aggregateRow = getBindingList(header).map((item: any) => {
    const aggregateCell = aggregateList.find((aggregateItem: any) => aggregateItem.header === item.Item.Value);

    if (aggregateCell) {
      return aggregateCell;
    }

    return 'default';
  });

  return createRow(aggregateRow, rowTypeEnum.group);
};

const getBindingList = (header: any) => {
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

const createDetail = (column: any, header: any) => {
  const bindingList = getBindingList(header);

  // console.log(bindingList);

  const bindingColumn = bindingList.map((item: any) =>
    column.columns.find(
      (columnItem: any) => columnItem.header === item.Item.Value || columnItem.binding === item.Item.Value
    )
  );

  const detailRow = createRow(bindingColumn, rowTypeEnum.detail);

  return {
    TableRows: [
      {
        Height: '0.25in',
        TableCells: detailRow,
      },
    ],
  };
};
