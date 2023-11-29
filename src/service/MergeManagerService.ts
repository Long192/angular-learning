import { Inject, Injectable } from '@angular/core';
import * as wjGrid from '@grapecity/wijmo.grid';

@Injectable()
export class MergeManagerService extends wjGrid.MergeManager {
  col: number;
  col2: number;

  constructor(@Inject('col') col: number, @Inject('col2') col2: number) {
    super();
    this.col = col;
    this.col2 = col2;
  }

  override getMergedRange(
    panel: wjGrid.GridPanel,
    row: number,
    col: number,
    clip?: boolean | undefined
  ): wjGrid.CellRange | null {
    if (panel.cellType !== wjGrid.CellType.ColumnFooter) {
      return super.getMergedRange(panel, row, col, clip);
    }

    var rg = new wjGrid.CellRange(row, col);
    // expand left/right
    if (this.col === rg.col) {
      rg.col2 = this.col2;
    }

    if (rg.col < this.col2) {
      rg.col = 0;
    }

    return rg;
    // return null;
  }
}
