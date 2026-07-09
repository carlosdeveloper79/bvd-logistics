const form = document.getElementById("onboardingForm");
const statusEl = document.getElementById("formStatus");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const steps = Array.from(document.querySelectorAll(".step"));

const addressContainer = document.getElementById("addressContainer");
const addressTemplate = document.getElementById("addressTemplate");
const addAddressBtn = document.getElementById("addAddressBtn");
const coverageInfo = document.getElementById("coverageInfo");
const emailInput = form.querySelector("[name='email']");

const urlParams = new URLSearchParams(window.location.search);
const inviteToken = urlParams.get("invite") || "";
const STORAGE_KEY = inviteToken ? `bvd_ob_${inviteToken}` : null;

let currentStep = 1;

function setFormEnabled(enabled) {
  Array.from(form.elements).forEach((el) => {
    el.disabled = !enabled;
  });
}

// ── Progress persistence ──────────────────────────────────
function saveProgress() {
  if (!STORAGE_KEY) return;
  try {
    const fields = {};
    ["firstName", "lastName", "dob", "phone", "consentName", "consentDate"].forEach((name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) fields[name] = el.value;
    });
    fields.backgroundConsent = document.getElementById("backgroundConsent")?.checked || false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step: currentStep,
      fields,
      addresses: collectAddresses()
    }));
  } catch (_) {}
}

function restoreProgress() {
  if (!STORAGE_KEY) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { step = 1, fields = {}, addresses = [] } = JSON.parse(raw);

    // Restore simple fields
    ["firstName", "lastName", "dob", "phone", "consentName", "consentDate"].forEach((name) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el && fields[name] !== undefined) el.value = fields[name];
    });
    const consent = document.getElementById("backgroundConsent");
    if (consent && fields.backgroundConsent) consent.checked = true;

    // Restore addresses
    if (addresses.length > 0) {
      addressContainer.innerHTML = "";
      addresses.forEach((addr) => {
        createAddressCard();
        const card = getAddressCards().at(-1);
        const set = (field, val) => {
          const el = card.querySelector(`[data-field="${field}"]`);
          if (el) el.value = val || "";
        };
        set("street",      addr.street);
        set("city",        addr.city);
        set("state",       addr.state);
        set("zip",         addr.zip);
        set("moveInDate",  addr.moveInDate);
        set("moveOutDate", addr.moveOutDate);
        const currentEl = card.querySelector('[data-field="current"]');
        if (currentEl) {
          currentEl.checked = !!addr.current;
          const moveOut = card.querySelector('[data-field="moveOutDate"]');
          if (moveOut) moveOut.disabled = !!addr.current;
        }
      });
      updateCoverage();
    }

    // Restore step (go to saved step if > 1)
    if (step > 1) setStep(step);
  } catch (_) {}
}

function clearProgress() {
  if (STORAGE_KEY) try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

function showBlockedScreen(message) {
  const screen   = document.getElementById("ob-blocked-screen");
  const msgEl    = document.getElementById("ob-blocked-message");
  const wrapper  = document.querySelector(".ob-wrapper");
  const loading  = document.getElementById("ob-loading-screen");
  if (loading) loading.style.display  = "none";
  if (msgEl)   msgEl.textContent = message;
  if (wrapper) wrapper.style.display  = "none";
  if (screen)  screen.style.display   = "flex";
}

async function verifyInviteOrBlock() {
  if (!inviteToken) {
    showBlockedScreen("No onboarding link was found. Please use the unique link sent to you by Bella Vista.");
    return false;
  }

  try {
    const response = await fetch(`/api/invite/verify?token=${encodeURIComponent(inviteToken)}`);
    const payload = await response.json();

    if (!response.ok) {
      showBlockedScreen(payload.error || "This onboarding link is no longer valid.");
      setFormEnabled(false);
      return false;
    }

    // Invite valid — hide loading, show wizard
    const loading = document.getElementById("ob-loading-screen");
    const wrapper = document.querySelector(".ob-wrapper");
    if (loading) loading.style.display = "none";
    if (wrapper) wrapper.style.display = "block";

    emailInput.value = payload.email;
    emailInput.readOnly = true;
    emailInput.title = "This email is locked to your invite";
    setFormEnabled(true);
    showStatus("", false);
    return true;
  } catch (_err) {
    showBlockedScreen("Unable to verify your invite right now. Please try again or contact operations.");
    setFormEnabled(false);
    return false;
  }
}

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthsBetween(startDate, endDate) {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  let total = years * 12 + months;
  if (endDate.getDate() < startDate.getDate()) {
    total -= 1;
  }
  return Math.max(0, total);
}

function getAddressCards() {
  return Array.from(addressContainer.querySelectorAll(".address-item"));
}

function collectAddresses() {
  return getAddressCards().map((card) => {
    const get = (name) => card.querySelector(`[data-field=\"${name}\"]`);
    return {
      street: get("street").value.trim(),
      city: get("city").value.trim(),
      state: get("state").value.trim().toUpperCase(),
      zip: get("zip").value.trim(),
      moveInDate: get("moveInDate").value,
      moveOutDate: get("moveOutDate").value,
      current: get("current").checked
    };
  });
}

function updateCoverage() {
  const addresses = collectAddresses();
  const now = new Date();
  const totalMonths = addresses.reduce((sum, addr) => {
    const start = parseDate(addr.moveInDate);
    const end = addr.current ? now : parseDate(addr.moveOutDate);
    if (!start || !end || end < start) {
      return sum;
    }
    return sum + monthsBetween(start, end);
  }, 0);

  coverageInfo.textContent = `Current coverage: ${totalMonths} months`;
  coverageInfo.style.color = totalMonths >= 36 ? "#075f58" : "#9f2d22";

  return totalMonths;
}

function createAddressCard() {
  const fragment = addressTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".address-item");
  const removeBtn = card.querySelector(".remove-address");
  const currentCheckbox = card.querySelector("[data-field='current']");
  const moveOutInput = card.querySelector("[data-field='moveOutDate']");

  removeBtn.addEventListener("click", () => {
    if (getAddressCards().length > 1) {
      card.remove();
      updateCoverage();
    }
  });

  currentCheckbox.addEventListener("change", () => {
    moveOutInput.disabled = currentCheckbox.checked;
    if (currentCheckbox.checked) {
      moveOutInput.value = "";
    }
    updateCoverage();
  });

  card.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", updateCoverage);
    input.addEventListener("change", updateCoverage);
  });

  addressContainer.appendChild(fragment);
}

