const app  = require('./app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connecté');
    conn.release();

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Impossible de se connecter à MySQL :', err.message);
    process.exit(1);
  }
}

start();