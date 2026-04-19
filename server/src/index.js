'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const fabricRouter = require('./routes/fabric');
const authRouter = require('./routes/auth');
const { connectFabric } = require('./fabric/gateway');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// ─── MongoDB session store ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/blockchaincertificate')
  .then(() => console.log('[MongoDB] Connected'))
  .catch(err => console.error('[MongoDB] Error:', err));

app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET || 'blockcert-secret-vlu',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/blockchaincertificate',
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
}));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/fabric', fabricRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────
async function main() {
  // Luôn khởi động HTTP server trước — không để Fabric block
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });

  // Kết nối Fabric ở chế độ nền — retry tự động
  const tryConnectFabric = async (attempt = 1) => {
    try {
      await connectFabric();
      console.log('[Fabric] Gateway connected');
    } catch (err) {
      console.warn(`[Fabric] Kết nối thất bại (lần ${attempt}): ${err.message}`);
      console.warn('[Fabric] Thử lại sau 15 giây... (server vẫn chạy bình thường)');
      setTimeout(() => tryConnectFabric(attempt + 1), 15000);
    }
  };

  tryConnectFabric();
}

main();
