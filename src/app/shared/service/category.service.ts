import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryCriteria, CategoryUpsertDto, Page } from '../domain';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/categories';

  findAll(criteria: CategoryCriteria): Observable<Page<Category>> {
    let params = new HttpParams()
      .set('page', criteria.page.toString())
      .set('size', criteria.size.toString())
      .set('sort', criteria.sort);

    if (criteria.name) {
      params = params.set('name', criteria.name);
    }

    return this.http.get<Page<Category>>(this.apiUrl, { params });
  }

  findAllWithoutPaging(criteria?: { name?: string; sort?: string }): Observable<Category[]> {
    let params = new HttpParams();
    if (criteria?.name) {
      params = params.set('name', criteria.name);
    }
    if (criteria?.sort) {
      params = params.set('sort', criteria.sort);
    }

    return this.http.get<Category[]>(`${this.apiUrl}/all`, { params });
  }

  findById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  create(dto: CategoryUpsertDto): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, dto);
  }

  update(id: string, dto: CategoryUpsertDto): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

