/**
 * Plays the hero debate once: the user's message types itself out behind a
 * blinking cursor, then each reply follows after a short typing pause. It's a scripted illustration: every
 * line is already in the markup, and this only reveals them in order.
 *
 * The inline script in Hero.astro arms the debate (data-state) before first
 * paint. It skips that under prefers-reduced-motion, and then this does
 * nothing and the finished conversation stays as it is.
 */

const CARET_MS = 500; // cursor blinks on its own before the first keystroke
const CHAR_MS = 32; // per character typed
const PUNCTUATION_MS = 140; // extra pause after , . ? !
const BEFORE_SEND_MS = 450; // finished typing, cursor still blinking
const AFTER_SEND_MS = 600; // message sent, then the first reply starts typing
const TYPING_MS = 800; // typing pause before each reply
const READ_MS = [1400, 1900, 0]; // reading time after each reply
const START_DELAY_MS = 350;

type Step = 'hidden' | 'composing' | 'typing' | 'shown';

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/**
 * Splits a paragraph into one span per character for the type-out effect.
 * The visible copy is aria-hidden; screen readers get the sentence whole.
 * Returns the spans, led by an empty one that holds the cursor before the
 * first character.
 */
function splitForTyping(p: HTMLElement): HTMLElement[] {
  const text = (p.textContent ?? '').replace(/\s+/g, ' ').trim();
  const whole = document.createElement('span');
  whole.className = 'sr-only-text';
  whole.textContent = text;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  const chars: HTMLElement[] = [];
  for (const ch of ['', ...text]) {
    const span = document.createElement('span');
    span.className = 'typed__char';
    span.textContent = ch;
    visual.append(span);
    chars.push(span);
  }
  p.replaceChildren(whole, visual);
  return chars;
}

export function initDebate(): void {
  const root = document.querySelector<HTMLElement>('[data-debate]');
  if (!root || !root.hasAttribute('data-state')) return;

  root.setAttribute('data-controlled', '');
  const turns = Array.from(root.querySelectorAll<HTMLElement>('[data-turn]'));
  const [user, ...replies] = turns;
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');
  if (!user || !replay) return;

  const set = (el: HTMLElement, step: Step) => el.setAttribute('data-step', step);
  const message = user.querySelector<HTMLElement>('[data-type-out]');
  const chars = message ? splitForTyping(message) : [];
  let controller: AbortController | null = null;

  const moveCaret = (to: HTMLElement | null) => {
    chars.forEach((c) => c.classList.toggle('is-caret', c === to));
  };

  async function typeOut(signal: AbortSignal): Promise<void> {
    chars.forEach((c) => c.classList.remove('is-typed'));
    moveCaret(chars[0] ?? null);
    await wait(CARET_MS, signal);
    for (const c of chars.slice(1)) {
      c.classList.add('is-typed');
      moveCaret(c);
      await wait(CHAR_MS + (/[,.?!]/.test(c.textContent ?? '') ? PUNCTUATION_MS : 0), signal);
    }
    await wait(BEFORE_SEND_MS, signal);
    moveCaret(null);
  }

  async function play(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    root!.setAttribute('data-state', 'playing');
    replay!.hidden = true;
    turns.forEach((turn) => set(turn, 'hidden'));

    try {
      await wait(START_DELAY_MS, signal);
      set(user!, 'composing');
      await typeOut(signal);
      set(user!, 'shown');
      await wait(AFTER_SEND_MS, signal);

      for (const [i, reply] of replies.entries()) {
        set(reply, 'typing');
        await wait(TYPING_MS, signal);
        set(reply, 'shown');
        await wait(READ_MS[i] ?? 0, signal);
      }
      await wait(500, signal);
    } catch {
      moveCaret(null);
      return; // replaced by a newer run
    }

    root!.setAttribute('data-state', 'done');
    replay!.hidden = false;
    // Replay hid itself while playing; hand focus back to it.
    if (document.activeElement === root) replay!.focus();
  }

  replay.addEventListener('click', () => {
    root.focus({ preventScroll: true });
    void play();
  });

  // Start when the debate is actually on screen. On desktop that is on
  // load; on phones it sits below the fold and waits to be scrolled to.
  if (!('IntersectionObserver' in window)) {
    void play();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void play();
      }
    },
    // Once its top edge is 80px into view: the user's message is then on screen.
    { rootMargin: '0px 0px -80px 0px' },
  );
  observer.observe(root);
}
