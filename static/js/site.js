document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-code-workbench]').forEach((workbench) => {
    const tabs = Array.from(workbench.querySelectorAll('[role="tab"]'));
    const panels = Array.from(workbench.querySelectorAll('[role="tabpanel"]'));
    const filename = workbench.querySelector('[data-editor-filename]');

    const selectTab = (tab, moveFocus = false) => {
      tabs.forEach((candidate) => {
        const selected = candidate === tab;
        candidate.classList.toggle('is-active', selected);
        candidate.setAttribute('aria-selected', String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute('aria-controls');
      });

      if (filename) {
        filename.textContent = tab.dataset.file;
      }

      if (moveFocus) {
        tab.focus();
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
          return;
        }

        event.preventDefault();
        let nextIndex = index;

        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          nextIndex = (index + 1) % tabs.length;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        }

        selectTab(tabs[nextIndex], true);
      });
    });
  });
});
