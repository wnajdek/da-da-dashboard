# 06: Preview Widget content and settings locally

**What to build:** A Widget Author can start a generated Widget Project with one command, see its content and Widget Settings UI interact in a small browser preview, and obtain the Manifest URL needed for installation in a real local Dashboard.

**Blocked by:** 05: Generate an independent Angular Widget Project.

**Status:** ready-for-agent

- [ ] The development command starts the Widget build, static development server, and preview without requiring a checkout of Dashboard source.
- [ ] The preview mounts the generated content and settings Elements through the same public contract used by the Dashboard.
- [ ] Saving valid settings in the preview assigns the replacement Widget Configuration back to both Elements and visibly updates the content.
- [ ] Invalid settings remain the Widget Project's responsibility and produce useful Widget-owned feedback.
- [ ] The development server prints a stable Widget Manifest URL and serves the Manifest and entry bundle with suitable module and CORS behavior for local Dashboard installation.
- [ ] The preview does not simulate Dashboard grid, persistence, installation management, trust policy, or Widget Frame controls.
- [ ] Development documentation explains that changed Manifest metadata requires removing and reinstalling the Widget Installation.

