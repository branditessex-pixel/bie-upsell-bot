// offerMap.js
// All product IDs and handles confirmed live from Brand It Essex Shopify store

const STORE_URL = 'https://www.branditessex.com';

const BUNDLE_TRIGGERS = {

  // THE PREMIUM WORKWEAR BUNDLE — product ID 10368826278229
  'the-premium-bundle': {
    productId: '10368826278229',
    label: 'Premium Bundle',
    offers: [
      {
        id: 'premium-bundle-tees',
        sku: 'TJ8000',
        qty: 5,
        discount: 25,
        emailOfferLine: '5 additional Tee Jays TJ8000 Sof-T-Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/t8000`,
        shopifyProductId: '9963845812565'
      },
      {
        id: 'premium-bundle-qzip',
        sku: 'J270M',
        qty: 2,
        discount: 25,
        emailOfferLine: '2 Russell J270M 1/4 Zip Sweatshirts at 25% off',
        productPageUrl: `${STORE_URL}/products/270m`,
        shopifyProductId: '9968953655637'
      }
    ]
  },

  // WINTER PREMIUM WORKWEAR BUNDLE — product ID 10371468198229
  'the-winter-bundle-1': {
    productId: '10371468198229',
    label: 'Premium Winter Bundle',
    offers: [
      {
        id: 'winter-bundle-tees',
        sku: 'TJ8000',
        qty: 5,
        discount: 25,
        emailOfferLine: '5 additional Tee Jays TJ8000 Sof-T-Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/t8000`,
        shopifyProductId: '9963845812565'
      }
    ]
  },

  // PREMIUM PRO WINTER BUNDLE — product ID 10371498115413
  'the-pro-winter-workwear-bundle': {
    productId: '10371498115413',
    label: 'Pro Winter Bundle',
    offers: [
      {
        id: 'pro-winter-tees',
        sku: 'TJ8000',
        qty: 5,
        discount: 25,
        emailOfferLine: '5 additional Tee Jays TJ8000 Sof-T-Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/t8000`,
        shopifyProductId: '9963845812565'
      },
      {
        id: 'pro-winter-qzip',
        sku: 'J270M',
        qty: 2,
        discount: 25,
        emailOfferLine: '2 Russell J270M 1/4 Zip Sweatshirts at 25% off',
        productPageUrl: `${STORE_URL}/products/270m`,
        shopifyProductId: '9968953655637'
      }
    ]
  },

  // PREMIUM SUMMER WORKWEAR BUNDLE — product ID 11289809879381
  'premium-summer-workwear-bundle': {
    productId: '11289809879381',
    label: 'Premium Summer Bundle',
    offers: [
      {
        id: 'premium-summer-hicool',
        sku: 'H024',
        qty: 5,
        discount: 25,
        emailOfferLine: '5 additional Henbury H024 HiCool Performance T-Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/hi-cool-performance-t-shirt-hb024`,
        shopifyProductId: '9978395984213'
      }
    ]
  },

  // RUSSELL 10 PIECE WORKWEAR BUNDLE — product ID 10371516006741
  'the-russell-10-piece-bundle': {
    productId: '10371516006741',
    label: 'Russell Bundle',
    offers: [
      {
        id: 'russell-bundle-tees',
        sku: 'J180M',
        qty: 5,
        discount: 25,
        emailOfferLine: '5 additional Russell J180M Classic Ringspun T-Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/j180m`,
        shopifyProductId: '9988036231509'
      }
    ]
  },

  // RTX PRO BASICS WORKWEAR BUNDLE — product ID 10370547122517
  'rtx-pro-workwear-bundle': {
    productId: '10370547122517',
    label: 'Pro RTX Bundle',
    offers: [
      {
        id: 'rtx-bundle-qzip',
        sku: 'RX305',
        qty: 2,
        discount: 25,
        emailOfferLine: '2 Pro RTX RX305 1/4 Zip Sweatshirts at 25% off',
        productPageUrl: `${STORE_URL}/products/rx305`,
        shopifyProductId: '9968983572821'
      },
      {
        id: 'rtx-bundle-polo',
        sku: 'RX101',
        qty: 2,
        discount: 25,
        emailOfferLine: '2 Pro RTX RX101 Pique Polo Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/rx101`,
        shopifyProductId: '9972056392021'
      }
    ]
  },

  // SUMMER BASICS WORKWEAR BUNDLE — product ID 11289803063637
  'summer-basics-workwear-bundle-copy': {
    productId: '11289803063637',
    label: 'Summer Basics Bundle',
    offers: [
      {
        id: 'summer-basics-tees',
        sku: 'JC001',
        qty: 4,
        discount: 25,
        emailOfferLine: '4 AWDis JC001 Cool T-Shirts at 25% off',
        productPageUrl: `${STORE_URL}/products/jc001`,
        shopifyProductId: '9985312981333'
      }
    ]
  }

};

function getUpsellOffers(lineItems) {
  const results = [];

  for (const item of lineItems) {
    const productId = String(item.product_id || '');
    const trigger = Object.values(BUNDLE_TRIGGERS).find(t => t.productId === productId);
    if (!trigger) continue;

    for (const offer of trigger.offers) {
      results.push({ ...offer, bundleLabel: trigger.label });
    }
  }

  return results;
}

module.exports = { getUpsellOffers, BUNDLE_TRIGGERS };
