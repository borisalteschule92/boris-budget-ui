import { Component, inject, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import CategoryModalComponent from '../../category/category-modal/category-modal.component';
import { Expense } from '../../shared/domain';
import { format } from 'date-fns';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  styleUrls: ['./expense-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
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
    IonIcon
  ]
})
export default class ExpenseModalComponent implements OnInit {
  // DI
  private readonly modalCtrl = inject(ModalController);

  // Input
  @Input() expense?: Expense;

  // State
  name = '';
  categoryName = '';
  amount = '';
  date = new Date().toISOString();

  // Lifecycle

  constructor() {
    // Add all used Ionic icons
    addIcons({ close, save, text, pricetag, add, cash, calendar, trash, chevronDown });
  }

  ngOnInit(): void {
    if (this.expense) {
      this.name = this.expense.name;
      this.categoryName = this.expense.category?.name || '';
      this.amount = this.expense.amount.toString();
      this.date = this.expense.date;
    }
  }

  // Actions

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.modalCtrl.dismiss(null, 'save');
  }

  delete(): void {
    this.modalCtrl.dismiss(null, 'delete');
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    await categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }

  getTitle(): string {
    return this.expense ? 'Edit Expense' : 'Add Expense';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'dd. MMM. yyyy');
  }
}
