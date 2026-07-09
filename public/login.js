const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const TOKEN_KEY = "bvd_admin_token";

function setStatus(message, isError = true) {
  if (!message) {
    loginStatus.textContent = "";
    loginStatus.className = "notification is-hidden mt-4";
    return;
  }
  loginStatus.textContent = message;
  loginStatus.className = `notification mt-4 ${isError ? "is-danger" : "is-success"}`;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    setStatus("Email and password are required.");
    return;
  }

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Login failed.");
      return;
    }

    localStorage.setItem(TOKEN_KEY, payload.token);
    setStatus("Login successful. Redirecting...", false);
    window.location.href = "/admin";
  } catch (_err) {
    setStatus("Unable to login right now. Try again.");
  }
});
