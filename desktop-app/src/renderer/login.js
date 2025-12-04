const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const loginSpinner = document.getElementById('login-spinner');
const errorMessage = document.getElementById('error-message');
const registerBtn = document.getElementById('register-btn');

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }

  // Disable form
  loginBtn.disabled = true;
  loginText.style.display = 'none';
  loginSpinner.style.display = 'block';
  errorMessage.classList.remove('show');

  try {
    const result = await window.electron.login({ email, password });

    if (result.success) {
      // Notify main process to open main window
      window.electron.loginSuccess();
    } else {
      showError(result.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    showError('Connection error. Make sure the backend server is running.');
  } finally {
    loginBtn.disabled = false;
    loginText.style.display = 'block';
    loginSpinner.style.display = 'none';
  }
});

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

// Handle registration button
registerBtn.addEventListener('click', () => {
  window.electron.openRegistration();
});

// Clear error on input
emailInput.addEventListener('input', () => {
  errorMessage.classList.remove('show');
});

passwordInput.addEventListener('input', () => {
  errorMessage.classList.remove('show');
});
