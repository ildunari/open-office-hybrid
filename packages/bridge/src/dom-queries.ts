export const DOM_QUERIES: Record<
  string,
  { description: string; code: string }
> = {
  "visible-panels": {
    description: "Which tabs and panels are currently visible",
    code: `
      const panels = {};
      // Check for common panel containers
      const tabButtons = document.querySelectorAll('[role="tab"], [data-tab]');
      tabButtons.forEach(btn => {
        const name = btn.textContent?.trim() || btn.getAttribute('data-tab') || 'unknown';
        const isActive = btn.classList.contains('active') || btn.getAttribute('aria-selected') === 'true';
        panels[name] = isActive;
      });
      // Check diagnostics, settings, plan panels
      const diagnostics = document.querySelector('[class*="diagnostics"]');
      const settings = document.querySelector('[class*="settings"]');
      const plan = document.querySelector('[class*="plan-panel"]');
      return {
        tabs: panels,
        diagnosticsVisible: diagnostics ? diagnostics.offsetHeight > 0 : false,
        settingsVisible: settings ? settings.offsetHeight > 0 : false,
        planVisible: plan ? plan.offsetHeight > 0 : false,
      };
    `,
  },
  "scroll-positions": {
    description: "Scroll state of key containers",
    code: `
      const containers = document.querySelectorAll('[class*="message-list"], [class*="panel-expandable"]');
      const positions = [];
      containers.forEach(el => {
        positions.push({
          className: el.className.split(' ').slice(0, 3).join(' '),
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          atBottom: Math.abs(el.scrollTop + el.clientHeight - el.scrollHeight) < 5,
        });
      });
      return positions;
    `,
  },
  "computed-theme": {
    description: "Current CSS variable values for theme detection",
    code: `
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const vars = {};
      const chatVars = ['--chat-bg', '--chat-fg', '--chat-accent', '--chat-border', '--chat-input-bg', '--chat-font-mono'];
      chatVars.forEach(v => {
        vars[v] = style.getPropertyValue(v).trim();
      });
      vars['data-theme'] = root.getAttribute('data-theme');
      return vars;
    `,
  },
  "layout-metrics": {
    description: "Bounding rects of major UI sections",
    code: `
      const sections = {};
      const selectors = {
        root: '[class*="chat-interface"]',
        messageList: '[class*="message-list"]',
        chatInput: '[class*="chat-input"]',
        diagnostics: '[class*="diagnostics"]',
        header: 'header, [class*="header"]',
      };
      for (const [name, sel] of Object.entries(selectors)) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          sections[name] = { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) };
        }
      }
      return sections;
    `,
  },
  "message-count": {
    description: "Count of visible messages by type",
    code: `
      const messages = document.querySelectorAll('[class*="message"]');
      let user = 0, assistant = 0, tool = 0, other = 0;
      messages.forEach(el => {
        const cls = el.className || '';
        if (cls.includes('user')) user++;
        else if (cls.includes('assistant')) assistant++;
        else if (cls.includes('tool')) tool++;
        else other++;
      });
      return { total: messages.length, user, assistant, tool, other };
    `,
  },
};
