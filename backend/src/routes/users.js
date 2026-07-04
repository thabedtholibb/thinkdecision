const express = require('express');
const authenticate = require('../middleware/authenticate');
const authService = require('../services/authService');

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({
    success: true,
    data: user,
  });
});

module.exports = router;
