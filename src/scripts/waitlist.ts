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
  const done = document.querySelector<HTMLElement>('[data-done]');
  if (!form || !done) return;

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

  const finish = (already = false) => {
    done.querySelector<HTMLElement>('[data-done-joined]')!.hidden = already;
    done.querySelector<HTMLElement>('[data-done-already]')!.hidden = !already;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  };

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
    (form.hidden ? done : email).focus({ preventScroll: true });
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
