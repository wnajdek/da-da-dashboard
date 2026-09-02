# 04: Manage Widget Installations and isolate Unavailable Widgets

**What to build:** A Dashboard user can remove an installed Widget Type without losing the associated Widget Instances. Those instances become Unavailable Widgets with safe removal, and failures to load a Widget entry bundle or register its declared Widget Element affect only the relevant card while the rest of the Dashboard remains usable.

**Blocked by:** 02: Render the Weather Widget as an installed Custom Element.

**Status:** ready-for-agent

- [ ] Removing a Widget Installation removes it from the addable Widget Types but preserves its persisted Widget Instances, Widget Configuration, Grid Layout, and ordering.
- [ ] A preserved instance with no resolvable Widget Installation, a failed entry-bundle load, or missing/mismatched Widget Element registration renders as an Unavailable Widget.
- [ ] An Unavailable Widget can be removed safely without preventing other resolved Widget Instances from rendering or remaining editable through their own Widget Settings UI.
- [ ] Tests cover installation removal and all runtime-unavailable outcomes alongside a functioning installed Widget.

