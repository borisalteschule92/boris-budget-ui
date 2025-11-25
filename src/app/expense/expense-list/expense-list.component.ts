import { Component, inject } from '@angular/core';
import { addMonths, format, set } from 'date-fns';
import { ModalController } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, arrowBack, arrowForward, chevronDown, chevronForward, pricetag, search, swapVertical } from 'ionicons/icons';
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
  IonListHeader,
  IonSearchbar,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import ExpenseModalComponent from '../expense-modal/expense-modal.component';
import { Expense } from '../../shared/domain';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonSearchbar,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton
  ]
})
export default class ExpenseListComponent {
  // DI
  private readonly modalCtrl = inject(ModalController);

  // State
  date = set(new Date(), { date: 1 });
  // Mock data for expenses
  expenses: Expense[] = [
    {
      id: '1',
      createdAt: '2025-11-25T10:00:00Z',
      lastModifiedAt: '2025-11-25T10:00:00Z',
      name: 'Boris test',
      amount: 3434.0,
      date: '2025-11-25',
      category: {
        id: '1',
        createdAt: '2025-11-01T10:00:00Z',
        lastModifiedAt: '2025-11-01T10:00:00Z',
        name: 'Boris cat 1',
        color: '#428cff'
      }
    },
    {
      id: '2',
      createdAt: '2025-11-23T10:00:00Z',
      lastModifiedAt: '2025-11-23T10:00:00Z',
      name: 'Test 333',
      amount: 46854.0,
      date: '2025-11-23',
      category: {
        id: '2',
        createdAt: '2025-11-01T10:00:00Z',
        lastModifiedAt: '2025-11-01T10:00:00Z',
        name: 'Category 2',
        color: '#50c8ff'
      }
    }
  ];

  // Lifecycle

  constructor() {
    // Add all used Ionic icons
    addIcons({ swapVertical, pricetag, search, alertCircleOutline, add, arrowBack, arrowForward, chevronDown, chevronForward });
  }

  // Actions

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
  };

  getMonthYear(): string {
    return format(this.date, 'MMMM yyyy');
  }

  getExpensesByDate(): { date: string; expenses: Expense[] }[] {
    const grouped = this.expenses.reduce((acc, expense) => {
      const date = expense.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    return Object.entries(grouped)
      .map(([date, expenses]) => ({ date, expenses }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy');
  }

  formatAmount(amount: number): string {
    return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async openAddExpenseModal(): Promise<void> {
    const modal = await this.modalCtrl.create({ component: ExpenseModalComponent });
    await modal.present();
  }

  async openEditExpenseModal(expense: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense }
    });
    await modal.present();
  }
}
