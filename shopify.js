// shopify.js
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

function generateCode() {
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `HAYLEY25${random}`;
}

async function createDiscountCode(offer) {
  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Scope discount to the specific product only using entitled_product_ids
  const priceRuleRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/price_rules.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({
        price_rule: {
          title: `UPSELL-${code}`,
          target_type: 'line_item',
          target_selection: 'entitled',
          entitled_product_ids: [parseInt(offer.shopifyProductId)],
          allocation_method: 'across',
          value_type: 'percentage',
          value: `-${offer.discount}.0`,
          customer_selection: 'all',
          starts_at: new Date().toISOString(),
          ends_at: expiresAt.toISOString(),
          usage_limit: 1,
          once_per_customer: true
        }
      })
    }
  );

  if (!priceRuleRes.ok) throw new Error(`Price rule failed: ${await priceRuleRes.text()}`);
  const { price_rule } = await priceRuleRes.json();

  const codeRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/price_rules/${price_rule.id}/discount_codes.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({ discount_code: { code } })
    }
  );

  if (!codeRes.ok) throw new Error(`Discount code failed: ${await codeRes.text()}`);

  console.log(`Discount code created: ${code} — ${offer.discount}% off ${offer.sku}, expires ${expiresAt.toDateString()}`);

  return {
    code,
    discount: offer.discount,
    expiresAt: expiresAt.toDateString(),
    priceRuleId: price_rule.id
  };
}

async function deleteDiscountCode(priceRuleId) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/price_rules/${priceRuleId}.json`,
    { method: 'DELETE', headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN } }
  );
  if (!res.ok) throw new Error(`Failed to delete price rule ${priceRuleId}`);
}

module.exports = { createDiscountCode, deleteDiscountCode };
