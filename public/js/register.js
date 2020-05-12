const BaseUrl = 'https://chatteinthechatapp.herokuapp.com';

const formSubmitBtn = document.getElementById('formSubmitBtn');

formSubmitBtn.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('formSubmitBtn').disabled = true;
  document.getElementById(
    'formSubmitBtn'
  ).innerHTML = `<i class="fa fa-spinner fa-spin"></i>`;

  const formData = {
    username: document.getElementById('username').value,
    name: document.getElementById('name').value,
    password: document.getElementById('password').value,
  };
  const ok = validateForm(formData);
  if (!ok) {
    document.getElementById('formSubmitBtn').disabled = false;
    document.getElementById('formSubmitBtn').innerHTML = 'Submit';
    return;
  }
  const http = new XMLHttpRequest();
  const url = `${BaseUrl}/register`;
  const params = JSON.stringify(formData);
  http.open('POST', url, true);

  http.setRequestHeader('Content-type', 'application/json');
  http.onerror = function () {
    document.getElementById('formSubmitBtn').innerHTML = 'Submit';
    document.getElementById('formSubmitBtn').disabled = false;
    createAlert('Unable to reach server!', 'alert-failure');
  };
  http.onload = function () {
    const res = JSON.parse(http.responseText);
    document.getElementById('formSubmitBtn').innerHTML = 'Submit';
    if (http.status == 200 && res.success) {
      const form = document.getElementById('registerForm');
      const elements = form.elements;
      for (let i = 0, len = elements.length; i < len; ++i) {
        elements[i].readOnly = true;
      }
      createAlert(res.data.message, 'alert-success', 'login');
    } else if (http.status == 409 && res.data.case === 'username') {
      document.getElementById('formSubmitBtn').disabled = false;
      createAlert(res.data.message, 'alert-failure');
      document.getElementById('username').focus();
    } else {
      document.getElementById('formSubmitBtn').disabled = false;
      createAlert('Something went wrong!', 'alert-failure');
    }
  };
  http.send(params);
});

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

const validateForm = ({ username, name, password }) => {
  if (!username) {
    createAlert('Please enter a valid username.', 'alert-failure');
    return false;
  } else if (username.length < 4 || username.length > 12) {
    createAlert('Username length should be between 4 and 10.', 'alert-failure');
    return false;
  } else if (!name) {
    createAlert('Please enter a valid name.', 'alert-failure');
    return false;
  } else if (name.length < 4 || name.length > 20) {
    createAlert('Name length should be between 4 and 20.', 'alert-failure');
    return false;
  } else if (!password) {
    createAlert('Please enter a valid password.', 'alert-failure');
    return false;
  } else if (password.length < 6 || password.length > 20) {
    createAlert('password length should be between 6 and 10.', 'alert-failure');
    return false;
  }
  return true;
};
