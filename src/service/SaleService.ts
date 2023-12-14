import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class SaleService {
  url: string = "../assets/saleReportData.json"

  constructor(private http: HttpClient){}

  getSaleData(): Observable<any>{
    return this.http.get<any>(this.url)
  }
}