const loader = document.getElementById('cover-spin');
const messageField = document.getElementById('message-field');

// Display preloader till we load sidebar info
loader.style.display = 'block';
let currentUserData;

window.onload = function () {
  const socket = io({ transports: ['websocket'], upgrade: false });
  const messageDiv = document.getElementById('messages');

  if (socket !== undefined) {
    console.log('Connected to server...');
  }

  // Access sidebar info which has viewer,user and conversations
  socket.on('sidebarInfo', (data) => {
    console.log('sidebar info   ', data);
    currentUserData = data.viewer;
    const usersDiv = document.getElementById('users');
    const convsDiv = document.getElementById('conversations');
    document.getElementById('curr-username-welcome').innerText =
      data.viewer.name;

    if (data.users.length == 0) {
      const newDiv = document.createElement('div');
      newDiv.classList.add('sidebar-title');
      newDiv.classList.add('center-text');
      newDiv.innerHTML = 'You are alone here';
      usersDiv.appendChild(newDiv);
    }
    if (data.conversations.length === 0) {
      const newDiv = document.createElement('div');
      newDiv.classList.add('sidebar-title');
      newDiv.classList.add('center-text');
      newDiv.id = 'qwe34';
      newDiv.innerHTML = 'Start chatting now';
      convsDiv.appendChild(newDiv);
    }

    let skipUsers = [];
    data.conversations.forEach((e) => {
      let target = e.users.find((x) => x.uid._id != data.viewer.id);
      skipUsers.push(target.uid._id);
      const newDiv = document.createElement('div');
      newDiv.classList.add('sidebar-option');
      newDiv.classList.add('offline');
      newDiv.innerHTML = `${target.uid.username}  <span>🟢</span>`;
      newDiv.id = target.uid._id;
      newDiv.addEventListener('click', (event) => {
        setActive({
          id: target.uid._id,
          username: target.uid.username,
          cid: e.id,
        });
      });
      convsDiv.insertBefore(newDiv, convsDiv.childNodes[0]);
    });

    data.users.forEach((e) => {
      if (!skipUsers.includes(e._id)) {
        const newDiv = document.createElement('div');
        newDiv.classList.add('sidebar-option');
        newDiv.classList.add('offline');
        newDiv.innerHTML = `${e.username}  <span>🟢</span>`;
        newDiv.id = e._id;
        newDiv.onclick = createNewConv;
        usersDiv.appendChild(newDiv);
      }
    });

    // Start new conversation with User
    function createNewConv(data) {
      socket.emit('newConv', { username: data.srcElement.innerText });
    }

    // New conversation response from the server
    socket.on('newConRes', (data) => {
      // Resolve failure here
      const firstMessage = document.getElementById('qwe34');
      if (firstMessage) {
        firstMessage.remove();
      }
      document.getElementById(data.for.id).remove();
      const newDiv = document.createElement('div');
      newDiv.classList.add('sidebar-option');
      newDiv.classList.add('offline');
      newDiv.innerHTML = `${data.for.username}  <span>🟢</span>`;
      newDiv.id = data.for.id;
      newDiv.addEventListener('click', (e) => {
        setActive({
          id: data.for.id,
          username: data.for.username,
          cid: data.cid,
        });
      });
      convsDiv.insertBefore(newDiv, convsDiv.childNodes[0]);

      setActive({
        id: data.for.id,
        username: data.for.username,
        cid: data.cid,
      });
    });

    // Set the clicked conversation as an active conversation
    function setActive({ id, username, cid }) {
      // Set this conversation as the current conversation
      currentUserData.currentConversation = cid;
      const all = document.getElementsByClassName('sidebar-option');
      const thisActive = document.getElementById(id);
      if (!thisActive.classList.contains('active')) {
        for (let i = 0; i < all.length; i++) {
          if (all[i] == thisActive) {
            thisActive.classList.remove('unread');
            thisActive.classList.add('active');
          } else {
            all[i].classList.remove('active');
          }
        }
        openChatFor({ username });
      }
    }

    // Open chat for the current conversation
    function openChatFor({ username }) {
      document.getElementsByClassName('message-box')[0].style.display = '';
      document.getElementById('user-name').innerText = username;
      while (messageDiv.lastElementChild) {
        messageDiv.removeChild(messageDiv.lastElementChild);
      }
      document.getElementById('message-field').focus();

      // Access the chats data from server, this also can be implemented using XHR requests
      socket.emit('chatsFor', currentUserData.currentConversation);
      loader.style.display = 'block';
    }

    // Side bar data is loaded, thus remove the preloader
    loader.style.display = 'none';
  });

  // Display the chats for current conversation
  socket.on('chats', (data) => {
    data.forEach((e) => {
      const newDiv = document.createElement('div');
      newDiv.classList.add('message');
      if (e.author == currentUserData.id) {
        newDiv.classList.add('from-me');
      } else {
        newDiv.classList.add('incoming');
      }
      newDiv.innerText = e.text;
      messageDiv.appendChild(newDiv);
      messageDiv.scrollTop = messageDiv.scrollHeight;
    });

    // Chats loaded remove the preloader
    loader.style.display = 'none';
  });

  // Message input box, resizing to a certain height
  // Funtion to attach events
  var observe;
  if (window.attachEvent) {
    observe = function (element, event, handler) {
      element.attachEvent('on' + event, handler);
    };
  } else {
    observe = function (element, event, handler) {
      element.addEventListener(event, handler, false);
    };
  }
  // Resize Input box
  function resize() {
    if (messageField.scrollHeight >= 118) {
      return;
    }
    messageField.style.height = 'auto';
    messageField.style.height = messageField.scrollHeight + 'px';
  }
  // Delay the resize
  function delayedResize() {
    window.setTimeout(resize, 0);
  }

  // Add event listeners for message input field
  observe(messageField, 'change', resize);
  observe(messageField, 'cut', delayedResize);
  observe(messageField, 'paste', delayedResize);
  observe(messageField, 'drop', delayedResize);
  observe(messageField, 'keydown', delayedResize);

  messageField.focus();
  messageField.select();

  messageField.addEventListener('keydown', (e) => {
    // Submit message on enter
    if (e.which == 13 && !e.shiftKey) {
      sendMessage();
    }
  });

  // Submit message on clicking the icon
  document
    .getElementById('submit-message-icon')
    .addEventListener('click', () => {
      sendMessage();
    });

  // Send new message
  function sendMessage() {
    const messageText = messageField.value;
    messageField.value = '';
    messageField.blur();
    delayedResize();
    //Delay focus to remove the extra line
    setTimeout(() => {
      messageField.focus();
    }, 50);
    // Do not submit if message box is empty
    if (!messageText.trim()) return;

    // Send new message to the server
    socket.emit('newMessage', {
      text: messageText,
      cid: currentUserData.currentConversation,
    });

    // Display the message to local user
    const newDiv = document.createElement('div');
    newDiv.classList.add('message');
    newDiv.classList.add('from-me');
    newDiv.innerText = messageText;
    messageDiv.appendChild(newDiv);
    messageDiv.scrollTop = messageDiv.scrollHeight;
  }

  // Message from another user
  socket.on('message', (e) => {
    if (currentUserData.currentConversation == e.cid) {
      // If the user has opened the chat for the sender, display the message
      const newDiv = document.createElement('div');
      newDiv.classList.add('message');
      newDiv.classList.add('incoming');
      newDiv.innerText = e.text;
      messageDiv.appendChild(newDiv);
      messageDiv.scrollTop = messageDiv.scrollHeight;
    } else {
      // If the user has not opened the chat for the sender, add the conversation to unread
      document.getElementById(e.userFrom).classList.add('unread');
    }
  });

  // Online status of users
  socket.on('status', (data) => {
    const all = document.getElementsByClassName('sidebar-option');
    for (let i = 0; i < all.length; i++) {
      if (all[i].id != currentUserData.id) {
        if (data.includes(all[i].id)) {
          all[i].classList.remove('offline');
          all[i].classList.add('online');
        } else {
          all[i].classList.remove('online');
          all[i].classList.add('offline');
        }
      }
    }
  });
};
