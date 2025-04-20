const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();

// App configuration
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// EJS with Layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// User database
const users = {
  'wiener': { password: 'peter', role: 'user', name: 'Peter Wiener' },
  'admin': { password: 'admin123', role: 'admin', name: 'System Admin' },
  'carlos': { password: 'password', role: 'user', name: 'Carlos Mendoza' }
};

// Middlewares
const checkAuth = (req, res, next) => {
  if (!req.cookies.username) {
    return res.redirect('/login');
  }
  next();
};

const checkAdmin = (req, res, next) => {
  const username = req.cookies.username;
  if (req.cookies.Admin === 'true' || (username && users[username]?.role === 'admin')) {
    return next();
  }
  res.status(403).render('error', { 
    title: 'Permission Error',
    message: 'Access to this page is restricted',
    user: null
  });
};

// Routes
app.get('/', (req, res) => {
  res.render('home', { 
    title: 'Home',
    user: req.cookies.username ? {
      username: req.cookies.username,
      name: users[req.cookies.username]?.name,
      isAdmin: req.cookies.Admin === 'true' || 
               users[req.cookies.username]?.role === 'admin'
    } : null
  });
});

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login',
    user: null,
    error: null
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username].password === password) {
    res.cookie('username', username);
    res.cookie('Admin', users[username].role === 'admin' ? 'true' : 'false');
    res.redirect('/profile');
  } else {
    res.render('login', { 
      title: 'Login',
      user: null,
      error: 'Invalid username or password'
    });
  }
});

app.get('/profile', checkAuth, (req, res) => {
  const user = users[req.cookies.username];
  res.render('profile', { 
    title: 'Profile',
    user: {
      username: req.cookies.username,
      name: user.name,
      isAdmin: req.cookies.Admin === 'true' || user.role === 'admin'
    }
  });
});

app.get('/admin', checkAuth, checkAdmin, (req, res) => {
  res.render('admin', { 
    title: 'Admin Panel',
    user: {
      username: req.cookies.username,
      name: users[req.cookies.username].name,
      isAdmin: true
    },
    users: Object.entries(users).map(([username, data]) => ({ 
      username, 
      name: data.name,
      isCurrent: username === req.cookies.username 
    }))
  });
});

app.get('/delete', checkAuth, checkAdmin, (req, res) => {
  const userToDelete = req.query.username;
  if (userToDelete && users[userToDelete] && userToDelete !== req.cookies.username) {
    delete users[userToDelete];
    res.redirect('/admin');
  } else {
    res.render('error', { 
      title: 'Request Error',
      message: 'This operation cannot be completed',
      user: {
        username: req.cookies.username,
        name: users[req.cookies.username].name,
        isAdmin: true
      }
    });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.clearCookie('Admin');
  res.redirect('/login');
});

app.listen(3000, () => {
  console.log('App running on http://localhost:3000');
});