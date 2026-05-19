// index.js
const express = require('express');
const app = express();
app.use(express.json());

const { calculateSendTime } = require('./scheduler');
const { getUpsellOffers } = require('./offerMap');
const queue = require('./queue');
const { registerWorkerRoutes, startSendLoop } = require('./worker');

const PORT = process.env.PORT || 3000;

registerWorkerRoutes(app);
startSendLoop();

app.post('/webhook/order-created', async (req, res) => {
  res.sendStatus(200);
  try {
    const order = req.body;
    const customerEmail = order.email;
    if (!customerEmail) return;

    const firstName = order.billing_address?.first_name || order.customer?.first_name || 'there';
    const lineItems = order.line_items || [];
    const productTitle = lineItems.map(i => i.title).join(', ');
    const offers = getUpsellOffers(lineItems);

    if (!offers || offers.length === 0) {
      console.log(`Order ${order.name} — no trigger matched.`);
      return;
    }

    const sendAt = calculateSendTime(new Date());
    console.log(`Order ${order.name} — ${offers.length} offer(s) queued for ${sendAt.toISOString()}`);

    for (const offer of offers) {
      await queue.add({ orderId: order.id, orderName: order.name, customerEmail, firstName, productTitle, offer, sendAt: sendAt.toISOString() });
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'BIE Upsell Bot', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`BIE Upsell Bot running on port ${PORT}`));
