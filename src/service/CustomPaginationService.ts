import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class CustomPagination implements MatPaginatorIntl {
  changes = new Subject<void>();
  firstPageLabel = 'Trang đầu';
  itemsPerPageLabel = 'Số lượng thành phân mỗi trang:';
  lastPageLabel = 'Trang cuối';
  nextPageLabel = 'Trang tiếp';
  previousPageLabel = 'Trang sau';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return `Trang 1 trên tổng số 1 trang`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Trang ${page + 1} trên tổng số ${amountPages} trang`;
  }
}
