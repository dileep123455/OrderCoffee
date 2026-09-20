# Coffee Table Orders

Customers pick coffee type, milk (ml), water (ml), sugar (spoons) and spicy extras,
then submit. The kitchen sees the order and marks it preparing -> ready -> delivered
to the table. Customers see live status.

## Stack
- Frontend: HTML, CSS, JavaScript (public/)
- Backend: Node.js + Express (server.js)
- Database: SQL via SQLite (db/schema.sql, file coffee.db is auto-created)

## Run
1. Install Node.js 18+
2. In this folder run: `npm install`
3. Run: `npm start`
4. Customer page: http://localhost:3000
5. Kitchen page: http://localhost:3000/kitchen.html

## API
- GET  /api/menu
- POST /api/orders
- GET  /api/orders/:id
- GET  /api/orders  (active orders)
- PATCH /api/orders/:id/status  {"status":"preparing|ready|delivered|cancelled"}

## Next steps
Add a staff login for kitchen.html, and use MySQL by swapping the db layer in server.js.
