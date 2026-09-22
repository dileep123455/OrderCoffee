const NEXT = { pending: 'preparing', preparing: 'ready', ready: 'delivered' };
const BTN = { pending: 'Start preparing', preparing: 'Mark ready', ready: 'Mark delivered' };
const $ = id => document.getElementById(id);
let timer = null;

const getPin = () => sessionStorage.getItem('staffPin') || '';

function headers() {
  return { 'Content-Type': 'application/json', 'x-staff-pin': getPin() };
}

function showLogin(msg) {
  clearInterval(timer);
  sessionStorage.removeItem('staffPin');
  $('board').classList.add('hidden');
  $('login').classList.remove('hidden');
  $('loginError').textContent = msg || '';
}

async function setStatus(id, status) {
  const r = await fetch(`/api/orders/${id}/status`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify({ status })
  });
  if (r.status === 401) return showLogin('Session expired. Enter PIN again.');
  load();
}

function line(parent, text, bold) {
  const p = document.createElement('p');
  p.style.margin = '4px 0';
  if (bold) p.style.fontWeight = '700';
  p.textContent = text;
  parent.appendChild(p);
}

async function load() {
  const res = await fetch('/api/orders', { headers: headers() });
  if (res.status === 401) return showLogin('Wrong PIN.');
  const orders = await res.json();
  $('login').classList.add('hidden');
  $('board').classList.remove('hidden');
  const box = $('orders');
  box.textContent = '';
  $('empty').classList.toggle('hidden', orders.length > 0);
  orders.forEach(o => {
    const card = document.createElement('div');
    card.className = 'card';
    line(card, `#${o.id} \u2022 TABLE ${o.table_no} \u2022 ${o.customer_name}`, true);
    line(card, o.coffee_name, true);
    line(card, `Milk ${o.milk_ml} ml | Water ${o.water_ml} ml | Sugar ${o.sugar_spoons}`);
    if (o.extras.length) line(card, 'Extras: ' + o.extras.join(', '));
    if (o.notes) line(card, 'Note: ' + o.notes);
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = o.status;
    card.appendChild(badge);
    const b = document.createElement('button');
    b.textContent = BTN[o.status];
    b.className = 'full';
    b.onclick = () => setStatus(o.id, NEXT[o.status]);
    card.appendChild(b);
    const c = document.createElement('button');
    c.textContent = 'Cancel';
    c.className = 'full alt';
    c.onclick = () => setStatus(o.id, 'cancelled');
    card.appendChild(c);
    box.appendChild(card);
  });
}

function start() {
  clearInterval(timer);
  load();
  timer = setInterval(load, 5000);
}

$('loginBtn').addEventListener('click', () => {
  sessionStorage.setItem('staffPin', $('pin').value);
  start();
});
$('pin').addEventListener('keydown', e => { if (e.key === 'Enter') $('loginBtn').click(); });
$('logout').addEventListener('click', () => showLogin(''));

if (getPin()) start();
