const BaseUrl = 'https://chatteinthechatapp.herokuapp.com';
const formLoginBtn = document.getElementById('formLoginBtn');

// Send xhr request for login
formLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('formLoginBtn').disabled = true;
  document.getElementById(
    'formLoginBtn'
  ).innerHTML = `<i class="fa fa-spinner fa-spin"></i>`;

  const formData = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
  };
  const ok = validateForm(formData);
  if (!ok) {
    document.getElementById('formLoginBtn').disabled = false;
    document.getElementById('formLoginBtn').innerHTML = 'Open Inbox';
    return;
  }
  const http = new XMLHttpRequest();
  const url = `${BaseUrl}/login`;
  const params = JSON.stringify(formData);
  http.open('POST', url, true);

  http.setRequestHeader('Content-type', 'application/json');

  http.onerror = function () {
    document.getElementById('formLoginBtn').innerHTML = 'Open Inbox';
    document.getElementById('formLoginBtn').disabled = false;
    createAlert('Unable to reach server!', 'alert-failure');
  };

  http.onload = function () {
    const res = JSON.parse(http.responseText);
    document.getElementById('formLoginBtn').innerHTML = 'Open Inbox';
    if (http.status == 200) {
      document.getElementById('formLoginBtn').disabled = true;
      const form = document.getElementById('loginForm');
      const elements = form.elements;
      for (let i = 0, len = elements.length; i < len; ++i) {
        elements[i].readOnly = true;
      }
      createAlert(res.data.message, 'alert-success');
      window.location.href = '/inbox';
    } else if (http.status == 401 && res.data.case === 'username') {
      document.getElementById('formLoginBtn').disabled = false;
      createAlert(res.data.message, 'alert-failure');
      document.getElementById('username').focus();
    } else if (http.status == 401 && res.data.case === 'password') {
      document.getElementById('formLoginBtn').disabled = false;
      createAlert(res.data.message, 'alert-failure');
      document.getElementById('password').focus();
    } else {
      document.getElementById('formLoginBtn').disabled = false;
      createAlert('Something went wrong!', 'alert-failure');
    }
  };
  http.send(params);
});

// Create an alert to display the message to user
const createAlert = (message, status, action) => {
  const div = document.createElement('div');
  div.classList.add(status);
  let newHtml = `
          ${message}
  `;
  if (action === 'login') {
    newHtml += `
          <a class="alert-btn" href="/">Log In</a>
        `;
  } else {
    newHtml += `<span class="alert-btn-close" onclick="this.parentElement.style.display='none';">
        &times;
    </span>`;
  }
  div.innerHTML = newHtml;

  const alertDiv = document.getElementById('alert-div');
  alertDiv.insertBefore(div, alertDiv.childNodes[0]);
};

const validateForm = ({ username, password }) => {
  if (!username) {
    createAlert('Please enter a valid username.', 'alert-failure');
    return false;
  } else if (username.length < 4 || username.length > 12) {
    createAlert('Username length should be between 4 and 10.', 'alert-failure');
    return false;
  } else if (!password) {
    createAlert('Please enter a valid password.', 'alert-failure');
    return false;
  } else if (password.length < 6 || password.length > 20) {
    createAlert('Password length should be between 6 and 10.', 'alert-failure');
    return false;
  }
  return true;
};
