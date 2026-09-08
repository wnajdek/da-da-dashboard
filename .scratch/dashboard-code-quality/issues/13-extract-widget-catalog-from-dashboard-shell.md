# 13: Extract the Widget Catalog from the Dashboard Shell

**What to build:** Give users a focused Widget Catalog experience for installing, inspecting, adding, and removing Widget Installations while leaving the Dashboard Shell responsible only for composing recovery, catalog, grid, and undo behavior.

**Blocked by:** 05/Extract long Dashboard templates, 09/Separate Widget Installation management from Widget loading, and 12/Report Dashboard persistence failures.

**Status:** completed

- [x] Manifest URL input, installation progress, operation feedback, available Widget metadata, adding a Widget Instance, and removing an installation are owned by a focused Catalog component.
- [x] Catalog feedback is derived from explicit installation operation results and remains accessible to users.
- [x] The Dashboard Shell composes the recovery view, Widget Catalog, Dashboard Grid, persistence feedback, and removal undo through small interfaces.
- [x] Adding a Widget Instance still uses the Widget Manifest's default Widget Configuration and preferred Grid Layout size.
- [x] Removing an installation still preserves existing Widget Instances as Unavailable Widgets.
- [x] Catalog and Shell tests cover their respective user-visible behavior without reaching into private implementation members.
