const jwt = require('jsonwebtoken');

// Protects full-page routes: redirects to /login if not signed in.
function requireAuthPage(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

// Protects JSON API routes: responds 401 if not signed in.
function requireAuthApi(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not signed in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = { requireAuthPage, requireAuthApi };
