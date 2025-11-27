import { Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController, ToastController, LoadingController } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, calendar, cash, chevronDown, close, pricetag, save, text, trash } from 'ionicons/icons';
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
  IonToolbar,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import CategoryModalComponent from '../../category/category-modal/category-modal.component';
import { Expense, ExpenseUpsertDto, Category } from '../../shared/domain';
import { format } from 'date-fns';
import { ExpenseService } from '../../shared/service/expense.service';
import { CategoryService } from '../../shared/service/category.service';
import { catchError, finalize, of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  styleUrls: ['./expense-modal.component.scss'],
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
    IonSpinner,
    IonSelect,
    IonSelectOption
  ]
})
export default class ExpenseModalComponent implements OnInit {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);

  // ViewChild
  @ViewChild('nameInput', { read: ElementRef }) nameInput?: ElementRef<HTMLIonInputElement>;

  // Input
  @Input() expense?: Expense;

  // Form
  expenseForm: FormGroup;
  isLoading = false;
  selectedCategory?: Category;
  categories: Category[] = [];

  // Lifecycle

  constructor() {
    // Add all used Ionic icons
    addIcons({ close, save, text, pricetag, add, cash, calendar, trash, chevronDown });

    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      categoryId: [null],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategories();

    if (this.expense) {
      this.expenseForm.patchValue({
        name: this.expense.name,
        categoryId: this.expense.category?.id || null,
        amount: this.expense.amount.toString(),
        date: this.expense.date
      });
      this.selectedCategory = this.expense.category;
    }

    // Focus name input after view init
    setTimeout(() => {
      this.nameInput?.nativeElement.setFocus();
    }, 300);
  }

  // Actions

  async loadCategories(): Promise<void> {
    try {
      this.categories = await firstValueFrom(this.categoryService.findAllWithoutPaging()) || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categories = [];
    }
  }

  cancel(): void {
    if (!this.isLoading) {
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }

  async save(): Promise<void> {
    if (this.expenseForm.invalid || this.isLoading) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Saving...',
      spinner: 'crescent'
    });
    await loading.present();

    const formValue = this.expenseForm.value;
    const dto: ExpenseUpsertDto = {
      id: this.expense?.id,
      name: formValue.name.trim(),
      amount: parseFloat(formValue.amount),
      date: formValue.date,
      categoryId: formValue.categoryId || undefined
    };

    const request = this.expense?.id
      ? this.expenseService.update(this.expense.id, dto)
      : this.expenseService.create(dto);

    request
      .pipe(
        catchError((error) => {
          this.showToast('Error saving expense: ' + (error.error?.message || error.message || 'Unknown error'), 'danger');
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          loading.dismiss();
        })
      )
      .subscribe((result) => {
        if (result) {
          this.showToast('Expense saved successfully', 'success');
          this.modalCtrl.dismiss(result, 'save');
        }
      });
  }

  async delete(): Promise<void> {
    if (!this.expense || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Deleting...',
      spinner: 'crescent'
    });
    await loading.present();

    this.expenseService
      .delete(this.expense.id)
      .pipe(
        catchError((error) => {
          this.showToast('Error deleting expense: ' + (error.error?.message || error.message || 'Unknown error'), 'danger');
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          loading.dismiss();
        })
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showToast('Expense deleted successfully', 'success');
          this.modalCtrl.dismiss(null, 'delete');
        }
      });
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({
      component: CategoryModalComponent
    });
    await categoryModal.present();

    const { data, role } = await categoryModal.onWillDismiss();
    if (role === 'save' && data) {
      // Category was created, add it to the list and select it
      const newCategory: Category = data;
      this.categories.push(newCategory);
      this.selectCategory(newCategory);
    }
  }

  onCategoryChange(event: any): void {
    const categoryId = event.detail.value;
    if (categoryId) {
      this.selectedCategory = this.categories.find(c => c.id === categoryId);
    } else {
      this.selectedCategory = undefined;
    }
  }

  selectCategory(category: Category): void {
    this.selectedCategory = category;
    this.expenseForm.patchValue({ categoryId: category.id });
  }

  clearCategory(): void {
    this.selectedCategory = undefined;
    this.expenseForm.patchValue({ categoryId: null });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.expenseForm.controls).forEach((key) => {
      const control = this.expenseForm.get(key);
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

  getTitle(): string {
    return this.expense ? 'Edit Expense' : 'Add Expense';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'dd. MMM. yyyy');
  }

  get nameControl() {
    return this.expenseForm.get('name');
  }

  get amountControl() {
    return this.expenseForm.get('amount');
  }

  get dateControl() {
    return this.expenseForm.get('date');
  }

  get maxDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
