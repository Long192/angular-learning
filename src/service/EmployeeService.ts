import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class EmployeeService {
  url: string = "../assets/employee.json"

  constructor(private http: HttpClient) {}

  getListEmployee(): Observable<any[]>{
    return this.http.get<any[]>(this.url)
  }
}
