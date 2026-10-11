/* ==========================================================================
   ApexBudget — Auth Logic (auth.js)
   All authentication is localStorage-based (client-side only).
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------------
     Constants
  ------------------------------------------------------------------- */
  const USERS_KEY      = 'apexbudget_users';
  const SESSION_KEY    = 'apexbudget_session';
  const REMEMBER_KEY   = 'apexbudget_remember';
  const THEME_KEY      = 'apexbudget_theme';
  const APP_PAGE       = 'index.html';

  /* -------------------------------------------------------------------
     Redirect if already logged in
  ------------------------------------------------------------------- */
  (function checkSession() {
    const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY);
    if (session) {
      try {
        const s = JSON.parse(session);
        if (s && s.email) {
          window.location.href = APP_PAGE;
        }
      } catch (_) {}
    }
  })();

  /* -------------------------------------------------------------------
     DOM refs
  ------------------------------------------------------------------- */
  const $ = id => document.getElementById(id);

  const signinTab     = $('signin-tab');
  const signupTab     = $('signup-tab');
  const tabIndicator  = $('tab-indicator');
  const signinView    = $('signin-view');
  const signupView    = $('signup-view');
  const authCard      = $('auth-card');

  // Sign In
  const signinForm      = $('signin-form');
  const signinEmail     = $('signin-email');
  const signinPassword  = $('signin-password');
  const signinEmailErr  = $('signin-email-err');
  const signinPassErr   = $('signin-password-err');
  const signinError     = $('signin-error');
  const signinErrorMsg  = $('signin-error-msg');
  const signinBtn       = $('signin-btn');
  const signinBtnText   = $('signin-btn-text');
  const signinSpinner   = $('signin-spinner');
  const rememberMe      = $('remember-me');
  const forgotBtn       = $('forgot-btn');
  const guestBtn        = $('guest-btn');
  const goSignup        = $('go-signup');

  // Sign Up
  const signupForm      = $('signup-form');
  const signupName      = $('signup-name');
  const signupEmail     = $('signup-email');
  const signupPassword  = $('signup-password');
  const signupConfirm   = $('signup-confirm');
  const signupNameErr   = $('signup-name-err');
  const signupEmailErr  = $('signup-email-err');
  const signupPassErr   = $('signup-password-err');
  const signupConfirmErr = $('signup-confirm-err');
  const signupError     = $('signup-error');
  const signupErrorMsg  = $('signup-error-msg');
  const signupBtn       = $('signup-btn');
  const signupBtnText   = $('signup-btn-text');
  const signupSpinner   = $('signup-spinner');
  const termsCheck      = $('terms-check');
  const goSignin        = $('go-signin');
  const strengthFill    = $('strength-fill');
  const strengthLabel   = $('strength-label');

  // Theme
  const themeToggle   = $('theme-toggle');
  const sunIcon       = $('sun-icon');
  const moonIcon      = $('moon-icon');

  /* -------------------------------------------------------------------
     Theme Management
  ------------------------------------------------------------------- */
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);
  }

  themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  initTheme();

  /* -------------------------------------------------------------------
     Tab Switching
  ------------------------------------------------------------------- */
  function switchTab(to) {
    if (to === 'signin') {
      signinTab.classList.add('active');
      signupTab.classList.remove('active');
      signinTab.setAttribute('aria-selected', 'true');
      signupTab.setAttribute('aria-selected', 'false');
      tabIndicator.classList.remove('right');
      signinView.classList.add('active');
      signupView.classList.remove('active');
    } else {
      signupTab.classList.add('active');
      signinTab.classList.remove('active');
      signupTab.setAttribute('aria-selected', 'true');
      signinTab.setAttribute('aria-selected', 'false');
      tabIndicator.classList.add('right');
      signupView.classList.add('active');
      signinView.classList.remove('active');
    }
    clearErrors();
  }

  signinTab.addEventListener('click', () => switchTab('signin'));
  signupTab.addEventListener('click', () => switchTab('signup'));
  goSignup.addEventListener('click', () => switchTab('signup'));
  goSignin.addEventListener('click', () => switchTab('signin'));

  /* -------------------------------------------------------------------
     Eye (Show/Hide Password) buttons
  ------------------------------------------------------------------- */
  document.querySelectorAll('.eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      const showEye = btn.querySelector('.show-eye');
      const hideEye = btn.querySelector('.hide-eye');
      if (target.type === 'password') {
        target.type = 'text';
        showEye.classList.add('hidden');
        hideEye.classList.remove('hidden');
      } else {
        target.type = 'password';
        showEye.classList.remove('hidden');
        hideEye.classList.add('hidden');
      }
    });
  });

  /* -------------------------------------------------------------------
     Password Strength Meter
  ------------------------------------------------------------------- */
  function calcStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
  }

  signupPassword.addEventListener('input', () => {
    const pw = signupPassword.value;
    const score = calcStrength(pw);
    let cls = '', lbl = '';
    if (!pw) { cls = ''; lbl = 'Strength'; }
    else if (score <= 1) { cls = 'weak'; lbl = 'Weak'; }
    else if (score <= 2) { cls = 'fair'; lbl = 'Fair'; }
    else if (score <= 3) { cls = 'good'; lbl = 'Good'; }
    else                 { cls = 'strong'; lbl = 'Strong'; }

    strengthFill.className = 'strength-fill ' + cls;
    strengthLabel.className = 'strength-label ' + cls;
    strengthLabel.textContent = lbl;
  });

  /* -------------------------------------------------------------------
     User Storage Helpers (localStorage)
  ------------------------------------------------------------------- */
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Naive hash — NOT cryptographically secure, just obfuscates the string
  function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (hash >>> 0).toString(36);
  }

  function createSession(user, remember) {
    const payload = JSON.stringify({ email: user.email, name: user.name, ts: Date.now() });
    sessionStorage.setItem(SESSION_KEY, payload);
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, payload);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }

  /* -------------------------------------------------------------------
     Validation helpers
  ------------------------------------------------------------------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function showError(el, errEl) {
    el.classList.add('error');
    if (errEl) errEl.classList.remove('hidden');
  }
  function clearFieldError(el, errEl) {
    el.classList.remove('error');
    if (errEl) errEl.classList.add('hidden');
  }
  function clearErrors() {
    [signinEmail, signinPassword].forEach(el => el.classList.remove('error', 'success'));
    [signinEmailErr, signinPassErr].forEach(el => el && el.classList.add('hidden'));
    signinError.classList.add('hidden');

    [signupName, signupEmail, signupPassword, signupConfirm].forEach(el => el.classList.remove('error', 'success'));
    [signupNameErr, signupEmailErr, signupPassErr, signupConfirmErr].forEach(el => el && el.classList.add('hidden'));
    signupError.classList.add('hidden');
  }

  function setLoading(btn, textEl, spinner, loading) {
    btn.disabled = loading;
    if (loading) {
      textEl.classList.add('hidden');
      spinner.classList.remove('hidden');
    } else {
      textEl.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  /* -------------------------------------------------------------------
     Sign In
  ------------------------------------------------------------------- */
  signinForm.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    clearErrors();

    const email = signinEmail.value.trim();
    const password = signinPassword.value;

    if (!isValidEmail(email)) {
      showError(signinEmail, signinEmailErr);
      valid = false;
    }
    if (!password) {
      showError(signinPassword, signinPassErr);
      valid = false;
    }
    if (!valid) return;

    setLoading(signinBtn, signinBtnText, signinSpinner, true);

    // Simulate async authentication (slight delay for UX realism)
    await delay(700);

    const users = getUsers();
    const user  = users[email.toLowerCase()];
    const hash  = simpleHash(password);

    if (!user || user.passwordHash !== hash) {
      signinErrorMsg.textContent = 'Invalid email or password. Please try again.';
      signinError.classList.remove('hidden');
      signinEmail.classList.add('error');
      signinPassword.classList.add('error');
      setLoading(signinBtn, signinBtnText, signinSpinner, false);
      return;
    }

    // Success
    authCard.classList.add('success-flash');
    createSession(user, rememberMe.checked);

    await delay(400);
    window.location.href = APP_PAGE;
  });

  /* -------------------------------------------------------------------
     Sign Up
  ------------------------------------------------------------------- */
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;

    [signupName, signupEmail, signupPassword, signupConfirm].forEach(el => el.classList.remove('error', 'success'));
    [signupNameErr, signupEmailErr, signupPassErr, signupConfirmErr].forEach(el => el && el.classList.add('hidden'));
    signupError.classList.add('hidden');

    const name     = signupName.value.trim();
    const email    = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirm  = signupConfirm.value;

    if (name.length < 2) {
      showError(signupName, signupNameErr);
      valid = false;
    }
    if (!isValidEmail(email)) {
      showError(signupEmail, signupEmailErr);
      valid = false;
    }
    if (password.length < 8) {
      showError(signupPassword, signupPassErr);
      valid = false;
    }
    if (password !== confirm) {
      showError(signupConfirm, signupConfirmErr);
      valid = false;
    }
    if (!termsCheck.checked) {
      signupErrorMsg.textContent = 'Please accept the terms to continue.';
      signupError.classList.remove('hidden');
      valid = false;
    }
    if (!valid) return;

    setLoading(signupBtn, signupBtnText, signupSpinner, true);
    await delay(700);

    const users = getUsers();
    const key   = email.toLowerCase();

    if (users[key]) {
      signupErrorMsg.textContent = 'An account with this email already exists.';
      signupError.classList.remove('hidden');
      showError(signupEmail, null);
      setLoading(signupBtn, signupBtnText, signupSpinner, false);
      return;
    }

    // Create user
    users[key] = {
      email: email.toLowerCase(),
      name,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);

    authCard.classList.add('success-flash');
    createSession(users[key], false);

    await delay(400);
    window.location.href = APP_PAGE;
  });

  /* -------------------------------------------------------------------
     Guest Mode
  ------------------------------------------------------------------- */
  guestBtn.addEventListener('click', () => {
    const guestSession = JSON.stringify({ email: 'guest@local', name: 'Guest', ts: Date.now(), isGuest: true });
    sessionStorage.setItem(SESSION_KEY, guestSession);
    window.location.href = APP_PAGE;
  });

  /* -------------------------------------------------------------------
     Forgot Password (informational toast — no backend)
  ------------------------------------------------------------------- */
  forgotBtn.addEventListener('click', () => {
    signinErrorMsg.textContent = 'Password recovery is not available (local-only app). Check your browsers saved passwords or create a new account.';
    signinError.classList.remove('hidden');
    signinError.style.background = 'rgba(245, 158, 11, 0.1)';
    signinError.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    signinError.style.color = '#fbbf24';
  });

  /* -------------------------------------------------------------------
     Real-time input validation (live feedback)
  ------------------------------------------------------------------- */
  signinEmail.addEventListener('blur', () => {
    if (signinEmail.value && !isValidEmail(signinEmail.value)) {
      showError(signinEmail, signinEmailErr);
    } else {
      clearFieldError(signinEmail, signinEmailErr);
    }
  });

  signupName.addEventListener('blur', () => {
    if (signupName.value.length > 0 && signupName.value.trim().length < 2) {
      showError(signupName, signupNameErr);
    } else {
      clearFieldError(signupName, signupNameErr);
    }
  });

  signupEmail.addEventListener('blur', () => {
    if (signupEmail.value && !isValidEmail(signupEmail.value)) {
      showError(signupEmail, signupEmailErr);
    } else {
      clearFieldError(signupEmail, signupEmailErr);
    }
  });

  signupConfirm.addEventListener('input', () => {
    if (signupConfirm.value && signupPassword.value !== signupConfirm.value) {
      showError(signupConfirm, signupConfirmErr);
    } else {
      clearFieldError(signupConfirm, signupConfirmErr);
      if (signupConfirm.value) signupConfirm.classList.add('success');
    }
  });

  /* -------------------------------------------------------------------
     Utility
  ------------------------------------------------------------------- */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

})();
