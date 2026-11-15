/* ==========================================================================
   index-form.js
   Full-page contact form + success overlay for AAVANSOFT.
   - Opens from any element carrying [data-open-contact]
   - Covers the page below the sticky header, page is scroll-locked
   - Header nav links stay functional: they close the form and scroll
   - Shows a full-page success state on submit
   - Shows field-level errors returned by the Worker (field key)
   - Shows form-level errors for 4xx / 5xx / network failures
   ========================================================================== */
(function () {
  'use strict';

  var overlay = document.getElementById('contactFormOverlay');
  if (!overlay) return;

  var success = document.getElementById('contactSuccessOverlay');
  var form    = document.getElementById('cf-form');
  var nav     = document.getElementById('primary-nav');
  var body    = document.body;

  var FOCUSABLE =
    'a[href], button:not([disabled]), ' +
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), ' +
    'textarea:not([disabled]), select:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  var lastTrigger = null;

  /* ======================================================================
     Mobile menu helper
     ====================================================================== */
  function closeMobileMenu() {
    if (!nav || !nav.classList.contains('is-open')) return;
    var toggle = document.querySelector('.menu-toggle');
    nav.classList.remove('is-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = 'Menu <span aria-hidden="true">+</span>';
    }
  }

  function isOpen() {
    return overlay.classList.contains('is-open') ||
           (success && success.classList.contains('is-open'));
  }

  /* ======================================================================
     Focus trap
     ====================================================================== */
  function trapFocus(container) {
    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var nodes = container.querySelectorAll(FOCUSABLE);
      if (!nodes.length) return;
      var first = nodes[0];
      var last  = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ======================================================================
     Open / close overlay
     ====================================================================== */
  function openOverlay(trigger) {
    closeMobileMenu();
    lastTrigger = trigger || null;
    if (success) {
      success.classList.remove('is-open');
      success.setAttribute('aria-hidden', 'true');
    }
    body.classList.add('cf-locked');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');

    clearErrors();

    var focusTarget =
      overlay.querySelector('input:not([tabindex="-1"]), textarea, select') ||
      overlay.querySelector('button');
    if (focusTarget) {
      window.setTimeout(function () {
        focusTarget.focus({ preventScroll: true });
      }, 80);
    }
  }

  function closeOverlay() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (success) {
      success.classList.remove('is-open');
      success.setAttribute('aria-hidden', 'true');
    }
    body.classList.remove('cf-locked');
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus({ preventScroll: true });
    }
    lastTrigger = null;
  }

  /* ======================================================================
     Field-level error display
     ====================================================================== */
  function clearErrors() {
    if (!form) return;
    form.querySelectorAll('[data-field-error]').forEach(function (el) {
      el.textContent = '';
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
    var note = document.getElementById('cfFormNote');
    if (note) note.textContent = '';
  }

  function showFieldError(fieldName, message) {
    if (!form) return false;
    var input = form.querySelector('[name="' + fieldName + '"]');
    if (!input) return false;

    var errorEl = input.parentElement.querySelector('[data-field-error]');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.setAttribute('data-field-error', '');
      errorEl.setAttribute('role', 'alert');
      errorEl.className = 'contact-form__error';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    try { input.focus({ preventScroll: false }); } catch (_) { input.focus(); }
    return true;
  }

  /* ======================================================================
     Submit handlers
     ====================================================================== */
  document.querySelectorAll('[data-open-contact]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openOverlay(el);
    });
  });

  document.querySelectorAll('[data-close-contact]').forEach(function (btn) {
    btn.addEventListener('click', closeOverlay);
  });

  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === overlay) closeOverlay();
  });
  if (success) {
    success.addEventListener('pointerdown', function (e) {
      if (e.target === success) closeOverlay();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeOverlay();
  });

  trapFocus(overlay);
  if (success) trapFocus(success);

  /* In-page anchor links from the header should close the overlay first */
  document
    .querySelectorAll('.site-header a[href^="#"]:not([data-open-contact])')
    .forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!isOpen()) return;
        e.preventDefault();
        var hash = a.getAttribute('href');
        closeOverlay();
        window.setTimeout(function () {
          var target = hash && hash.length > 1 ? document.querySelector(hash) : null;
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          if (hash && hash.length > 1 && history.replaceState) {
            history.replaceState(null, '', hash);
          }
        }, 20);
      });
    });

  /* ======================================================================
     Submit form to Worker; return parsed JSON or throw {message, field, status}
     ====================================================================== */
  function submitForm(formEl) {
    var action = formEl.getAttribute('action');
    if (action && action !== '#' && action !== '') {
      return fetch(action, {
        method: (formEl.getAttribute('method') || 'POST').toUpperCase(),
        body: new FormData(formEl),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        return res
          .json()
          .catch(function () { return {}; })
          .then(function (data) {
            if (!res.ok) {
              var err = new Error(
                data.error || 'Something went wrong. Please try again.'
              );
              err.field = data.field;
              err.status = res.status;
              throw err;
            }
            return data;
          });
      });
    }
    /* No action configured — simulate for preview environments */
    return new Promise(function (resolve) {
      window.setTimeout(resolve, 750);
    });
  }

  /* ======================================================================
     Success state
     ====================================================================== */
  function showSuccess() {
    var submitBtn = form ? form.querySelector('[type="submit"]') : null;
    var note = document.getElementById('cfFormNote');
    if (form) form.reset();
    clearErrors();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }
    if (note) note.textContent = '';
    if (success) {
      success.classList.add('is-open');
      success.setAttribute('aria-hidden', 'false');
      var btn = success.querySelector('[data-close-contact]');
      if (btn) {
        window.setTimeout(function () {
          btn.focus({ preventScroll: true });
        }, 80);
      }
    } else {
      closeOverlay();
    }
  }

  /* ======================================================================
     Error state
     ====================================================================== */
  function showError(err) {
    var note = document.getElementById('cfFormNote');
    var submitBtn = form ? form.querySelector('[type="submit"]') : null;

    var message = err && err.message
      ? err.message
      : 'Something went wrong. Please try again.';

    /* Field-level → inline under the offending input */
    if (err && err.field && showFieldError(err.field, message)) {
      if (note) note.textContent = '';
    } else if (note) {
      /* Form-level fallback, refined by status */
      if (err && err.status === 429) {
        note.textContent = 'Too many attempts. Please wait a minute and try again.';
      } else if (err && err.status >= 500) {
        note.textContent =
          "We couldn't save your enquiry. Please try again in a moment, or email info@aavansoft.co.uk directly.";
      } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        note.textContent =
          'You appear to be offline. Please check your connection and try again.';
      } else {
        note.textContent = message;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }
  }

  /* ======================================================================
     Form submit
     ====================================================================== */
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      /* Honeypot — if filled, treat as success but silently drop */
      var honey = form.querySelector('input[name="website_url"]');
      if (honey && honey.value) { showSuccess(); return; }

      /* Native HTML5 validation first (required, type=email etc.) */
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      var note = document.getElementById('cfFormNote');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
      }
      if (note) note.textContent = 'Sending your enquiry…';

      submitForm(form)
        .then(showSuccess)
        .catch(showError);
    });
  }
})();