import { registerAngularWidget } from '@da-da/widget-angular';
import { WidgetComponent } from './widget.component';
import { WidgetSettingsComponent } from './widget-settings.component';
import { FOCUS_TIMER_WIDGET_DEFINITION } from './widget.definition';

/**
 * Entry bundle side effect: register the two manifest-declared Custom
 * Elements. The Angular integration owns Custom Element lifecycle and bridges
 * their `configuration` properties into the component inputs above.
 */
void registerAngularWidget({
  definition: FOCUS_TIMER_WIDGET_DEFINITION,
  contentComponent: WidgetComponent,
  settingsComponent: WidgetSettingsComponent,
});
