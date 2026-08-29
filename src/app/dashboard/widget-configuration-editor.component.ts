import { Component, effect, input, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  KpiDataSourceKey,
  TimeSeriesDataSourceKey,
  WidgetConfigurationUpdate,
  WidgetInstance,
} from './dashboard.models';

const TITLE_MAX_LENGTH = 60;
const NOTES_BODY_MAX_LENGTH = 1_000;

@Component({
  selector: 'app-widget-configuration-editor',
  imports: [ReactiveFormsModule],
  template: `
    <aside class="editor" aria-labelledby="editor-title">
      <div class="editor-header">
        <div>
          <p class="eyebrow">Widget configuration</p>
          <h2 id="editor-title">Edit {{ widget().configuration.title }}</h2>
        </div>
        <button type="button" aria-label="Close editor" (click)="closed.emit()">
          Close
        </button>
      </div>

      @switch (widget().type) {
        @case ('kpi') {
          <form [formGroup]="kpiForm" (ngSubmit)="saveKpi()">
            <label for="kpi-title">Title</label>
            <input id="kpi-title" type="text" formControlName="title" />
            @if (
              kpiForm.controls.title.touched && kpiForm.controls.title.invalid
            ) {
              <p class="field-error">
                A title of up to 60 characters is required.
              </p>
            }
            <label for="kpi-data-source">Data Source</label>
            <select id="kpi-data-source" formControlName="dataSource">
              <option value="monthly-revenue">Monthly revenue</option>
            </select>
            @if (
              kpiForm.controls.dataSource.touched &&
              kpiForm.controls.dataSource.invalid
            ) {
              <p class="field-error">Choose a valid Data Source.</p>
            }
            <label for="kpi-display-format">Display format</label>
            <select id="kpi-display-format" formControlName="displayFormat">
              <option value="currency">Currency</option>
            </select>
            <button type="submit" data-testid="save-widget">
              Save changes
            </button>
          </form>
        }
        @case ('time-series') {
          <form [formGroup]="timeSeriesForm" (ngSubmit)="saveTimeSeries()">
            <label for="time-series-title">Title</label>
            <input id="time-series-title" type="text" formControlName="title" />
            @if (
              timeSeriesForm.controls.title.touched &&
              timeSeriesForm.controls.title.invalid
            ) {
              <p class="field-error">
                A title of up to 60 characters is required.
              </p>
            }
            <label for="time-series-data-source">Data Source</label>
            <select id="time-series-data-source" formControlName="dataSource">
              <option value="monthly-revenue-trend">
                Monthly revenue trend
              </option>
            </select>
            @if (
              timeSeriesForm.controls.dataSource.touched &&
              timeSeriesForm.controls.dataSource.invalid
            ) {
              <p class="field-error">Choose a valid Data Source.</p>
            }
            <button type="submit" data-testid="save-widget">
              Save changes
            </button>
          </form>
        }
        @case ('notes') {
          <form [formGroup]="notesForm" (ngSubmit)="saveNotes()">
            <label for="notes-title">Title</label>
            <input id="notes-title" type="text" formControlName="title" />
            @if (
              notesForm.controls.title.touched &&
              notesForm.controls.title.invalid
            ) {
              <p class="field-error">
                A title of up to 60 characters is required.
              </p>
            }
            <label for="notes-body">Body</label>
            <textarea id="notes-body" formControlName="body"></textarea>
            @if (
              notesForm.controls.body.touched && notesForm.controls.body.invalid
            ) {
              <p class="field-error">
                Notes can contain up to 1,000 characters.
              </p>
            }
            <button type="submit" data-testid="save-widget">
              Save changes
            </button>
          </form>
        }
      }
    </aside>
  `,
  styleUrl: './widget-configuration-editor.component.scss',
})
export class WidgetConfigurationEditorComponent {
  readonly widget = input.required<WidgetInstance>();
  readonly configurationSaved = output<WidgetConfigurationUpdate>();
  readonly closed = output<void>();

  readonly kpiForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: titleValidators,
    }),
    dataSource: new FormControl<KpiDataSourceKey>('monthly-revenue', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^monthly-revenue$/),
      ],
    }),
    displayFormat: new FormControl<'currency'>('currency', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
  readonly timeSeriesForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: titleValidators,
    }),
    dataSource: new FormControl<TimeSeriesDataSourceKey>(
      'monthly-revenue-trend',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^monthly-revenue-trend$/),
        ],
      },
    ),
  });
  readonly notesForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: titleValidators,
    }),
    body: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(NOTES_BODY_MAX_LENGTH),
    }),
  });

  constructor() {
    effect(() => this.resetForm(this.widget()));
  }

  protected saveKpi(): void {
    if (this.kpiForm.invalid) {
      this.kpiForm.markAllAsTouched();
      return;
    }

    this.configurationSaved.emit({
      type: 'kpi',
      configuration: this.kpiForm.getRawValue(),
    });
  }

  protected saveTimeSeries(): void {
    if (this.timeSeriesForm.invalid) {
      this.timeSeriesForm.markAllAsTouched();
      return;
    }

    this.configurationSaved.emit({
      type: 'time-series',
      configuration: this.timeSeriesForm.getRawValue(),
    });
  }

  protected saveNotes(): void {
    if (this.notesForm.invalid) {
      this.notesForm.markAllAsTouched();
      return;
    }

    this.configurationSaved.emit({
      type: 'notes',
      configuration: this.notesForm.getRawValue(),
    });
  }

  private resetForm(widget: WidgetInstance): void {
    switch (widget.type) {
      case 'kpi':
        this.kpiForm.reset(widget.configuration);
        return;
      case 'time-series':
        this.timeSeriesForm.reset(widget.configuration);
        return;
      case 'notes':
        this.notesForm.reset(widget.configuration);
    }
  }
}

const titleValidators = [
  Validators.required,
  Validators.maxLength(TITLE_MAX_LENGTH),
];
