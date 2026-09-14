import { registerAngularWidget } from '@da-da/widget-angular';
import { WidgetComponent } from './widget.component';
import { WidgetSettingsComponent } from './widget-settings.component';
import { FOCUS_TIMER_WIDGET_DEFINITION } from './widget.definition';

void registerAngularWidget({
  definition: FOCUS_TIMER_WIDGET_DEFINITION,
  contentComponent: WidgetComponent,
  settingsComponent: WidgetSettingsComponent,
});
