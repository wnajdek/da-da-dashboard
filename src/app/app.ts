import { Component } from '@angular/core';
import { DashboardShellComponent } from './dashboard/dashboard-shell.component';

@Component({
  selector: 'app-root',
  imports: [DashboardShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
