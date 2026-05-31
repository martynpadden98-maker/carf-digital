/* ================================================================
   CARF.digital — script.js
   Handles: sticky header, mobile nav, floating CTA, workflow
   flip cards, form validation, scroll reveal, footer year.
   Vanilla JS only. No dependencies.
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   Utility: query helpers
---------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));


/* ----------------------------------------------------------------
   1. FOOTER YEAR
   Keeps the copyright year current automatically.
---------------------------------------------------------------- */
(function setFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ----------------------------------------------------------------
   2. WORKFLOW FLIP CARDS
   - Click a front face: flips open (only one open at a time)
   - Click the back face or close button: flips back
   CSS handles show/hide via .is-flipped and .is-returning classes.
---------------------------------------------------------------- */
(function workflowFlipCards() {
  const RETURN_DURATION = 280; // ms — matches CSS revealFront animation

  function closeStep(flipper) {
    flipper.classList.remove('is-flipped');
    flipper.classList.add('is-returning');
    var front = $('.step-front', flipper);
    if (front) front.setAttribute('aria-expanded', 'false');
    setTimeout(function () {
      flipper.classList.remove('is-returning');
    }, RETURN_DURATION);
  }

  function openStep(flipper) {
    // Close any currently open step first
    $$('.step-flipper.is-flipped').forEach(function (other) {
      other.classList.remove('is-flipped');
      var otherFront = $('.step-front', other);
      if (otherFront) otherFront.setAttribute('aria-expanded', 'false');
    });
    flipper.classList.add('is-flipped');
    var front = $('.step-front', flipper);
    if (front) front.setAttribute('aria-expanded', 'true');
  }

  $$('.step-flipper').forEach(function (flipper) {
    var front    = $('.step-front',      flipper);
    var back     = $('.step-back',       flipper);
    var closeBtn = $('.step-back-close', flipper);

    // Click front → open
    if (front) {
      front.addEventListener('click', function () {
        openStep(flipper);
      });
    }

    // Click back (anywhere) or close button → close
    if (back) {
      back.addEventListener('click', function () {
        closeStep(flipper);
      });
    }
  });
})();


/* ----------------------------------------------------------------
   3. STICKY HEADER SHADOW
   Adds a CSS class when the user scrolls down so the header
   gains a subtle shadow without changing colour or height.
---------------------------------------------------------------- */
(function stickyHeader() {
  const header = $('#site-header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ----------------------------------------------------------------
   3. FLOATING CTA VISIBILITY
   Shows the button once the user scrolls past the hero section.
   Hides it again when the contact section is in view (they're
   already there) or after the form success message is shown.
---------------------------------------------------------------- */
(function floatingCta() {
  const cta     = $('#floating-cta');
  const hero    = $('.hero');
  const contact = $('#contact');
  if (!cta || !hero || !contact) return;

  function update() {
    const heroBounds    = hero.getBoundingClientRect();
    const contactBounds = contact.getBoundingClientRect();
    const windowHeight  = window.innerHeight;

    const pastHero       = heroBounds.bottom < 80;          // hero fully scrolled past header
    const atContact      = contactBounds.top < windowHeight * 0.6; // contact section well into view

    if (pastHero && !atContact) {
      cta.classList.add('visible');
    } else {
      cta.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ----------------------------------------------------------------
   4. MOBILE NAVIGATION TOGGLE
   Toggles the mobile drawer open/closed and updates
   aria-expanded / aria-hidden accordingly.
---------------------------------------------------------------- */
(function mobileNav() {
  const toggle = $('.menu-toggle');
  const menu   = $('#mobile-menu');
  if (!toggle || !menu) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', function () {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    menu.setAttribute('aria-hidden', String(isOpen));
  });

  // Close when a nav link is clicked
  $$('a', menu).forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();


/* ----------------------------------------------------------------
   4. SMOOTH SCROLL WITH HEADER OFFSET
   Intercepts anchor link clicks and applies smooth scrolling
   while accounting for the sticky header height.
   (Supplements CSS scroll-padding-top for JS-driven clicks.)
---------------------------------------------------------------- */
(function smoothScroll() {
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const target = $(targetId);
    if (!target) return;

    e.preventDefault();

    const headerHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      10
    ) || 64;

    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({ top, behavior: 'smooth' });

    // Move focus to target for accessibility
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();


/* ----------------------------------------------------------------
   5. ADD REVEAL CLASSES + SCROLL REVEAL
   Classes must be added BEFORE the observer is set up, otherwise
   the observer queries the DOM and finds nothing to watch.
---------------------------------------------------------------- */
(function scrollReveal() {
  const VISIBLE_CLASS = 'visible';
  const THRESHOLD     = 0.12;

  // -- Step 1: stamp classes onto elements --------------------
  $$('.section-header').forEach(function (el) {
    el.classList.add('reveal');
  });

  ['.cards-grid', '.features-grid', '.audience-grid', '.trust-grid', '.timeline']
    .forEach(function (sel) {
      var el = $(sel);
      if (el) el.classList.add('reveal-stagger');
    });

  // -- Step 2: observe them -----------------------------------
  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    $$('.reveal, .reveal-stagger').forEach(function (el) {
      el.classList.add(VISIBLE_CLASS);
    });
    return;
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add(VISIBLE_CLASS);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: THRESHOLD }
  );

  $$('.reveal, .reveal-stagger').forEach(function (el) {
    observer.observe(el);
  });
})();




/* ----------------------------------------------------------------
   7. FORM VALIDATION & SUBMISSION
   Validates required fields, then POSTs to Formspree which
   forwards the submission by email.
   Endpoint: https://formspree.io/f/mpqneknr
---------------------------------------------------------------- */
(function formHandler() {
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/mpqneknr';

  const form    = $('#interest-form');
  const success = $('#form-success');
  if (!form || !success) return;

  /* -- Validation rules ---------------------------------------- */
  const rules = [
    {
      field:   'name',
      error:   'error-name',
      test:    (v) => v.trim().length >= 2,
      message: 'Please enter your full name.',
    },
    {
      field:   'company',
      error:   'error-company',
      test:    (v) => v.trim().length >= 1,
      message: 'Please enter your company name.',
    },
    {
      field:   'email',
      error:   'error-email',
      test:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: 'Please enter a valid work email address.',
    },
    {
      field:   'jurisdiction',
      error:   'error-jurisdiction',
      test:    (v) => v.trim().length >= 2,
      message: 'Please enter your jurisdiction.',
    },
    {
      field:   'business_type',
      error:   'error-type',
      test:    (v) => v !== '',
      message: 'Please select the option that best describes your business.',
    },
  ];

  /* -- Show / clear field error -------------------------------- */
  function setError(fieldEl, errorEl, message) {
    fieldEl.classList.add('error');
    fieldEl.setAttribute('aria-describedby', errorEl.id);
    errorEl.textContent = message;
  }

  function clearError(fieldEl, errorEl) {
    fieldEl.classList.remove('error');
    fieldEl.removeAttribute('aria-describedby');
    errorEl.textContent = '';
  }

  /* -- Live validation (on blur) ------------------------------ */
  rules.forEach(function (rule) {
    const fieldEl = form.elements[rule.field];
    const errorEl = $('#' + rule.error);
    if (!fieldEl || !errorEl) return;

    fieldEl.addEventListener('blur', function () {
      if (fieldEl.value !== '' && !rule.test(fieldEl.value)) {
        setError(fieldEl, errorEl, rule.message);
      } else if (rule.test(fieldEl.value)) {
        clearError(fieldEl, errorEl);
      }
    });

    fieldEl.addEventListener('input', function () {
      if (fieldEl.classList.contains('error') && rule.test(fieldEl.value)) {
        clearError(fieldEl, errorEl);
      }
    });
  });

  /* -- Submit handler ----------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let firstErrorField = null;
    let isValid = true;

    rules.forEach(function (rule) {
      const fieldEl = form.elements[rule.field];
      const errorEl = $('#' + rule.error);
      if (!fieldEl || !errorEl) return;

      if (!rule.test(fieldEl.value)) {
        setError(fieldEl, errorEl, rule.message);
        isValid = false;
        if (!firstErrorField) firstErrorField = fieldEl;
      } else {
        clearError(fieldEl, errorEl);
      }
    });

    if (!isValid) {
      // Focus the first invalid field
      if (firstErrorField) firstErrorField.focus();
      return;
    }

    /* -------------------------------------------------------
       SUBMIT TO FORMSPREE
       POSTs form data as JSON to the Formspree endpoint.
       Formspree forwards the submission by email.
    ------------------------------------------------------- */
    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    var data = {
      name:          form.elements['name'].value.trim(),
      email:         form.elements['email'].value.trim(),
      company:       form.elements['company'].value.trim(),
      role:          form.elements['role'] ? form.elements['role'].value.trim() : '',
      jurisdiction:  form.elements['jurisdiction'].value.trim(),
      business_type: form.elements['business_type'].value,
      message:       form.elements['message'] ? form.elements['message'].value.trim() : '',
    };

    fetch(FORMSPREE_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(data),
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.ok) {
        showSuccess();
      } else {
        showError('There was a problem sending your registration. Please email us directly at info@classifi.digital.');
      }
    })
    .catch(function () {
      showError('Could not send your registration. Please check your connection or email us at info@classifi.digital.');
    })
    .finally(function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send registration';
      }
    });
  });

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    success.focus();
  }

  function showError(msg) {
    var existing = $('#form-submit-error');
    if (!existing) {
      existing = document.createElement('p');
      existing.id = 'form-submit-error';
      existing.style.cssText = 'color:#f87171;font-size:0.875rem;margin-top:0.5rem;';
      var actions = form.querySelector('.form-actions');
      if (actions) actions.appendChild(existing);
    }
    existing.textContent = msg;
  }
})();


/* (Reveal class assignment merged into section 5 above) */
