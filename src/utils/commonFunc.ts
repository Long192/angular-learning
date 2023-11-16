import { reportSection } from 'src/interface/reportProp';

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
  let header,
    textBoxCount = 1;
  const column = await fetch(url).then(data => data.json());

  const firstRowArray = column.columns.filter((item: any) => !item.level);

  const firstRow = firstRowArray.reduce((storage: any, current: any) => {
    const cell = {
      Item: {
        Type: current.type || 'textbox',
        Name: `${current.header || current.binding} header table`,
        CanGrow: true,
        KeepTogether: true,
        Value: current.header || current.binding,
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
    };

    console.log(current);

    if (current.colSpan) {
      console.log(cell);
      return [...storage, ...[cell].concat(new Array(current.colSpan - 1).fill(null))];
    }

    return [...storage, cell];
  }, []);

  console.log(firstRow);

  return {
    Type: 'Table',
    Name: column.report.reportTable.name,
    DataSetName: column.report.reportTable.dataSets,
  };
};
