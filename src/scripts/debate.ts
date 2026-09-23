/**
 * Plays the hero debate once: a voice note that turns into text, then each
 * reply after a short typing pause. It's a scripted illustration: every
 * line is already in the markup, and this only reveals them in order.
 *
 * The inline script in Hero.astro arms the debate (data-state) before first
 * paint. It skips that under prefers-reduced-motion, and then this does
 * nothing and the finished conversation stays as it is.
 */

const VOICE_MS = 1500; // waveform before it turns into text
const AFTER_VOICE_MS = 700; // transcript lands, then the first reply starts typing
const TYPING_MS = 800; // typing pause before each reply
const READ_MS = [1400, 1900, 0]; // reading time after each reply
const START_DELAY_MS = 350;

type Step = 'hidden' | 'voice' | 'typing' | 'shown';

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

export function initDebate(): void {
  const root = document.querySelector<HTMLElement>('[data-debate]');
  if (!root || !root.hasAttribute('data-state')) return;

  root.setAttribute('data-controlled', '');
  const turns = Array.from(root.querySelectorAll<HTMLElement>('[data-turn]'));
  const [user, ...replies] = turns;
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]');
  if (!user || !replay) return;

  const set = (el: HTMLElement, step: Step) => el.setAttribute('data-step', step);
  let controller: AbortController | null = null;

  async function play(): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    root!.setAttribute('data-state', 'playing');
    replay!.hidden = true;
    turns.forEach((turn) => set(turn, 'hidden'));

    try {
      await wait(START_DELAY_MS, signal);
      set(user!, 'voice');
      await wait(VOICE_MS, signal);
      set(user!, 'shown');
      await wait(AFTER_VOICE_MS, signal);

      for (const [i, reply] of replies.entries()) {
        set(reply, 'typing');
        await wait(TYPING_MS, signal);
        set(reply, 'shown');
        await wait(READ_MS[i] ?? 0, signal);
      }
      await wait(500, signal);
    } catch {
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
    // Once its top edge is 80px into view: the voice note is then on screen.
    { rootMargin: '0px 0px -80px 0px' },
  );
  observer.observe(root);
}
