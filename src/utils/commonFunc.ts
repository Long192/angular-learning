import { reportSection } from 'src/interface/reportProp';

let count = 1;

export const createReportSection = (reportSection: reportSection | reportSection[]) => {
  if (Array.isArray(reportSection)) {
    return reportSection.map(item => ({
      ...item,
      Body: { ReportItems: [] },
      PageHeader: {},
      PageFooter: {},
    }));
  }

  return [
    {
      ...reportSection,
      Body: { ReportItems: [] },
      PageHeader: {},
      PageFooter: {},
    },
  ];
};

export const createTable = async (url: string) => {
  const column = await fetch(url).then(data => data.json());

  const columnWidth = getHeaderRow(column.columns)
    .filter((item: any) => !item?.level)
    .map((item: any) => ({
      Width: `${(item?.width || 100) * 0.0104166667}in`,
    }));

  return {
    Type: 'Table',
    Name: column.report.reportTable.name,
    // DataSetName: column.report.reportTable.dataSets,
    Style: {
      Border: {
        Style: 'Solid',
      },
      TopBorder: {
        Style: 'Solid',
      },
      BottomBorder: {
        Style: 'Solid',
      },
      LeftBorder: {
        Style: 'Solid',
      },
      RightBorder: {
        Style: 'Solid',
      },
    },
    TableColums: columnWidth,
    Header: createHeader(column),
  };
};

const createHeader = (column: any) => {
  const header: any = {
    TableRow: [],
  };

  const firstRow = getHeaderRow(column.columns);

  header.TableRow.push({
    Height: '0.25in',
    TableCells: createRow(firstRow),
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

      const newRow = new Array(header.TableRow[0].TableCells.length).fill('default');

      parentIndexList.forEach((item: any) => {
        const startItem = levelList.filter((levelItem: any) => item.parent === levelItem.parent);

        newRow.splice(item.index, startItem.length, ...startItem);
      });

      header.TableRow.push({
        Height: '0.25in',
        TableCells: createRow(newRow),
      });

      preLevelRow = newRow;
    }
  }

  return header;
};

const createRow = (column: any[]) =>
  column.reduce((storage: any, current: any) => {
    if (current === 'default') {
      return [...storage, createCell()];
    }

    if (!current) {
      return [...storage, null];
    }

    const cell = createCell(current.header || current.binding, current.type, current.colSpan, current.rowSpan);

    // if (current.colSpan) {
    //   return [...storage, ...[cell].concat(new Array(current.colSpan - 1).fill(null))];
    // }

    return [...storage, cell];
  }, []);

const createCell = (value?: string, type?: string, colSpan?: number, rowSpan?: number) => {
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
        // Width: '0.8166in',
        // Height: '0.5in',
      },
    },
    colSpan: colSpan || 0,
    rowSpan: rowSpan || 0,
  };

  if (!colSpan) {
    delete item.colSpan;
  }

  if (!rowSpan) {
    delete item.rowSpan;
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

const createGroup = () => {};
