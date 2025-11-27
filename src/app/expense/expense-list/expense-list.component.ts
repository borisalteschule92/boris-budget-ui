import { Component, inject, OnInit } from '@angular/core';
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
import { Expense, ExpenseCriteria } from '../../shared/domain';
import { ExpenseService } from '../../shared/service/expense.service';
import { catchError, of } from 'rxjs';

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
export default class ExpenseListComponent implements OnInit {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly expenseService = inject(ExpenseService);

  // State
  date = set(new Date(), { date: 1 });
  expenses: Expense[] = [];
  isLoading = false;

  // Lifecycle

  constructor() {
    // Add all used Ionic icons
    addIcons({ swapVertical, pricetag, search, alertCircleOutline, add, arrowBack, arrowForward, chevronDown, chevronForward });
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  // Actions

  loadExpenses(): void {
    this.isLoading = true;
    const yearMonth = format(this.date, 'yyyy-MM');
    const criteria: ExpenseCriteria = {
      page: 0,
      size: 1000,
      sort: 'date,desc',
      yearMonth
    };

    this.expenseService
      .findAll(criteria)
      .pipe(
        catchError((error) => {
          console.error('Error loading expenses:', error);
          return of({ content: [], last: true, totalElements: 0 });
        })
      )
      .subscribe((page) => {
        this.expenses = page.content;
        this.isLoading = false;
      });
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
    this.loadExpenses();
  };

  getMonthYear(): string {
    return format(this.date, 'MMMM yyyy');
  }

  getExpensesByDate(): { date: string; expenses: Expense[] }[] {
    // Filter expenses for the selected month
    const yearMonth = format(this.date, 'yyyy-MM');
    const monthExpenses = this.expenses.filter(expense => {
      const expenseYearMonth = expense.date.substring(0, 7);
      return expenseYearMonth === yearMonth;
    });

    const grouped = monthExpenses.reduce((acc, expense) => {
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

  hasExpenses(): boolean {
    return this.getExpensesByDate().length > 0;
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

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' || role === 'delete') {
      this.loadExpenses();
    }
  }

  async openEditExpenseModal(expense: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense }
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'save' || role === 'delete') {
      this.loadExpenses();
    }
  }
}
