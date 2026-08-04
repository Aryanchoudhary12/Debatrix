require('net').setDefaultAutoSelectFamily(false);
require('dotenv/config');
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => {
    console.log("CONNECTED OK");
    return client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Account'");
  })
  .then(r => { console.log("QUERY OK:", JSON.stringify(r.rows, null, 2)); process.exit(0); })
  .catch(e => { console.log("ERROR:", e.message, e.code); process.exit(1); });