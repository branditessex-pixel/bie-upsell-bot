// queue.js
// Simple SQLite-based job queue. Stores pending upsell jobs and fires them at the right time.
// Uses better-sqlite3 for synchronous ops - simple and reliable on Railway

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'upsell-queue.db');
const db = new Database(DB_PATH);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS upsell_jobs (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    order_name TEXT,
    customer_email TEXT,
    first_name TEXT,
    product_title TEXT,
    offer_json TEXT,
    discount_code_json TEXT,
    send_at TEXT,
    status TEXT DEFAULT 'pending_approval',
    created_at TEXT DEFAULT (datetime('now')),
    approved_at TEXT,
    sent_at TEXT,
    rejected_at TEXT
  )
`);

/**
 * Add a new upsell job to the queue
 * Status flow: pending_approval -> approved -> sent
 *                              -> rejected
 */
async function add(jobData) {
  const { createDiscountCode } = require('./shopify');
  const { sendApprovalEmail } = require('./mailer');

  const jobId = crypto.randomUUID();

  // Generate the discount code now so it appears in the approval email
  let discountCode;
  try {
    discountCode = await createDiscountCode(jobData.offer, jobData.customerEmail);
  } catch (err) {
    console.error(`Failed to create discount code for job ${jobId}:`, err.message);
    return;
  }

  // Store in DB
  const stmt = db.prepare(`
    INSERT INTO upsell_jobs (id, order_id, order_name, customer_email, first_name, product_title, offer_json, discount_code_json, send_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    jobId,
    String(jobData.orderId),
    jobData.orderName,
    jobData.customerEmail,
    jobData.firstName,
    jobData.productTitle,
    JSON.stringify(jobData.offer),
    JSON.stringify(discountCode),
    jobData.sendAt
  );

  // Send approval email to Hayley immediately
  try {
    await sendApprovalEmail({
      jobId,
      ...jobData,
      discountCode
    });
  } catch (err) {
    console.error(`Failed to send approval email for job ${jobId}:`, err.message);
  }

  return jobId;
}

function approve(jobId) {
  const stmt = db.prepare(`UPDATE upsell_jobs SET status = 'approved', approved_at = datetime('now') WHERE id = ? AND status = 'pending_approval'`);
  const result = stmt.run(jobId);
  return result.changes > 0;
}

function reject(jobId) {
  const stmt = db.prepare(`UPDATE upsell_jobs SET status = 'rejected', rejected_at = datetime('now') WHERE id = ? AND status = 'pending_approval'`);
  const result = stmt.run(jobId);
  return result.changes > 0;
}

function markSent(jobId) {
  const stmt = db.prepare(`UPDATE upsell_jobs SET status = 'sent', sent_at = datetime('now') WHERE id = ?`);
  stmt.run(jobId);
}

function getDueJobs() {
  const stmt = db.prepare(`
    SELECT * FROM upsell_jobs
    WHERE status = 'approved'
    AND send_at <= datetime('now')
  `);
  return stmt.all();
}

function getJob(jobId) {
  return db.prepare(`SELECT * FROM upsell_jobs WHERE id = ?`).get(jobId);
}

module.exports = { add, approve, reject, markSent, getDueJobs, getJob };
