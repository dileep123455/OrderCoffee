const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'coffee.db'));
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

function loadOrder(id) {
  const o = db.prepare(`
    SELECT o.*, c.name AS coffee_name FROM orders o
    JOIN coffees c ON c.id = o.coffee_id WHERE o.id = ?`).get(id);
  if (!o) return null;
  o.extras = db.prepare(`
    SELECT e.name FROM order_extras oe JOIN extras e ON e.id = oe.extra_id
    WHERE oe.order_id = ?`).all(id).map(r => r.name);
  return o;
}

app.get('/api/menu', (req, res) => {
  res.json({
    coffees: db.prepare('SELECT * FROM coffees').all(),
    extras: db.prepare('SELECT * FROM extras').all()
  });
});

app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const name = String(b.customer_name || '').trim().slice(0, 40);
  const tableNo = parseInt(b.table_no, 10);
  const coffeeId = parseInt(b.coffee_id, 10);
  const milk = parseInt(b.milk_ml, 10);
  const water = parseInt(b.water_ml, 10);
  const sugar = parseInt(b.sugar_spoons, 10);
  const notes = String(b.notes || '').trim().slice(0, 200);
  const extraIds = Array.isArray(b.extra_ids) ? b.extra_ids.map(Number).filter(Number.isInteger) : [];

  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!(tableNo >= 1 && tableNo <= 50)) return res.status(400).json({ error: 'Table number must be 1-50.' });
  if (!(milk >= 0 && milk <= 300)) return res.status(400).json({ error: 'Milk must be 0-300 ml.' });
  if (!(water >= 0 && water <= 300)) return res.status(400).json({ error: 'Water must be 0-300 ml.' });
  if (milk + water < 30) return res.status(400).json({ error: 'Add at least 30 ml of milk/water in total.' });
  if (!(sugar >= 0 && sugar <= 10)) return res.status(400).json({ error: 'Sugar must be 0-10 spoons.' });

  const coffee = db.prepare('SELECT * FROM coffees WHERE id = ?').get(coffeeId);
  if (!coffee) return res.status(400).json({ error: 'Invalid coffee type.' });

  const extras = extraIds.length
    ? db.prepare(`SELECT * FROM extras WHERE id IN (${extraIds.map(() => '?').join(',')})`).all(...extraIds)
    : [];
  const total = coffee.base_price + extras.reduce((s, e) => s + e.price, 0);

  const create = db.transaction(() => {
    const r = db.prepare(`INSERT INTO orders
      (customer_name, table_no, coffee_id, milk_ml, water_ml, sugar_spoons, notes, total_price)
      VALUES (?,?,?,?,?,?,?,?)`).run(name, tableNo, coffee.id, milk, water, sugar, notes, total);
    const ins = db.prepare('INSERT INTO order_extras (order_id, extra_id) VALUES (?,?)');
    extras.forEach(e => ins.run(r.lastInsertRowid, e.id));
    return r.lastInsertRowid;
  });

  res.status(201).json(loadOrder(create()));
});

app.get('/api/orders/:id', (req, res) => {
  const o = loadOrder(parseInt(req.params.id, 10));
  if (!o) return res.status(404).json({ error: 'Order not found.' });
  res.json(o);
});

app.get('/api/orders', (req, res) => {
  const rows = db.prepare(`SELECT id FROM orders
    WHERE status IN ('pending','preparing','ready') ORDER BY id ASC`).all();
  res.json(rows.map(r => loadOrder(r.id)));
});

app.patch('/api/orders/:id/status', (req, res) => {
  const status = req.body && req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const r = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, parseInt(req.params.id, 10));
  if (!r.changes) return res.status(404).json({ error: 'Order not found.' });
  res.json(loadOrder(parseInt(req.params.id, 10)));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Coffee shop running at http://localhost:${PORT}`));
