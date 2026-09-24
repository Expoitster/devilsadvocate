/**
 * The waitlist form. It inserts one row into Supabase's `waitlist` table
 * with the public key; row-level security allows exactly that and nothing
 * else (see supabase/waitlist.sql). The checks below mirror the table's
 * constraints, so people see a clear message instead of a database error.
 */

// Same rule as the table's check: something@something.something, no spaces.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
const LIMITS = { email: 254, first_name: 80, first_challenge: 280, source: 100 };
const TIMEOUT_MS = 15000;

const COPY = {
  invalidEmail: 'That email looks off. Check for typos and try again.',
  consent: 'Tick the box so we can email you about the beta.',
  tooLong: 'That’s a bit long. Trim it and try again.',
  checkFailed: 'Something in the form looks off. Check your email and try again.',
  failed: 'Something broke on our side, and it’s not your idea’s fault. Try again in a minute.',
  joining: 'Joining…',
};

type Supabase = typeof import('../lib/supabase').supabase;
let client: Promise<Supabase> | null = null;
// Load the Supabase library only for people who use the form.
const loadClient = () => (client ??= import('../lib/supabase').then((m) => m.supabase));

/** utm_source, or failing that ref, from the page URL. */
function trafficSource(): string | null {
  const params = new URLSearchParams(location.search);
  const value = (params.get('utm_source') ?? params.get('ref') ?? '').trim().slice(0, LIMITS.source);
  return value || null;
}

export function initWaitlist(): void {
  const form = document.querySelector<HTMLFormElement>('[data-waitlist]');
  const done = document.querySelector<HTMLDialogElement>('dialog[data-done]');
  const note = document.querySelector<HTMLElement>('[data-done-note]');
  if (!form || !done || !note) return;

  const email = form.querySelector<HTMLInputElement>('input[name="email"]')!;
  const emailError = form.querySelector<HTMLElement>('[data-email-error]')!;
  const consent = form.querySelector<HTMLInputElement>('[data-consent]')!;
  const consentError = form.querySelector<HTMLElement>('[data-consent-error]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitLabel = submit.textContent ?? '';
  let sending = false;

  // Errors: mark the field, show its message under it, announce it, and
  // put focus on it.
  const flag = (field: HTMLInputElement, message: HTMLElement, text: string) => {
    field.setAttribute('aria-invalid', 'true');
    message.textContent = text;
    message.hidden = false;
    status.textContent = text;
    field.focus();
  };
  const clear = (field: HTMLInputElement, message: HTMLElement) => {
    field.removeAttribute('aria-invalid');
    message.hidden = true;
  };

  // Open the thank-you pop-up at its top, with focus on the pop-up itself
  // so screen readers start from the greeting.
  const openThanks = () => {
    if (!done.open) done.showModal();
    done.focus({ preventScroll: true });
    done.scrollTop = 0;
  };

  /** Show the thank-you, then leave a one-line note where the form was.
      For a new signup it's personal: their name, and their idea echoed back
      (or a line for what they said they'd bring). Everything is set as
      text, never HTML. */
  const finish = (already = false) => {
    const q = <T extends HTMLElement>(root: HTMLElement, sel: string) => root.querySelector<T>(sel)!;
    q(done, '[data-done-joined]').hidden = already;
    q(done, '[data-done-already]').hidden = !already;
    done.setAttribute('aria-labelledby', already ? 'thanks-already-title' : 'thanks-joined-title');
    q(note, '[data-note-joined]').hidden = already;
    q(note, '[data-note-already]').hidden = !already;
    q(note, '[data-done-reopen]').hidden = already;
    if (!already) {
      const data = new FormData(form);
      const name = String(data.get('first_name') ?? '').trim().slice(0, LIMITS.first_name);
      const idea = String(data.get('first_challenge') ?? '').trim().slice(0, LIMITS.first_challenge);
      const interest = String(data.getAll('interests')[0] ?? '');
      q(done, '[data-thanks-name]').textContent = name ? `, ${name}` : '';
      q(note, '[data-note-name]').textContent = name ? `, ${name}` : '';
      q(done, '[data-thanks-idea-text]').textContent = idea;
      q(done, '[data-thanks-idea]').hidden = !idea;
      done.querySelectorAll<HTMLElement>('[data-thanks-interest]').forEach((line) => {
        line.hidden = Boolean(idea) || line.dataset.thanksInterest !== interest;
      });
    }
    openThanks();
    // Swapped in behind the pop-up, so the page doesn't jump in view.
    form.hidden = true;
    note.hidden = false;
  };

  done.querySelector('[data-done-close]')!.addEventListener('click', () => done.close());
  // A tap on the dimmed page around the pop-up closes it. Clicks inside
  // (the scrollbar included) land within its box and are ignored.
  done.addEventListener('click', (event) => {
    if (event.target !== done) return;
    const box = done.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) done.close();
  });
  // Escape closes it natively. However it closes, focus goes to the note.
  done.addEventListener('close', () => note.focus());
  note.querySelector('[data-done-reopen]')!.addEventListener('click', openThanks);

  const setSending = (on: boolean) => {
    sending = on;
    submit.disabled = on;
    submit.textContent = on ? COPY.joining : submitLabel;
  };

  // Any "Join the waitlist" link on this page: scroll to the form and put
  // the cursor in the email field, ready to type.
  const section = form.closest('section');
  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href$="#waitlist"]');
    if (!link || !section || new URL(link.href).pathname !== location.pathname) return;
    event.preventDefault();
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    history.pushState(null, '', '#waitlist');
    (form.hidden ? note : email).focus({ preventScroll: true });
  });

  form.addEventListener('focusin', () => void loadClient(), { once: true });
  email.addEventListener('input', () => clear(email, emailError));
  consent.addEventListener('change', () => consent.checked && clear(consent, consentError));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    status.textContent = '';

    const data = new FormData(form);
    // A bot filled the hidden field: look like it worked, store nothing.
    if (String(data.get('company') ?? '').trim()) {
      finish();
      return;
    }

    const text = (name: string) => String(data.get(name) ?? '').trim();
    const address = text('email').toLowerCase();
    if (address.length > LIMITS.email || !EMAIL.test(address)) {
      flag(email, emailError, COPY.invalidEmail);
      return;
    }
    clear(email, emailError);

    if (!consent.checked) {
      flag(consent, consentError, COPY.consent);
      return;
    }
    clear(consent, consentError);

    // The inputs' maxlength already stops this; checked again to match
    // the table exactly.
    for (const name of ['first_name', 'first_challenge'] as const) {
      if (text(name).length > LIMITS[name]) {
        status.textContent = COPY.tooLong;
        form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.focus();
        return;
      }
    }

    const row = {
      email: address,
      first_name: text('first_name') || null,
      role: text('role') || null,
      interests: data.getAll('interests').map(String),
      first_challenge: text('first_challenge') || null,
      source: trafficSource(),
      consent: true,
    };

    setSending(true);
    try {
      const supabase = await loadClient();
      // Insert only. No .select(): the public key can't read rows back.
      let query = supabase.from('waitlist').insert(row);
      if ('timeout' in AbortSignal) query = query.abortSignal(AbortSignal.timeout(TIMEOUT_MS));
      const { error } = await query;

      if (!error) {
        finish();
      } else if (error.code === '23505') {
        finish(true); // this email is already on the list
      } else if (error.code === '23514') {
        flag(email, emailError, COPY.checkFailed);
      } else {
        status.textContent = COPY.failed;
      }
    } catch {
      status.textContent = COPY.failed;
    } finally {
      setSending(false);
    }
  });
}
