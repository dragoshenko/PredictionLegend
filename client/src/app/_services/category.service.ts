import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnInit, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable, of } from 'rxjs';
import { Category } from '../_models/category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + 'category';
  rootCategories = signal<Category[]>([]);
  allCategories = signal<Category[]>([]);
  private categoriesLoaded = false;

  constructor() {
      this.getCategories();
  }

  ngOnInit(): void {

  }

  getCategories(): void {
    if (this.categoriesLoaded && this.rootCategories.length > 0) {
      return;
    }
    this.http.get<Category[]>(this.baseUrl).subscribe({
      next: (categories: Category[]) => {
        this.allCategories.set(categories);
        this.buildCategoryHierarchy(categories);
        this.categoriesLoaded = true;
        console.log('All categories received:', this.allCategories);
      },
      error: (error) => {
        console.error('Error fetching categories:', error);
      }
    });
  }

  private buildCategoryHierarchy(categories: Category[]): void {
    const rootCats = categories.filter(cat => !cat.parentCategoryId);
    console.log('Root categories:', rootCats);

    const rootCat = rootCats.map(rootCat => {
      const subCategories = categories.filter(cat => cat.parentCategoryId === rootCat.id);
      return {
        ...rootCat,
        subCategories: subCategories
      };
    });
    this.rootCategories.set(rootCat);
    console.log('Final root categories with subcategories:', this.rootCategories);
  }

  getCategoryTree(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/tree`);
  }


  getCategory(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  getSubcategories(parentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${parentId}/subcategories`);
  }

  createCategory(categoryData: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, categoryData);
  }

  updateCategory(id: number, categoryData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, categoryData);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
