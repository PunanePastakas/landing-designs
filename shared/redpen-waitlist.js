/* ── PunanePastakas waitlist submit handler ─────────────────────────────
   Wires the "Liitu ootenimekirjaga" form to a Supabase `waitlist` table via
   an anonymous INSERT. No dependencies beyond @supabase/supabase-js (loaded
   from CDN) and window.REDPEN_CONFIG (shared/redpen-config.js).

   Security model: the anon key is public; safety comes entirely from the
   INSERT-only Row Level Security policy in supabase/waitlist.sql. This script
   never reads the list back and never holds a privileged key. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // ET / EN copy, picked from <html lang> at submit time so it follows the toggle.
  var COPY = {
    sending:   { et: 'Saadan…',                                            en: 'Sending…' },
    success:   { et: 'Aitäh! Lisasime su ootenimekirja.',                  en: "Thanks! You're on the waitlist." },
    duplicate: { et: 'Oled juba nimekirjas — aitäh!',                      en: "You're already on the list — thanks!" },
    error:     { et: 'Midagi läks valesti. Proovi hetke pärast uuesti.',   en: 'Something went wrong. Please try again shortly.' },
    offline:   { et: 'Vorm pole veel ühendatud. Proovi varsti uuesti.',    en: "The form isn't connected yet. Please try again soon." },
  };

  function t(key) {
    var lang = document.documentElement.lang === 'en' ? 'en' : 'et';
    return (COPY[key] && COPY[key][lang]) || COPY[key].et;
  }

  function isConfigured(cfg) {
    return cfg &&
      typeof cfg.SUPABASE_URL === 'string' &&
      typeof cfg.SUPABASE_ANON_KEY === 'string' &&
      cfg.SUPABASE_URL.indexOf('http') === 0 &&
      cfg.SUPABASE_URL.indexOf('__') === -1 &&
      cfg.SUPABASE_ANON_KEY.indexOf('__') === -1;
  }

  ready(function () {
    var form = document.getElementById('waitlist-form');
    if (!form) return;

    var statusEl = document.getElementById('waitlist-status');
    var submitBtn = document.getElementById('waitlist-submit');
    var emailEl = document.getElementById('email');
    var honeypotEl = document.getElementById('company');

    // Remember which message is showing (by key) so it can be re-rendered in
    // the other language when the visitor flips the ET/EN toggle.
    var currentStatus = null; // { key, kind } or null when nothing is shown

    function renderStatus() {
      if (!statusEl) return;
      statusEl.textContent = currentStatus ? t(currentStatus.key) : '';
      var kind = currentStatus && currentStatus.kind;
      // success → brand green, error → correction red, neutral → muted
      statusEl.style.color =
        kind === 'success' ? 'var(--rp-primary-strong)' :
        kind === 'error'   ? 'var(--rp-correction)' :
                             'var(--rp-muted)';
    }

    function setStatus(key, kind) {
      currentStatus = key ? { key: key, kind: kind } : null;
      renderStatus();
    }

    // When the language toggle rewrites <html lang>, re-render the current
    // message so the confirmation always matches the language on screen.
    if (window.MutationObserver) {
      new MutationObserver(renderStatus).observe(document.documentElement, {
        attributes: true, attributeFilter: ['lang'],
      });
    }

    var cfg = window.REDPEN_CONFIG;
    var client = null;
    if (isConfigured(cfg) && window.supabase && window.supabase.createClient) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    } else {
      // Don't break the page; just log for whoever is wiring the keys.
      console.warn('[redpen-waitlist] Supabase not configured yet — fill in shared/redpen-config.js. Form submit will show a friendly notice.');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Bot trap: a filled honeypot means a script, not a teacher. Pretend success.
      if (honeypotEl && honeypotEl.value.trim() !== '') {
        setStatus('success', 'success');
        form.reset();
        return;
      }

      var email = (emailEl && emailEl.value || '').trim();
      if (!email) { setStatus('error', 'error'); return; }

      if (!client) {
        setStatus('offline', 'error');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus('sending', 'neutral');

      // NOTE: no .select() — anon has no read policy, so chaining a read errors.
      client.from('waitlist').insert({
        email: email,
        source: 'landing-root',
        locale: document.documentElement.lang === 'en' ? 'en' : 'et',
        consent: true, // implied: submitted after seeing the visible privacy notice
      }).then(function (res) {
        if (submitBtn) submitBtn.disabled = false;
        if (res && res.error) {
          if (res.error.code === '23505') {     // unique_violation = already signed up
            setStatus('duplicate', 'success');
            form.reset();
          } else {
            console.error('[redpen-waitlist] insert failed:', res.error);
            setStatus('error', 'error');
          }
        } else {
          setStatus('success', 'success');
          form.reset();
        }
      }, function (err) {
        if (submitBtn) submitBtn.disabled = false;
        console.error('[redpen-waitlist] network error:', err);
        setStatus('error', 'error');
      });
    });
  });
})();
