// worker.js
// Add these routes to index.js and run the polling loop
// Handles: approve link clicks, reject link clicks, and the send loop

const express = require('express');
const queue = require('./queue');
const { sendCustomerEmail } = require('./mailer');
const { deleteDiscountCode } = require('./shopify');

/**
 * Register approve/reject routes on the Express app
 */
function registerWorkerRoutes(app) {

  // Hayley clicks APPROVE in the approval email
  app.get('/approve/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const success = queue.approve(jobId);

    if (!success) {
      return res.send(`
        <div style="font-family:Arial;text-align:center;padding:60px;">
          <h2>Already processed</h2>
          <p>This job has already been approved, rejected, or does not exist.</p>
        </div>
      `);
    }

    const job = queue.getJob(jobId);
    const offer = JSON.parse(job.offer_json);
    const discountCode = JSON.parse(job.discount_code_json);
    const sendAtFormatted = new Date(job.send_at).toLocaleString('en-GB', { timeZone: 'Europe/London' });

    res.send(`
      <div style="font-family:Arial;text-align:center;padding:60px;max-width:500px;margin:0 auto;">
        <h2 style="color:#CC0000;">Approved</h2>
        <p>The email to <strong>${job.first_name}</strong> (${job.customer_email}) has been approved.</p>
        <p>Offer: <strong>${offer.emailOfferLine}</strong></p>
        <p>Code: <strong style="color:#CC0000;">${discountCode.code}</strong></p>
        <p>Will send at: <strong>${sendAtFormatted}</strong></p>
      </div>
    `);
  });

  // Hayley clicks REJECT in the approval email
  app.get('/reject/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const job = queue.getJob(jobId);

    if (!job || job.status !== 'pending_approval') {
      return res.send(`
        <div style="font-family:Arial;text-align:center;padding:60px;">
          <h2>Already processed</h2>
          <p>This job has already been approved, rejected, or does not exist.</p>
        </div>
      `);
    }

    queue.reject(jobId);

    // Attempt to delete the discount code from Shopify since we are not using it
    try {
      const discountCode = JSON.parse(job.discount_code_json);
      await deleteDiscountCode(discountCode.priceRuleId);
      console.log(`Discount code deleted for rejected job ${jobId}`);
    } catch (err) {
      console.error(`Could not delete discount code for rejected job ${jobId}:`, err.message);
    }

    res.send(`
      <div style="font-family:Arial;text-align:center;padding:60px;max-width:500px;margin:0 auto;">
        <h2>Rejected</h2>
        <p>The upsell email for <strong>${job.first_name}</strong> has been cancelled.</p>
        <p>The discount code has been removed from Shopify.</p>
      </div>
    `);
  });

  // View pending jobs (basic dashboard)
  app.get('/jobs', (req, res) => {
    const pending = require('better-sqlite3')(require('path').join(__dirname, 'upsell-queue.db'))
      .prepare(`SELECT * FROM upsell_jobs ORDER BY created_at DESC LIMIT 50`)
      .all();

    const rows = pending.map(j => {
      const offer = JSON.parse(j.offer_json);
      const code = JSON.parse(j.discount_code_json || '{}');
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${j.order_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${j.first_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${offer.bundleLabel}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${offer.emailOfferLine}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#CC0000;">${code.code || ''}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${j.status}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${j.send_at ? new Date(j.send_at).toLocaleString('en-GB',{timeZone:'Europe/London'}) : ''}</td>
      </tr>`;
    }).join('');

    res.send(`
      <html><head><title>BIE Upsell Queue</title></head>
      <body style="font-family:Arial;padding:24px;">
        <h2 style="color:#CC0000;">BIE Upsell Job Queue</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f4f4f4;">
              <th style="padding:8px;text-align:left;">Order</th>
              <th style="padding:8px;text-align:left;">Customer</th>
              <th style="padding:8px;text-align:left;">Bundle</th>
              <th style="padding:8px;text-align:left;">Offer</th>
              <th style="padding:8px;text-align:left;">Code</th>
              <th style="padding:8px;text-align:left;">Status</th>
              <th style="padding:8px;text-align:left;">Send At</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
  });
}

/**
 * Polling loop — checks every 60 seconds for approved jobs that are due to send
 */
function startSendLoop() {
  setInterval(async () => {
    const dueJobs = queue.getDueJobs();

    for (const job of dueJobs) {
      try {
        const offer = JSON.parse(job.offer_json);
        const discountCode = JSON.parse(job.discount_code_json);

        await sendCustomerEmail({
          firstName: job.first_name,
          customerEmail: job.customer_email,
          productTitle: job.product_title,
          offer,
          discountCode
        });

        queue.markSent(job.id);
        console.log(`Sent upsell email to ${job.customer_email} for job ${job.id}`);

      } catch (err) {
        console.error(`Failed to send job ${job.id}:`, err.message);
      }
    }
  }, 60 * 1000); // poll every 60 seconds
}

module.exports = { registerWorkerRoutes, startSendLoop };
