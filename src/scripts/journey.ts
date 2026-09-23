/**
 * "How it works" stepper. The markup is a plain list of all seven steps
 * with their idea-mode mockups; this turns it into:
 *   - phones: a vertical stepper, one step open, Back/Next under it;
 *   - desktop: the step list on the left and one sticky phone on the right.
 * Switching mode swaps every mockup without changing the step. Nothing
 * moves unless the user acts.
 */

type Mode = 'idea' | 'decision';

const MODE_NAME: Record<Mode, string> = {
  idea: 'Challenge my idea',
  decision: 'Challenge my decision',
};

export function initJourney(): void {
  const root = document.querySelector<HTMLElement>('[data-journey]');
  if (!root) return;

  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const steps = Array.from(root.querySelectorAll<HTMLLIElement>('[data-step]'));
  const slots = steps.map((li) => li.querySelector<HTMLElement>('[data-shot-slot]')!);
  const navSlots = steps.map((li) => li.querySelector<HTMLElement>('[data-nav-slot]')!);
  const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-shot]'));
  const stage = q<HTMLElement>('[data-stage]');
  const modes = q<HTMLFieldSetElement>('[data-modes]');
  const live = q<HTMLElement>('[data-live]');
  const nav = q<HTMLElement>('[data-nav]');
  const navHome = q<HTMLElement>('[data-nav-home]');
  const back = q<HTMLButtonElement>('[data-back]');
  const next = q<HTMLButtonElement>('[data-next]');
  const count = q<HTMLElement>('[data-count]');
  if (!stage || !modes || !live || !nav || !navHome || !back || !next || !count) return;

  const total = steps.length;
  const desktop = matchMedia('(min-width: 64rem)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let mode: Mode = 'idea';

  // Each step heading gets a button, so steps can be picked directly.
  const buttons = steps.map((li, i) => {
    const heading = li.querySelector<HTMLElement>('[data-step-heading]')!;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step__head';
    button.setAttribute('aria-controls', `journey-step-${i + 1}`);
    button.append(...Array.from(heading.childNodes));
    heading.append(button);
    return button;
  });

  // Hidden mockups are now hidden by CSS (visibility), so they can
  // cross-fade instead of popping.
  shots.forEach((shot) => (shot.hidden = false));
  modes.hidden = false;
  nav.hidden = false;
  root.setAttribute('data-enhanced', '');

  /** Desktop: every mockup lives in the sticky stage. Phones: each lives
      under its own step. Only runs on load and when crossing the breakpoint. */
  function place(): void {
    if (desktop.matches) {
      stage!.append(...shots);
    } else {
      shots.forEach((shot) => slots[Number(shot.dataset.shotStep) - 1]!.append(shot));
    }
  }

  function placeNav(): void {
    const target = desktop.matches ? navHome! : navSlots[current]!;
    if (nav!.parentElement === target) return;
    // Moving a focused element drops focus; put it back.
    const focused = nav!.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    target.append(nav!);
    focused?.focus({ preventScroll: true });
  }

  function render(): void {
    steps.forEach((li, i) => {
      li.dataset.state = i === current ? 'active' : i < current ? 'done' : 'upcoming';
      const button = buttons[i]!;
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      // Roving tabindex: one tab stop for the list; arrows move within it.
      button.tabIndex = i === current ? 0 : -1;
      if (desktop.matches) button.removeAttribute('aria-expanded');
      else button.setAttribute('aria-expanded', String(i === current));
    });

    shots.forEach((shot) => {
      const visible =
        shot.dataset.mode === mode && (!desktop.matches || Number(shot.dataset.shotStep) === current + 1);
      shot.toggleAttribute('data-visible', visible);
    });

    back!.setAttribute('aria-disabled', String(current === 0));
    next!.setAttribute('aria-disabled', String(current === total - 1));
    count!.textContent = `Step ${current + 1} of ${total}`;
    placeNav();
  }

  function announce(message: string): void {
    live!.textContent = message;
  }

  function stepLabel(i: number): string {
    const title = steps[i]!.querySelector('.step__title')?.textContent?.trim() ?? '';
    return `Step ${i + 1} of ${total}: ${title}`;
  }

  /** Go to step `i`. On phones the list reflows, so bring the new step's
      heading into view. */
  function go(i: number, opts: { focusStep?: boolean; scroll?: boolean } = {}): void {
    const target = Math.max(0, Math.min(total - 1, i));
    if (target === current) return;
    current = target;
    render();
    if (opts.focusStep) buttons[current]!.focus({ preventScroll: !desktop.matches });
    if (opts.scroll && !desktop.matches) {
      buttons[current]!.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => go(i, { scroll: true }));
  });

  // On desktop the whole row is a target, not just the title.
  steps.forEach((li, i) => {
    li.addEventListener('click', (event) => {
      if (!desktop.matches || (event.target as Element).closest('button, a')) return;
      go(i);
    });
  });

  root.querySelector('[data-steps]')!.addEventListener('keydown', (event) => {
    const e = event as KeyboardEvent;
    if (!(e.target as Element).closest('.step__head')) return;
    const moves: Record<string, number> = {
      ArrowDown: current + 1,
      ArrowRight: current + 1,
      ArrowUp: current - 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: total - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    go(moves[e.key]!, { focusStep: true, scroll: true });
    if (!desktop.matches) buttons[current]!.scrollIntoView({ block: 'nearest' });
  });

  back.addEventListener('click', () => {
    if (current === 0) return;
    go(current - 1, { scroll: true });
    announce(stepLabel(current));
    if (current === 0) next.focus({ preventScroll: true });
  });
  next.addEventListener('click', () => {
    if (current === total - 1) return;
    go(current + 1, { scroll: true });
    announce(stepLabel(current));
    // Next steps aside on the last step; keep focus on a visible control.
    if (current === total - 1) back.focus({ preventScroll: true });
  });

  modes.addEventListener('change', (event) => {
    const value = (event.target as HTMLInputElement).value as Mode;
    if (value === mode) return;
    mode = value;
    render();
    announce(`Showing the ${MODE_NAME[mode]} example, step ${current + 1} of ${total}.`);
  });

  desktop.addEventListener('change', () => {
    place();
    render();
  });

  place();
  render();
  // Enable transitions only after the first render, so nothing animates
  // on load.
  requestAnimationFrame(() => requestAnimationFrame(() => root.setAttribute('data-ready', '')));
}
