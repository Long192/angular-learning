import { Core } from '@grapecity/activereports';

export type constructorReportService = {
  reportName: string;
  reportSectionName: string;
  companyName?: string;
  address?: string;
  title: string;
  subTitle: string;
  tableName: string;
  layers?: Core.Rdl.Layer[];
  Page?: Core.Rdl.Page;
  dataSource: {
    dataSourceName: string;
    data: any;
  };
  reportSectionWidth: string,
  rules: any
};
