import { stiReportServiceParams } from 'src/types/stimulsoftReportParameter';
import { Stimulsoft } from 'stimulsoft-reports-js/Scripts/stimulsoft.reports';

export class StimuReportService {
  report: Stimulsoft.Report.StiReport;
  stiReportParams: stiReportServiceParams;
  top = 0;
  pageWidth = 29.7;
  defaultHeight = 0.6;
  // designer: Stimulsoft.Designer.StiDesigner

  constructor(stiReportParams: stiReportServiceParams) {
    // this.designer = designer
    this.stiReportParams = stiReportParams;
    this.report = new Stimulsoft.Report.StiReport();
    this.createTable();
  }

  createTable() {
    this.createDataSource()
    this.report.pages.getByIndex(0).orientation = Stimulsoft.Report.Components.StiPageOrientation.Landscape;
    this.createHeader();
    this.createBody();
    this.pageWidth = this.pageWidth + 2;
    this.report.pages.getByIndex(0).pageWidth = this.pageWidth;
    this.report.pages.getByIndex(0).pageHeight = this.pageWidth / 1.4142;
  }

  createHeader() {
    const headerBand = new Stimulsoft.Report.Components.StiGroupHeaderBand();
    this.report.pages.getByIndex(0).components.add(headerBand);
    const levelList = this.stiReportParams.column.filter((item: any) => item.level).map((item: any) => item.level);
    const rows: Stimulsoft.Report.Components.StiText[] = [];
    const maxLevel = Math.max(...(levelList.length ? levelList : [0]));

    rows.push(...this.getHeaderByLevelList(maxLevel));
    headerBand.height = this.top;
    rows.forEach(item => {
      headerBand.components.add(item);
    });
  }

  createDataSource(){
    const dataSource = new Stimulsoft.System.Data.DataSet("DataSource")
    dataSource.readJson(this.stiReportParams.dataSource)
    this.report.regData("DataSource", "DataSource", dataSource)
    this.report.dictionary.synchronize()
  }

  createBody() {
    let left = 0;
    const dataBand = new Stimulsoft.Report.Components.StiDataBand();
    this.report.pages.getByIndex(0).components.add(dataBand);
    dataBand.dataSourceName = "root"
    const bindingList = this.stiReportParams.column.filter(item => item.binding);
    const bodyCells = bindingList.map(item => {
      const cell = new Stimulsoft.Report.Components.StiText();
      cell.text = `{root.${item.binding}}`;
      cell.height = this.defaultHeight;
      cell.width = this.pxToCm(item.width || 100);
      cell.left = left;
      cell.format = "string"
      left += cell.width;
      return cell;
    });

    bodyCells.forEach(item => {
      dataBand.components.add(item)
    })
  }

  getHeaderByLevelList(maxLevel: number) {
    const rows: Stimulsoft.Report.Components.StiText[] = [];
    let rowLength = 0;
    this.top = (maxLevel + 1) * this.defaultHeight;
    let pageWidth = 0;
    let prevCell: any[] = [];

    for (let index = 0; index <= maxLevel; index++) {
      let left = 0;
      const rowItem = this.stiReportParams.column.filter((item: any) =>
        index === 0 ? !item.level : item.level === index
      );
      const cells = rowItem.reduce((storage: any[], current: any, cellIndex) => {
        const cell = {
          value: current.header || current.binding,
          width: this.pxToCm(current.width || 100),
          height: this.defaultHeight,
          level: current.level,
          group: current.group || null,
          left,
        };

        if (current.colSpan) {
          if (current.group) {
            const childCells = this.stiReportParams.column.filter((item: any) => item.parent === current.group);
            cell.width = childCells.reduce(
              (cellWidth: any, currentChildCell: any) => cellWidth + this.pxToCm(currentChildCell.width || 100),
              0
            );

            if (current.colSpan > childCells.length) {
              cell.width += (current.colSpan - childCells.length) * this.pxToCm(100);
            }
          } else {
            cell.width = cell.width * current.colSpan;
          }
        }

        if (current.rowSpan) {
          cell.height = cell.height * current.rowSpan;
        }

        if (index === 0) {
          pageWidth += cell.width;
          left += cell.width;
        } else {
          const childList = this.stiReportParams.column.filter(item => item.parent === current.parent);
          const childIndex = childList.findIndex(
            item => (item.header && item.header === current.header) || (item.binding && item.binding == current.binding)
          );

          cell.left = prevCell.find(item => item.group === current.parent).left;

          childList.forEach((element, index) => {
            if (index >= childIndex) {
              return;
            }

            cell.left += this.pxToCm(element.width || 100 * (element.colSpan || 1));
          });
        }

        return [...storage, cell];
      }, []);

      prevCell = cells;

      rows.push(...this.createRow(cells, this.defaultHeight * index));

      index === 0 ? (rowLength = cells.length) : null;
    }

    this.pageWidth < pageWidth ? (this.pageWidth = pageWidth) : null;

    return rows;
  }

  createRow(cells: any[], top: number) {
    return cells.map(element => {
      const textbox = new Stimulsoft.Report.Components.StiText();
      textbox.text = element.value;
      textbox.width = element.width;
      textbox.height = element.height;
      textbox.left = element.left;
      textbox.top = top;
      return textbox;
    });
  }

  pxToCm(px: number) {
    return px * 0.0264583333;
  }
}
