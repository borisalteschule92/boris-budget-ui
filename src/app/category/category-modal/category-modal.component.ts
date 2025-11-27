import { Component, inject, Input, OnInit } from '@angular/core';
import { ModalController, ToastController, LoadingController } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { brush, close, save, text, trash } from 'ionicons/icons';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { CategoryService } from '../../shared/service/category.service';
import { Category, CategoryUpsertDto } from '../../shared/domain';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-category-modal',
  templateUrl: './category-modal.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonSpinner
  ]
})
export default class CategoryModalComponent implements OnInit {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);

  // Input
  @Input() category?: Category;

  // Form
  categoryForm: FormGroup;
  isLoading = false;

  // Lifecycle

  // Available colors
  availableColors = [
    '#428cff',
    '#50c8ff',
    '#6a64ff',
    '#7c7aff',
    '#ff4961',
    '#ff6b9d',
    '#c8e6c9',
    '#ffd54f',
    '#ffb74d',
    '#a1887f',
    '#90a4ae',
    '#78909c'
  ];

  constructor() {
    // Add all used Ionic icons
    addIcons({ close, save, text, trash, brush });

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      color: ['#428cff']
    });
  }

  ngOnInit(): void {
    if (this.category) {
      this.categoryForm.patchValue({
        name: this.category.name,
        color: this.category.color || '#428cff'
      });
    }
  }

  // Actions

  cancel(): void {
    if (!this.isLoading) {
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }

  async save(): Promise<void> {
    if (this.categoryForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Saving...',
      spinner: 'crescent'
    });
    await loading.present();

    const formValue = this.categoryForm.value;
    const dto: CategoryUpsertDto = {
      id: this.category?.id,
      name: formValue.name.trim(),
      color: formValue.color
    };

    const request = this.category?.id
      ? this.categoryService.update(this.category.id, dto)
      : this.categoryService.create(dto);

    request
      .pipe(
        catchError((error) => {
          this.showToast('Error saving category: ' + (error.error?.message || error.message || 'Unknown error'), 'danger');
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          loading.dismiss();
        })
      )
      .subscribe((result) => {
        if (result) {
          const message = this.category ? 'Category updated successfully' : 'Category created successfully';
          this.showToast(message, 'success');
          this.modalCtrl.dismiss(result, 'save');
        }
      });
  }

  async delete(): Promise<void> {
    if (!this.category?.id || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Deleting...',
      spinner: 'crescent'
    });
    await loading.present();

    this.categoryService
      .delete(this.category.id)
      .pipe(
        catchError((error) => {
          this.showToast('Error deleting category: ' + (error.error?.message || error.message || 'Unknown error'), 'danger');
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          loading.dismiss();
        })
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showToast('Category deleted successfully', 'success');
          this.modalCtrl.dismiss(null, 'delete');
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach((key) => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  selectColor(color: string): void {
    this.categoryForm.patchValue({ color });
  }

  getTitle(): string {
    return this.category ? 'Edit Category' : 'Add Category';
  }

  get nameControl() {
    return this.categoryForm.get('name');
  }
}
