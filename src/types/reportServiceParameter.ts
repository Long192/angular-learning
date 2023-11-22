import { Core } from '@grapecity/activereports';

export type constructorReportService = {
  reportName: string;
  layers?: Core.Rdl.Layer[];
  Page?: Core.Rdl.Page;
  reportSectionName: string;
  dataSource: {
    dataSourceName: string,
    data: any
  }
};
