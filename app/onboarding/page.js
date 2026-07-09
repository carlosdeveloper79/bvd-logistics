import Script from "next/script";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <>
      <div className="ob-page">
        {/* Header */}
        <header className="ob-header">
          <span className="ob-logo-mark">BVD</span>
          <span className="ob-logo-sub">Bella Vista Dedicated Logistics LLC</span>
        </header>

        {/* Loading screen — shown while invite is being verified */}
        <div id="ob-loading-screen" className="ob-loading-screen">
          <div className="ob-loading-card">
            <div className="ob-spinner" aria-hidden="true"></div>
            <p className="ob-loading-text">Verifying your invite link…</p>
          </div>
        </div>

        <div className="ob-wrapper" style={{ display: "none" }}>
          {/* Step progress indicator */}
          <div className="ob-stepper" aria-label="Application steps">
            <div className="ob-step-item" id="step-dot-1">
              <div className="ob-step-circle">1</div>
              <span className="ob-step-label">Personal Info</span>
            </div>
            <div className="ob-step-line" aria-hidden="true"></div>
            <div className="ob-step-item ob-step-inactive" id="step-dot-2">
              <div className="ob-step-circle">2</div>
              <span className="ob-step-label">Addresses</span>
            </div>
            <div className="ob-step-line" aria-hidden="true"></div>
            <div className="ob-step-item ob-step-inactive" id="step-dot-3">
              <div className="ob-step-circle">3</div>
              <span className="ob-step-label">Consent</span>
            </div>
            <div className="ob-step-line" aria-hidden="true"></div>
            <div className="ob-step-item ob-step-inactive" id="step-dot-4">
              <div className="ob-step-circle">4</div>
              <span className="ob-step-label">Documents</span>
            </div>
            <div className="ob-step-line" aria-hidden="true"></div>
            <div className="ob-step-item ob-step-inactive" id="step-dot-5">
              <div className="ob-step-circle">5</div>
              <span className="ob-step-label">Headshot</span>
            </div>
          </div>

          {/* Hidden native progress elements (used by onboarding.js) */}
          <p id="progressLabel" aria-live="polite" className="ob-sr-only">Step 1 of 5</p>
          <progress id="progressBar" value="20" max="100" className="ob-sr-only">20%</progress>

          {/* Form card */}
          <div className="ob-card">
            <form id="onboardingForm" noValidate>

              {/* Step 1 — Personal Info */}
              <section className="step" data-step="1">
                <div className="ob-step-header">
                  <h2>Personal Information</h2>
                  <p>Tell us about yourself so we can set up your profile.</p>
                </div>
                <div className="ob-form-grid">
                  <div className="ob-field">
                    <label htmlFor="ob-firstName">First name</label>
                    <input id="ob-firstName" className="ob-input" type="text" name="firstName" placeholder="First name" required />
                  </div>
                  <div className="ob-field">
                    <label htmlFor="ob-lastName">Last name</label>
                    <input id="ob-lastName" className="ob-input" type="text" name="lastName" placeholder="Last name" required />
                  </div>
                  <div className="ob-field">
                    <label htmlFor="ob-dob">Date of birth</label>
                    <input id="ob-dob" className="ob-input" type="date" name="dob" required />
                  </div>
                  <div className="ob-field">
                    <label htmlFor="ob-phone">Phone number</label>
                    <input id="ob-phone" className="ob-input" type="tel" name="phone" placeholder="(555) 000-0000" required />
                  </div>
                  <div className="ob-field ob-field-full">
                    <label htmlFor="ob-email">Email address</label>
                    <input id="ob-email" className="ob-input" type="email" name="email" placeholder="you@example.com" required />
                    <span className="ob-field-hint">This email is locked to your invite link.</span>
                  </div>
                </div>
              </section>

              {/* Step 2 — Address History */}
              <section className="step is-hidden" data-step="2">
                <div className="ob-step-header">
                  <h2>Address History</h2>
                  <p>Provide all addresses covering at least <strong>36 months</strong> in the past 3 years.</p>
                </div>
                <div id="addressContainer" className="ob-address-list"></div>
                <button type="button" id="addAddressBtn" className="ob-add-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Another Address
                </button>
                <div className="ob-coverage-bar">
                  <p id="coverageInfo" className="ob-coverage-text">Current coverage: 0 months</p>
                  <p className="ob-coverage-hint">Required: 36 months minimum</p>
                </div>
              </section>

              {/* Step 3 — Consent */}
              <section className="step is-hidden" data-step="3">
                <div className="ob-step-header">
                  <h2>Background Check Consent</h2>
                  <p>Review and sign your consent before we can process your application.</p>
                </div>
                <div className="ob-consent-block">
                  <p>I authorize <strong>Bella Vista Dedicated Logistics LLC</strong> to perform a background investigation for employment and compliance purposes. I understand this may include criminal history, driving records, and other relevant checks.</p>
                </div>
                <label className="ob-checkbox-label">
                  <input type="checkbox" name="backgroundConsent" id="backgroundConsent" required />
                  <span className="ob-checkbox-box" aria-hidden="true"></span>
                  I consent to the background check.
                </label>
                <div className="ob-form-grid ob-mt">
                  <div className="ob-field">
                    <label htmlFor="ob-consentName">Full legal name (signature)</label>
                    <input id="ob-consentName" className="ob-input" type="text" name="consentName" placeholder="Exactly as it appears on your ID" required />
                  </div>
                  <div className="ob-field">
                    <label htmlFor="ob-consentDate">Consent date</label>
                    <input id="ob-consentDate" className="ob-input" type="date" name="consentDate" required />
                  </div>
                </div>
              </section>

              {/* Step 4 — Documents */}
              <section className="step is-hidden" data-step="4">
                <div className="ob-step-header">
                  <h2>Document Uploads</h2>
                  <p>Upload clear images of each document. JPG, PNG, or WEBP · Max 10 MB per file.</p>
                </div>
                <div className="ob-upload-stack">

                  <div className="ob-upload-row">
                    <div className="ob-upload-row-info">
                      <div className="ob-upload-row-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2M15 12h2M7 16h10"/></svg>
                      </div>
                      <div>
                        <p className="ob-upload-row-title">Driver&#39;s License <span>(front)</span></p>
                        <p className="ob-upload-row-hint">Take a photo of the front side, all 4 corners visible</p>
                      </div>
                    </div>
                    <div className="ob-upload-row-action">
                      <div className="ob-preview-wrap" id="preview-licenseFront"></div>
                      <label className="ob-upload-row-btn" htmlFor="ob-licenseFront">Choose file</label>
                      <input id="ob-licenseFront" className="ob-file-input-hidden" type="file" name="licenseFront" accept="image/*" required />
                    </div>
                  </div>

                  <div className="ob-upload-row">
                    <div className="ob-upload-row-info">
                      <div className="ob-upload-row-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M7 10h10M7 14h6"/></svg>
                      </div>
                      <div>
                        <p className="ob-upload-row-title">Driver&#39;s License <span>(back)</span></p>
                        <p className="ob-upload-row-hint">Take a photo of the back side, all 4 corners visible</p>
                      </div>
                    </div>
                    <div className="ob-upload-row-action">
                      <div className="ob-preview-wrap" id="preview-licenseBack"></div>
                      <label className="ob-upload-row-btn" htmlFor="ob-licenseBack">Choose file</label>
                      <input id="ob-licenseBack" className="ob-file-input-hidden" type="file" name="licenseBack" accept="image/*" required />
                    </div>
                  </div>

                  <div className="ob-upload-row">
                    <div className="ob-upload-row-info">
                      <div className="ob-upload-row-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                      </div>
                      <div>
                        <p className="ob-upload-row-title">Social Security Card</p>
                        <p className="ob-upload-row-hint">Clear photo of your SS card, name and number visible</p>
                      </div>
                    </div>
                    <div className="ob-upload-row-action">
                      <div className="ob-preview-wrap" id="preview-ssnImage"></div>
                      <label className="ob-upload-row-btn" htmlFor="ob-ssnImage">Choose file</label>
                      <input id="ob-ssnImage" className="ob-file-input-hidden" type="file" name="ssnImage" accept="image/*" required />
                    </div>
                  </div>

                </div>
              </section>

              {/* Step 5 — Headshot */}
              <section className="step is-hidden" data-step="5">
                <div className="ob-step-header">
                  <h2>Headshot Photo</h2>
                  <p>We need a recent, clear photo of your face for your employee profile.</p>
                </div>

                <div className="ob-headshot-guide ob-headshot-guide-single">
                  <div className="ob-headshot-example ob-headshot-good">
                    <div className="ob-headshot-icon-wrap">
                      <img
                        src="/proper-headshot.png"
                        alt="Example of a proper headshot"
                        className="ob-headshot-example-img"
                      />
                      <div className="ob-headshot-check">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                    <p className="ob-guide-title ob-guide-good">Good example</p>
                    <ul className="ob-guide-list">
                      <li>Face clearly visible</li>
                      <li>Looking at the camera</li>
                      <li>Plain or neutral background</li>
                      <li>Good lighting, no shadows</li>
                      <li>Recent photo</li>
                    </ul>
                  </div>
                </div>

                <div className="ob-upload-item ob-headshot-upload">
                  <div className="ob-upload-row">
                    <div className="ob-upload-row-info">
                      <div className="ob-upload-row-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <p className="ob-upload-row-title">Your Headshot Photo</p>
                        <p className="ob-upload-row-hint">JPG, PNG, or WEBP · Max 10 MB · Face clearly visible</p>
                      </div>
                    </div>
                    <div className="ob-upload-row-action">
                      <div className="ob-preview-wrap" id="preview-headshot"></div>
                      <label className="ob-upload-row-btn" htmlFor="ob-headshot">Choose photo</label>
                      <input id="ob-headshot" className="ob-file-input-hidden" type="file" name="headshot" accept="image/*" capture="user" required />
                    </div>
                  </div>
                </div>
              </section>

              {/* Status */}
              <div className="notification is-hidden ob-status" id="formStatus" aria-live="polite"></div>

              {/* Navigation */}
              <div className="ob-nav">
                <button type="button" id="prevBtn" className="ob-btn-back" style={{ display: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
                <div className="ob-nav-right">
                  <button type="button" id="nextBtn" className="ob-btn-next">
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button type="submit" id="submitBtn" className="ob-btn-submit" style={{ display: "none" }}>
                    Submit Application
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/*
        Address block template — React cannot render JSX children into <template>.content.
        dangerouslySetInnerHTML with plain HTML is required so the browser populates
        template.content correctly for cloneNode() in onboarding.js.
      */}
      <template id="addressTemplate" dangerouslySetInnerHTML={{ __html: `
        <div class="ob-address-card address-item">
          <div class="ob-address-header">
            <span class="ob-address-label">Address</span>
            <button type="button" class="ob-remove-btn remove-address">Remove</button>
          </div>
          <div class="ob-form-grid">
            <div class="ob-field ob-field-full">
              <label>Street address</label>
              <input class="ob-input" type="text" data-field="street" placeholder="123 Main St" required>
            </div>
            <div class="ob-field">
              <label>City</label>
              <input class="ob-input" type="text" data-field="city" placeholder="City" required>
            </div>
            <div class="ob-field">
              <label>State</label>
              <div class="ob-select-wrap">
                <select class="ob-select" data-field="state" required>
                  <option value="">Select state</option>
                  <option value="AL">Alabama</option><option value="AK">Alaska</option><option value="AZ">Arizona</option><option value="AR">Arkansas</option><option value="CA">California</option><option value="CO">Colorado</option><option value="CT">Connecticut</option><option value="DE">Delaware</option><option value="FL">Florida</option><option value="GA">Georgia</option><option value="HI">Hawaii</option><option value="ID">Idaho</option><option value="IL">Illinois</option><option value="IN">Indiana</option><option value="IA">Iowa</option><option value="KS">Kansas</option><option value="KY">Kentucky</option><option value="LA">Louisiana</option><option value="ME">Maine</option><option value="MD">Maryland</option><option value="MA">Massachusetts</option><option value="MI">Michigan</option><option value="MN">Minnesota</option><option value="MS">Mississippi</option><option value="MO">Missouri</option><option value="MT">Montana</option><option value="NE">Nebraska</option><option value="NV">Nevada</option><option value="NH">New Hampshire</option><option value="NJ">New Jersey</option><option value="NM">New Mexico</option><option value="NY">New York</option><option value="NC">North Carolina</option><option value="ND">North Dakota</option><option value="OH">Ohio</option><option value="OK">Oklahoma</option><option value="OR">Oregon</option><option value="PA">Pennsylvania</option><option value="RI">Rhode Island</option><option value="SC">South Carolina</option><option value="SD">South Dakota</option><option value="TN">Tennessee</option><option value="TX">Texas</option><option value="UT">Utah</option><option value="VT">Vermont</option><option value="VA">Virginia</option><option value="WA">Washington</option><option value="WV">West Virginia</option><option value="WI">Wisconsin</option><option value="WY">Wyoming</option>
                </select>
              </div>
            </div>
            <div class="ob-field">
              <label>ZIP code</label>
              <input class="ob-input" type="text" data-field="zip" placeholder="00000" required>
            </div>
            <div class="ob-field">
              <label>Move-in date</label>
              <input class="ob-input" type="date" data-field="moveInDate" required>
            </div>
            <div class="ob-field">
              <label>Move-out date</label>
              <input class="ob-input" type="date" data-field="moveOutDate">
            </div>
            <div class="ob-field ob-field-full">
              <label class="ob-checkbox-label">
                <input type="checkbox" data-field="current">
                <span class="ob-checkbox-box" aria-hidden="true"></span>
                This is my current address
              </label>
            </div>
          </div>
        </div>
      ` }} />

      <Script src="/onboarding.js" strategy="afterInteractive" />

      {/* ── Blocked screen – shown when invite is invalid, used, or expired ── */}
      <div id="ob-blocked-screen" className="ob-success-screen" style={{ display: "none" }}>
        <div className="ob-success-card">
          <div className="ob-success-icon ob-blocked-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="ob-success-title">Link No Longer Valid</h2>
          <p className="ob-blocked-body" id="ob-blocked-message">This onboarding link is no longer valid.</p>
          <div className="ob-blocked-contact">
            <p>If you believe this is an error, please contact operations:</p>
            <a href="mailto:operations@bvdlogistics.com" className="ob-blocked-email">operations@bvdlogistics.com</a>
          </div>
        </div>
      </div>

      {/* ── Success screen – hidden until application is submitted ── */}
      <div id="ob-success-screen" className="ob-success-screen" style={{ display: "none" }}>
        <div className="ob-success-card">
          <div className="ob-success-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <h2 className="ob-success-title">Application Submitted!</h2>
          <p className="ob-success-body">Your application has been received. A team member will review it and reach out to you.</p>
          <div className="ob-success-ref">
            <span className="ob-success-ref-label">Reference ID</span>
            <span id="ob-success-ref-id" className="ob-success-ref-value"></span>
          </div>
          <p className="ob-success-note">Save your reference ID — you may need it if you contact us about your application.</p>
        </div>
      </div>
    </>
  );
}
