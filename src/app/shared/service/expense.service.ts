import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, ExpenseCriteria, ExpenseUpsertDto, Page } from '../domain';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/expenses';

  findAll(criteria: ExpenseCriteria): Observable<Page<Expense>> {
    let params = new HttpParams()
      .set('page', criteria.page.toString())
      .set('size', criteria.size.toString())
      .set('sort', criteria.sort);

    if (criteria.categoryIds && criteria.categoryIds.length > 0) {
      criteria.categoryIds.forEach(id => {
        params = params.append('categoryIds', id);
      });
    }
    if (criteria.name) {
      params = params.set('name', criteria.name);
    }
    if (criteria.yearMonth) {
      params = params.set('yearMonth', criteria.yearMonth);
    }

    return this.http.get<Page<Expense>>(this.apiUrl, { params });
  }

  findById(id: string): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  create(dto: ExpenseUpsertDto): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, dto);
  }

  update(id: string, dto: ExpenseUpsertDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

