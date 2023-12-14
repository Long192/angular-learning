import { SaleService } from './../service/SaleService';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  saleData: Observable<any>

  constructor(private saleService: SaleService){
    this.saleData = saleService.getSaleData()
  }

  getData(){
    return this.saleData
  }
}
