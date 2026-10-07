const express = require('express');
const methods = require('../services/methods');

const router = express.Router();

// Public catalogue of active methods (wizard + result rendering metadata).
router.get('/', (req, res) => {
  res.json({ success: true, data: methods.list() });
});

module.exports = router;
