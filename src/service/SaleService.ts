import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class SaleService {
  constructor(private http: HttpClient) {}

  getSaleData(): Observable<any> {
    return this.http.get<any>('../assets/saleReportData.json');
  }

  getSaleColumn(): Observable<any> {
    return this.http.get<any>('../assets/saleReportColumn.json');
  }
}