function setStep(stepNum) {
  currentStep = stepNum;
  steps.forEach((step) => {
    const isCurrent = Number(step.dataset.step) === stepNum;
    step.classList.toggle("is-hidden", !isCurrent);
  });

  progressLabel.textContent = `Step ${stepNum} of 5`;
  progressBar.value = (stepNum / 5) * 100;

  prevBtn.style.display = stepNum === 1 ? "none" : "inline-flex";
  nextBtn.style.display = stepNum === 5 ? "none" : "inline-flex";
  submitBtn.style.display = stepNum === 5 ? "inline-flex" : "none";

  // Update visual step indicators
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    if (!dot) continue;
    dot.classList.remove("ob-step-inactive", "ob-step-done");
    if (i < stepNum) dot.classList.add("ob-step-done");
    else if (i > stepNum) dot.classList.add("ob-step-inactive");
  }
  // Update connector lines (between dots 1-2, 2-3, 3-4)
  const lines = document.querySelectorAll(".ob-step-line");
  lines.forEach((line, idx) => {
    line.classList.toggle("ob-line-done", idx + 1 < stepNum);
  });
}

function showStatus(message, isError = true) {
  if (!message) {
    statusEl.className = "ob-alert-hidden";
    statusEl.innerHTML = "";
    return;
  }
  const icon = isError
    ? `<svg class="ob-alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg class="ob-alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  statusEl.className = `ob-alert ${isError ? "ob-alert-error" : "ob-alert-success"}`;
  statusEl.innerHTML = `${icon}<span>${message}</span>`;
  statusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function markFieldError(input, message) {
  input.classList.add("ob-input-invalid");
  if (!input.parentElement.querySelector(".ob-field-error-msg")) {
    const msg = document.createElement("span");
    msg.className = "ob-field-error-msg";
    msg.textContent = message;
    input.insertAdjacentElement("afterend", msg);
  }
  input.addEventListener("input", function clear() {
    input.classList.remove("ob-input-invalid");
    const m = input.parentElement.querySelector(".ob-field-error-msg");
    if (m) m.remove();
  }, { once: true });
}

function clearFieldErrors() {
  form.querySelectorAll(".ob-input-invalid").forEach((el) => el.classList.remove("ob-input-invalid"));
  form.querySelectorAll(".ob-field-error-msg").forEach((el) => el.remove());
  showStatus("");
}

function validateCurrentStep() {
  clearFieldErrors();
  let firstInvalid = null;

  if (currentStep === 1) {
    const FIELDS = {
      firstName: "First name is required.",
      lastName:  "Last name is required.",
      dob:       "Date of birth is required.",
      phone:     "Phone number is required.",
      email:     "Email address is required."
    };
    for (const [name, msg] of Object.entries(FIELDS)) {
      const input = form.querySelector(`[name="${name}"]`);
      if (input && !input.value.trim()) {
        markFieldError(input, msg);
        if (!firstInvalid) firstInvalid = input;
      }
    }
    if (firstInvalid) {
      showStatus("Please fill in all required fields before continuing.");
      firstInvalid.focus();
      return false;
    }
  }

  if (currentStep === 2) {
    const cards = getAddressCards();
    if (!cards.length) {
      showStatus("Please add at least one address.");
      return false;
    }
    for (const card of cards) {
      const required = [
        [card.querySelector('[data-field="street"]'),     "Street address is required."],
        [card.querySelector('[data-field="city"]'),       "City is required."],
        [card.querySelector('[data-field="state"]'),      "State is required."],
        [card.querySelector('[data-field="zip"]'),        "ZIP code is required."],
        [card.querySelector('[data-field="moveInDate"]'), "Move-in date is required."]
      ];
      for (const [input, msg] of required) {
        if (input && !input.value.trim()) {
          markFieldError(input, msg);
          if (!firstInvalid) firstInvalid = input;
        }
      }
      const isCurrent = card.querySelector('[data-field="current"]').checked;
      const moveOut   = card.querySelector('[data-field="moveOutDate"]');
      if (!isCurrent && moveOut && !moveOut.value) {
        markFieldError(moveOut, 'Enter a move-out date or check "Current address".');
        if (!firstInvalid) firstInvalid = moveOut;
      }
    }
    if (firstInvalid) {
      showStatus("Please complete all address fields.");
      firstInvalid.focus();
      return false;
    }
    if (updateCoverage() < 36) {
      showStatus("Your address history must cover at least 36 months. Add more addresses to meet this requirement.");
      return false;
    }
  }

  if (currentStep === 3) {
    const consent     = document.getElementById("backgroundConsent");
    const consentName = form.querySelector("[name='consentName']");
    const consentDate = form.querySelector("[name='consentDate']");
    let hasError = false;
    if (!consentName.value.trim()) {
      markFieldError(consentName, "Full legal name is required.");
      if (!firstInvalid) firstInvalid = consentName;
      hasError = true;
    }
    if (!consentDate.value) {
      markFieldError(consentDate, "Consent date is required.");
      hasError = true;
    }
    if (!consent.checked) {
      showStatus("You must check the consent box before continuing.");
      hasError = true;
    }
    if (hasError) {
      if (firstInvalid) firstInvalid.focus();
      return false;
    }
  }

  if (currentStep === 5) {
    const headshot = form.querySelector("[name='headshot']").files[0];
    if (!headshot) {
      showStatus("Please upload your headshot photo before submitting.");
      return false;
    }
  }

  return true;
}

addAddressBtn.addEventListener("click", () => {
  createAddressCard();
  updateCoverage();
});

prevBtn.addEventListener("click", () => {
  clearFieldErrors();
  if (currentStep > 1) {
    setStep(currentStep - 1);
    saveProgress();
  }
});

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) {
    return;
  }

  if (currentStep < 5) {
    setStep(currentStep + 1);
    saveProgress();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateCurrentStep()) {
    return;
  }

  const licenseFront = form.querySelector("[name='licenseFront']").files[0];
  const licenseBack = form.querySelector("[name='licenseBack']").files[0];
  const ssnImage = form.querySelector("[name='ssnImage']").files[0];
  const headshot = form.querySelector("[name='headshot']").files[0];

  if (!licenseFront || !licenseBack || !ssnImage || !headshot) {
    showStatus("Please upload all required document images including your headshot.");
    return;
  }

  const formData = new FormData(form);
  formData.set("addresses", JSON.stringify(collectAddresses()));
  formData.set("inviteToken", inviteToken);

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showStatus("Submitting your application...", false);

  try {
    const response = await fetch("/api/onboarding", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      showStatus(payload.error || "Submission failed.");
      return;
    }

    showStatus(`Application submitted. Reference ID: ${payload.applicationId}`, false);
    clearProgress();

    // Show success screen and hide the wizard entirely
    const successScreen = document.getElementById("ob-success-screen");
    const successRefId   = document.getElementById("ob-success-ref-id");
    if (successScreen && successRefId) {
      successRefId.textContent = payload.applicationId;
      document.querySelector(".ob-wrapper").style.display = "none";
      successScreen.style.display = "flex";
    }
  } catch (_err) {
    showStatus("Network error while submitting application.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
});

createAddressCard();
updateCoverage();
setStep(1);
setFormEnabled(false);

// Debounced auto-save on any form change
let _saveTimer;
form.addEventListener("input",  () => { clearTimeout(_saveTimer); _saveTimer = setTimeout(saveProgress, 600); });
form.addEventListener("change", () => { clearTimeout(_saveTimer); _saveTimer = setTimeout(saveProgress, 600); });

verifyInviteOrBlock().then((ok) => { if (ok) restoreProgress(); });

// ── Image upload preview ──────────────────────────────────
[
  ["ob-licenseFront", "preview-licenseFront"],
  ["ob-licenseBack",  "preview-licenseBack"],
  ["ob-ssnImage",     "preview-ssnImage"],
  ["ob-headshot",     "preview-headshot"]
].forEach(([inputId, previewId]) => {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) { preview.innerHTML = ""; return; }
    const url = URL.createObjectURL(file);
    preview.innerHTML = `
      <div class="ob-preview-card">
        <img src="${url}" alt="Preview" class="ob-preview-img" />
        <button type="button" class="ob-preview-remove" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    preview.querySelector(".ob-preview-remove").addEventListener("click", () => {
      input.value = "";
      preview.innerHTML = "";
      URL.revokeObjectURL(url);
    });
  });
});
