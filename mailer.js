// mailer.js
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const HAYLEY_EMAIL = 'hayley@branditessex.com';
const FROM_CUSTOMER = 'Hayley at Brand It Essex <hayley@branditessex.com>';
const FROM_INTERNAL = 'BIE Upsell Bot <noreply@branditessex.com>';
const WHATSAPP_LINK = process.env.WHATSAPP_LINK || 'https://wa.me/447700000000';
const BASE_URL = process.env.BASE_URL;

async function sendEmail({ to, from, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html, text })
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
  return res.json();
}

function buildCustomerEmail(firstName, productTitle, offer, discountCode) {
  const subject = 'Your order from Brand It Essex';

  // Product link with discount code pre-applied as URL parameter
  const productLinkWithCode = `${offer.productPageUrl}?discount=${discountCode.code}`;

  const text = `Hi ${firstName},

Just wanted to drop you a quick note to say thank you for your recent order of ${productTitle}. Really appreciate the support.

I wanted to reach out personally because we are doing something a bit different for new orders this month.

We have ${offer.emailOfferLine} available to add on to your existing order. We can match your branding exactly since we have already got your artwork set up.

You can view the product and place your order here:
${productLinkWithCode}

Your exclusive discount code is: ${discountCode.code}

The code will apply 25% off automatically at checkout and is valid until ${discountCode.expiresAt}. It is single use and created just for you so please do not share it.

If you would rather I sort it for you directly just reply to this email and I will get it done. No need to go back through the website.

Thanks again,

Hayley
Brand It Essex
WhatsApp: ${WHATSAPP_LINK}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; font-size: 15px; line-height: 1.8; color: #222;">

      <p>Hi ${firstName},</p>

      <p>Just wanted to drop you a quick note to say thank you for your recent order of <strong>${productTitle}</strong>. Really appreciate the support.</p>

      <p>I wanted to reach out personally because we are doing something a bit different for new orders this month.</p>

      <p>We have <strong>${offer.emailOfferLine}</strong> available to add on to your existing order. We can match your branding exactly since we have already got your artwork set up.</p>

      <table style="width:100%; border-collapse:collapse; margin: 24px 0; background: #f9f9f9; border-radius: 6px;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Your exclusive discount code</p>
            <p style="margin: 0 0 12px 0; font-size: 28px; font-weight: bold; color: #CC0000; letter-spacing: 2px;">${discountCode.code}</p>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #666;">25% off — single use — valid until ${discountCode.expiresAt}</p>
            <a href="${productLinkWithCode}"
               style="display: inline-block; background: #CC0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px;">
              View Product and Order
            </a>
          </td>
        </tr>
      </table>

      <p>The discount code is applied automatically when you use the link above. You can also copy and paste it at checkout if you prefer to browse first.</p>

      <p>If you would rather I sort it for you directly just reply to this email and I will get it done. No need to go back through the website.</p>

      <p>Thanks again,</p>

      <p>
        Hayley<br>
        Brand It Essex<br>
        <a href="${WHATSAPP_LINK}" style="color: #CC0000;">WhatsApp us here</a>
      </p>

    </div>`;

  return { subject, text, html };
}

async function sendApprovalEmail(job) {
  const { jobId, firstName, customerEmail, productTitle, offer, discountCode, sendAt } = job;

  const approveUrl = `${BASE_URL}/approve/${jobId}`;
  const rejectUrl = `${BASE_URL}/reject/${jobId}`;
  const preview = buildCustomerEmail(firstName, productTitle, offer, discountCode);
  const sendAtFormatted = new Date(sendAt).toLocaleString('en-GB', { timeZone: 'Europe/London' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">

      <h2 style="color: #CC0000; border-bottom: 2px solid #CC0000; padding-bottom: 10px;">
        BIE Upsell Bot — Approval Required
      </h2>

      <table style="border-collapse: collapse; width: 100%; margin-bottom: 24px; font-size: 14px;">
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px 12px; font-weight: bold; width: 160px;">Customer</td>
          <td style="padding: 8px 12px;">${firstName} (${customerEmail})</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold;">Bundle Purchased</td>
          <td style="padding: 8px 12px;">${productTitle}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px 12px; font-weight: bold;">Offer</td>
          <td style="padding: 8px 12px;">${offer.emailOfferLine}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold;">Discount Code</td>
          <td style="padding: 8px 12px; font-size: 20px; font-weight: bold; color: #CC0000; letter-spacing: 2px;">${discountCode.code}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px 12px; font-weight: bold;">Code Expires</td>
          <td style="padding: 8px 12px;">${discountCode.expiresAt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold;">Product Page</td>
          <td style="padding: 8px 12px;"><a href="${offer.productPageUrl}" style="color: #CC0000;">${offer.productPageUrl}</a></td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 8px 12px; font-weight: bold;">Scheduled Send</td>
          <td style="padding: 8px 12px;">${sendAtFormatted}</td>
        </tr>
      </table>

      <h3 style="margin-bottom: 8px;">Draft email to customer:</h3>
      <div style="border: 1px solid #ddd; padding: 20px; background: #fafafa; border-radius: 4px; white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7;">
${preview.text}
      </div>

      <div style="margin-top: 28px;">
        <a href="${approveUrl}"
           style="display: inline-block; background: #CC0000; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; margin-right: 12px;">
          APPROVE AND SEND
        </a>
        <a href="${rejectUrl}"
           style="display: inline-block; background: #666; color: white; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
          REJECT
        </a>
      </div>

      <p style="color: #999; font-size: 12px; margin-top: 20px;">
        Approving will send the email to ${customerEmail} at ${sendAtFormatted}.<br>
        Rejecting will cancel this upsell and delete the discount code from Shopify.
      </p>

    </div>`;

  await sendEmail({
    to: HAYLEY_EMAIL,
    from: FROM_INTERNAL,
    subject: `Upsell Approval — ${firstName} — ${offer.bundleLabel} — ${discountCode.code}`,
    html
  });

  console.log(`Approval email sent to Hayley for job ${jobId}`);
}

async function sendCustomerEmail(job) {
  const { firstName, customerEmail, productTitle, offer, discountCode } = job;
  const email = buildCustomerEmail(firstName, productTitle, offer, discountCode);

  await sendEmail({
    to: customerEmail,
    from: FROM_CUSTOMER,
    subject: email.subject,
    html: email.html,
    text: email.text
  });

  console.log(`Customer email sent to ${customerEmail} — offer ${offer.id} — code ${discountCode.code}`);
}

module.exports = { sendApprovalEmail, sendCustomerEmail };
