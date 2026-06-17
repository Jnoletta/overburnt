require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/products',     require('./src/routes/product'));
app.use('/api/orders',    require('./src/routes/order'));
app.use('/api/favorites',      require('./src/routes/favorite'));
app.use('/api/customers', require('./src/routes/customer'));
app.use('/api/users', require('./src/routes/user'));
app.use('/api/upload',       require('./src/routes/upload'));
app.use('/api/payment',     require('./src/routes/payment'));

module.exports = app;