import Script from "next/script";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <section className="hero is-fullheight is-light">
      <div className="hero-body">
        <div className="container" style={{ maxWidth: "560px" }}>
          <div className="box">
            <h1 className="title is-3">Admin Login</h1>
            <p className="subtitle is-6">Use your admin credentials to access the operations dashboard.</p>

            <form id="loginForm">
              <div className="field">
                <label className="label">Email</label>
                <div className="control">
                  <input className="input" type="email" name="email" required />
                </div>
              </div>
              <div className="field">
                <label className="label">Password</label>
                <div className="control">
                  <input className="input" type="password" name="password" required />
                </div>
              </div>
              <div className="field mt-5">
                <button type="submit" className="button is-primary is-fullwidth">Sign In</button>
              </div>
            </form>

            <div id="loginStatus" className="notification is-hidden mt-4" aria-live="polite"></div>
          </div>
        </div>
      </div>
      <Script src="/login.js" strategy="afterInteractive" />
    </section>
  );
}
