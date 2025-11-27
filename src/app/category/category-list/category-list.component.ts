import { Component, inject, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, chevronDown, chevronForward, pricetag, search, swapVertical } from 'ionicons/icons';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import CategoryModalComponent from '../category-modal/category-modal.component';
import { CategoryService } from '../../shared/service/category.service';
import { Category } from '../../shared/domain';
import { catchError, debounceTime, distinctUntilChanged, of, Subject } from 'rxjs';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner
  ]
})
export default class CategoryListComponent implements OnInit {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly categoryService = inject(CategoryService);

  // State
  categories: Category[] = [];
  isLoading = false;
  searchTerm = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  private searchSubject = new Subject<string>();

  // Lifecycle

  constructor() {
    // Add all used Ionic icons
    addIcons({ swapVertical, search, alertCircleOutline, add, chevronDown, chevronForward, pricetag });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearch();
  }

  // Actions

  setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.loadCategories();
      });
  }

  loadCategories(): void {
    this.isLoading = true;
    const sort = `name,${this.sortOrder}`;
    const criteria = {
      name: this.searchTerm || undefined,
      sort
    };

    this.categoryService
      .findAllWithoutPaging(criteria)
      .pipe(
        catchError((error) => {
          console.error('Error loading categories:', error);
          return of([]);
        })
      )
      .subscribe((categories) => {
        this.categories = categories;
        this.isLoading = false;
      });
  }

  toggleSort(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.loadCategories();
  }

  getSortLabel(): string {
    return this.sortOrder === 'asc' ? 'Name (A-Z)' : 'Name (Z-A)';
  }

  onSearch(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.searchSubject.next(this.searchTerm);
  }

  onSearchClear(): void {
    this.searchTerm = '';
    this.loadCategories();
  }

  hasCategories(): boolean {
    return this.categories.length > 0;
  }

  async openAddCategoryModal(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: CategoryModalComponent });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' || role === 'delete') {
      this.loadCategories();
    }
  }

  async openEditCategoryModal(category: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategoryModalComponent,
      componentProps: { category }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' || role === 'delete') {
      this.loadCategories();
    }
  }
}
