CREATE TABLE IF NOT EXISTS coffees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  base_price INTEGER NOT NULL,
  default_milk_ml INTEGER NOT NULL,
  default_water_ml INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS extras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  table_no INTEGER NOT NULL,
  coffee_id INTEGER NOT NULL REFERENCES coffees(id),
  milk_ml INTEGER NOT NULL,
  water_ml INTEGER NOT NULL,
  sugar_spoons INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS order_extras (
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  extra_id INTEGER NOT NULL REFERENCES extras(id),
  PRIMARY KEY (order_id, extra_id)
);

INSERT OR IGNORE INTO coffees (name, base_price, default_milk_ml, default_water_ml) VALUES
  ('Filter Coffee', 30, 100, 50),
  ('Cappuccino', 80, 120, 30),
  ('Latte', 90, 180, 30),
  ('Espresso', 60, 0, 40),
  ('Americano', 70, 0, 200);

INSERT OR IGNORE INTO extras (name, price) VALUES
  ('Ginger', 5),
  ('Cardamom', 5),
  ('Cinnamon', 5),
  ('Black Pepper (spicy)', 5),
  ('Chilli Flakes (extra spicy)', 5),
  ('Chocolate Syrup', 15),
  ('Extra Shot', 25);
