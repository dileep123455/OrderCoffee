const $ = id => document.getElementById(id);
let menu = { coffees: [], extras: [] };
let pollTimer = null;

const FLOW = ['pending', 'preparing', 'ready', 'delivered'];
const LABELS = { pending: 'Received', preparing: 'Preparing', ready: 'Ready', delivered: 'Delivered' };

function selectedExtraIds() {
  return [...document.querySelectorAll('#extras input:checked')].map(i => Number(i.value));
}

function updateTotal() {
  const c = menu.coffees.find(c => c.id === Number($('coffee').value));
  if (!c) return;
  const extras = selectedExtraIds().reduce((s, id) => s + menu.extras.find(e => e.id === id).price, 0);
  $('total').textContent = c.base_price + extras;
}

function updateLabels() {
  $('milkVal').textContent = $('milk').value;
  $('waterVal').textContent = $('water').value;
  $('sugarVal').textContent = $('sugar').value;
}

async function init() {
  menu = await (await fetch('/api/menu')).json();
  menu.coffees.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = `${c.name} (\u20B9${c.base_price})`;
    $('coffee').appendChild(o);
  });
  menu.extras.forEach(e => {
    const l = document.createElement('label');
    const i = document.createElement('input');
    i.type = 'checkbox'; i.value = e.id; i.addEventListener('change', updateTotal);
    l.appendChild(i);
    l.appendChild(document.createTextNode(` ${e.name} (+\u20B9${e.price})`));
    $('extras').appendChild(l);
  });
  applyDefaults();
  updateLabels();
  updateTotal();
}

function applyDefaults() {
  const c = menu.coffees.find(c => c.id === Number($('coffee').value));
  if (!c) return;
  $('milk').value = c.default_milk_ml;
  $('water').value = c.default_water_ml;
  updateLabels();
  updateTotal();
}

$('coffee').addEventListener('change', applyDefaults);
['milk', 'water', 'sugar'].forEach(id => $(id).addEventListener('input', updateLabels));

$('submit').addEventListener('click', async () => {
  $('error').textContent = '';
  const body = {
    customer_name: $('name').value,
    table_no: $('table').value,
    coffee_id: $('coffee').value,
    milk_ml: $('milk').value,
    water_ml: $('water').value,
    sugar_spoons: $('sugar').value,
    extra_ids: selectedExtraIds(),
    notes: $('notes').value
  };
  const res = await fetch('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) { $('error').textContent = data.error; return; }
  showTracking(data);
});

function showTracking(order) {
  $('orderSection').classList.add('hidden');
  $('trackSection').classList.remove('hidden');
  $('orderId').textContent = '#' + order.id;
  localStorage.setItem('lastOrder', order.id);
  renderOrder(order);
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    const r = await fetch('/api/orders/' + order.id);
    if (r.ok) renderOrder(await r.json());
  }, 4000);
}

function renderOrder(o) {
  const extras = o.extras.length ? ' + ' + o.extras.join(', ') : '';
  $('summary').textContent =
    `${o.coffee_name}: ${o.milk_ml} ml milk, ${o.water_ml} ml water, ${o.sugar_spoons} sugar${extras}. Table ${o.table_no}. Total \u20B9${o.total_price}`;
  const steps = $('steps');
  steps.textContent = '';
  const idx = FLOW.indexOf(o.status);
  FLOW.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'step' + (i <= idx ? ' done' : '');
    d.textContent = LABELS[s];
    steps.appendChild(d);
  });
  const msgs = {
    pending: 'Your order has been received.',
    preparing: 'We are making your coffee.',
    ready: 'Ready! It is on its way to your table.',
    delivered: 'Delivered to your table. Enjoy!',
    cancelled: 'This order was cancelled.'
  };
  $('statusMsg').textContent = msgs[o.status];
  if (o.status === 'delivered' || o.status === 'cancelled') clearInterval(pollTimer);
}

$('newOrder').addEventListener('click', () => {
  clearInterval(pollTimer);
  $('trackSection').classList.add('hidden');
  $('orderSection').classList.remove('hidden');
});

init();
