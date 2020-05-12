const express = require('express');
const router = express.Router();
const path = require('path');

const hashPwd = require('../utils/hashPwd')();
const UserModel = require('../data-access/models/User');

router.get('/register', (req, res) => {
  if (req.session.authenticated) {
    return res.status(301).redirect('/inbox');
  }
  res.sendFile(
    path.join(__dirname + '/' + '..' + '/' + 'public' + '/' + 'register.html')
  );
});

router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await hashPwd.hash(req.body.password);
    const newUser = new UserModel({
      username: req.body.username,
      name: req.body.name,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(200).json({
      success: true,
      data: {
        case: 'created',
        message: 'Account created successfully!',
      },
    });
  } catch (err) {
    if (err.code == 11000) {
      res.status(409).json({
        success: false,
        data: {
          case: 'username',
          message: 'Username already in use! Use another one.',
        },
      });
    } else {
      res.status(500).json({
        success: false,
        data: {
          case: 'unknown',
          message: 'Something went wrong!',
        },
      });
    }
  }
});

router.get('/login', (req, res) => {
  if (req.session.authenticated) {
    return res.status(301).redirect('/inbox');
  }
  res.sendFile(
    path.join(__dirname + '/' + '..' + '/' + 'public' + '/' + 'login.html')
  );
});

router.post('/login', async (req, res) => {
  try {
    const user = await UserModel.findOne({
      username: req.body.username,
    }).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        data: {
          case: 'username',
          message: 'Username does not match with existing records.',
        },
      });
    }
    const verifyPwd = await hashPwd.check(req.body.password, user.password);
    if (!verifyPwd) {
      return res.status(401).json({
        success: false,
        data: {
          case: 'password',
          message: 'Username and password does not match.',
        },
      });
    }

    req.session.authenticated = true;
    req.session.user = {
      username: user.username,
      id: user._id,
      name: user.name,
    };

    res.status(200).json({
      success: true,
      data: {
        case: 'done',
        message: 'Log in successful.',
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: {
        case: err.name,
        message: 'Something went wrong!',
      },
    });
  }
});

router.get('/inbox', (req, res) => {
  if (!req.session.authenticated) {
    return res.status(301).redirect('/login');
  }
  res.sendFile(
    path.join(__dirname + '/' + '..' + '/' + 'public' + '/' + 'inbox.html')
  );
});

router.get('/logout', (req, res) => {
  req.session.authenticated = false;
  req.session.destroy(function (error) {
    if (error) {
      return next(error);
    } else {
      return res.redirect('/login');
    }
  });
});

router.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.status(301).redirect('/inbox');
  } else {
    res.status(301).redirect('/login');
  }
});

module.exports = router;
