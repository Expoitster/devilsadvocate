/**
 * Sends a waitlist signup straight to Supabase's REST API (PostgREST).
 * The key is the project's public anon/publishable key; the table only
 * accepts inserts from it, so nothing here can read the list back.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIMEOUT_MS = 15000;

const COPY = {
  invalid: 'That email looks off. Check for typos and try again.',
  failed: 'Something broke on our side, and it’s not your idea’s fault. Try again in a minute.',
};

export function initWaitlist(): void {
  const form = document.querySelector<HTMLFormElement>('[data-waitlist]');
  const done = document.querySelector<HTMLElement>('[data-done]');
  if (!form || !done) return;

  const endpoint = form.dataset.endpoint ?? '';
  const key = form.dataset.key ?? '';
  const email = form.querySelector<HTMLInputElement>('input[name="email"]')!;
  const emailError = form.querySelector<HTMLElement>('[data-email-error]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  let sending = false;

  // New-style publishable keys go in `apikey` only; legacy anon keys are
  // JWTs and also go in Authorization.
  const headers: Record<string, string> = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  const setInvalid = (invalid: boolean) => {
    email.setAttribute('aria-invalid', String(invalid));
    emailError.hidden = !invalid;
  };

  const finish = () => {
    form.hidden = true;
    done.hidden = false;
    done.focus();
  };

  const text = (name: string, max: number) => {
    const value = String(new FormData(form).get(name) ?? '').trim().slice(0, max);
    return value || null;
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

  email.addEventListener('input', () => {
    if (email.getAttribute('aria-invalid') === 'true') setInvalid(false);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    status.textContent = '';

    const data = new FormData(form);
    // A bot filled the hidden field: act as if it worked, send nothing.
    if (String(data.get('company') ?? '').trim()) {
      finish();
      return;
    }

    const address = String(data.get('email') ?? '').trim().toLowerCase();
    if (address.length > 254 || !EMAIL.test(address)) {
      setInvalid(true);
      email.focus();
      return;
    }
    setInvalid(false);

    const payload = {
      email: address,
      first_name: text('first_name', 80),
      role: data.get('role') || null,
      bring: data.getAll('bring').map(String),
      idea: text('idea', 200),
    };

    sending = true;
    submit.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: 'timeout' in AbortSignal ? AbortSignal.timeout(TIMEOUT_MS) : undefined,
      });
      // 409: this email already joined. Same outcome for the person.
      if (response.ok || response.status === 409) {
        finish();
        return;
      }
      // The database rejected the email's format (check constraint).
      if (response.status === 400) {
        const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
        if (body?.code === '23514' && body.message?.includes('email')) {
          setInvalid(true);
          email.focus();
          return;
        }
      }
      status.textContent = COPY.failed;
    } catch {
      status.textContent = COPY.failed;
    } finally {
      sending = false;
      submit.removeAttribute('aria-busy');
    }
  });
}
