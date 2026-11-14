/* ==========================================================================
   index-form.js
   Full-page contact form + success overlay for AAVANSOFT.
   - Opens from any element carrying [data-open-contact]
   - Covers the page below the sticky header, page is scroll-locked
   - Header nav links stay functional: they close the form and scroll
   - Shows a full-page success state on submit
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

  function submitForm(formEl) {
    var action = formEl.getAttribute('action');
    if (action && action !== '#' && action !== '') {
      return fetch(action, {
        method: (formEl.getAttribute('method') || 'POST').toUpperCase(),
        body: new FormData(formEl),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res;
      });
    }
    return new Promise(function (resolve) {
      window.setTimeout(resolve, 750);
    });
  }

  function showSuccess() {
    var submitBtn = form ? form.querySelector('[type="submit"]') : null;
    var note = document.getElementById('cfFormNote');
    if (form) form.reset();
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

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var honey = form.querySelector('input[name="website_url"]');
      if (honey && honey.value) { showSuccess(); return; }

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

      submitForm(form).then(showSuccess).catch(function () {
        if (note) {
          note.textContent =
            'We could not send your enquiry. Please try again or email hello@aavansoft.co.uk.';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
        }
      });
    });
  }
})();