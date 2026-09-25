/**
 * Navkar Navratri Utsav — Google Apps Script (Option 1, no backend)
 *
 * Setup:
 * 1. Create a Google Sheet with a tab named "Bookings".
 * 2. Extensions → Apps Script → paste this file → Save.
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL into js/config.js → sheetsEndpoint
 *
 * Flow: Razorpay success → Sheet row → Confirmation email → (frontend success UI)
 * Email is best-effort: sheet write success is never blocked by mail failure.
 *
 * Duplicate prevention: Razorpay Payment ID must be unique.
 * Optional screenshots go to Drive folder "Navkar Payment Proofs".
 *
 * Redeploy the Web app after every script change.
 */

var SHEET_NAME = 'Bookings';
var PROOF_FOLDER = 'Navkar Payment Proofs';
var COL_PAYMENT_ID = 10; // Razorpay Payment ID
var COL_PROOF = 13;      // Payment Proof

var EVENT_NAME = 'Navkar Navratri Utsav 2026 · Season 9';
var EVENT_DATES = '11–19 October 2026';
var EVENT_VENUE = 'Jalavihar, Necklace Road, Hyderabad';
var EVENT_GATES = 'Gates open 7:00 PM';
var SUPPORT_PHONE = '+91 81421 11145 / +91 80191 61198';

var HEADERS = [
  'Timestamp',
  'Name',
  'Phone',
  'Email',
  'City',
  'Booking Type',
  'Pass Type',
  'Quantity',
  'Payment Amount',
  'Razorpay Payment ID',
  'Payment Status',
  'Verification Status',
  'Payment Proof'
];

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var paymentId = data.paymentId ? String(data.paymentId) : '';
    var existingRow = findPaymentRow_(sheet, paymentId);

    /* Optional: attach screenshot to an existing registration */
    if (data.action === 'attachProof') {
      if (!paymentId) {
        return json_({ ok: false, error: 'Missing payment ID' });
      }
      if (existingRow < 0) {
        return json_({ ok: false, error: 'Registration not found for this payment ID' });
      }
      var attachedUrl = saveProof_(data);
      if (attachedUrl) {
        sheet.getRange(existingRow, COL_PROOF).setValue(attachedUrl);
      }
      return json_({ ok: true, updated: true, proofUrl: attachedUrl || '' });
    }

    /* Duplicate Payment ID — do not create another booking row (or re-mail) */
    if (paymentId && existingRow > 0) {
      var extraProof = '';
      if (data.proofBase64) {
        extraProof = saveProof_(data);
        if (extraProof) sheet.getRange(existingRow, COL_PROOF).setValue(extraProof);
      }
      return json_({ ok: true, duplicate: true, proofUrl: extraProof || '' });
    }

    var proofUrl = saveProof_(data);

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.city || '',
      data.bookingType || '',
      data.passType || '',
      data.quantity != null ? data.quantity : '',
      data.amount != null ? data.amount : '',
      paymentId,
      data.paymentStatus || 'Payment Received',
      data.verificationStatus || 'Pending Review',
      proofUrl || ''
    ]);

    /* Best-effort confirmation — never fail the booking if mail errors */
    var emailSent = false;
    try {
      emailSent = sendConfirmationEmail_(data);
    } catch (mailErr) {
      Logger.log('Confirmation email failed: ' + mailErr);
      emailSent = false;
    }

    return json_({ ok: true, proofUrl: proofUrl || '', emailSent: emailSent });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function findPaymentRow_(sheet, paymentId) {
  if (!paymentId) return -1;
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var values = sheet.getRange(2, COL_PAYMENT_ID, last, COL_PAYMENT_ID).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(paymentId)) return i + 2;
  }
  return -1;
}

function saveProof_(data) {
  if (!data || !data.proofBase64) return '';

  var folders = DriveApp.getFoldersByName(PROOF_FOLDER);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PROOF_FOLDER);

  var b64 = String(data.proofBase64).replace(/^data:[^;]+;base64,/, '');
  var bytes = Utilities.base64Decode(b64);
  var mime = data.proofMime || 'image/jpeg';
  var name = data.proofName || ('proof-' + (data.paymentId || Date.now()) + '.jpg');
  var blob = Utilities.newBlob(bytes, mime, name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/**
 * Sends booking confirmation to the customer email from the form.
 * Returns true if MailApp accepted the send; false if skipped/failed.
 * Callers must catch errors — this function may still throw.
 */
function sendConfirmationEmail_(data) {
  var to = data && data.email ? String(data.email).trim() : '';
  if (!to || to.indexOf('@') < 1) return false;

  var name = data.name ? String(data.name).trim() : 'Guest';
  var bookingType = data.bookingType ? String(data.bookingType).trim() : 'Booking';
  var passType = data.passType ? String(data.passType).trim() : '—';
  var qty = data.quantity != null && data.quantity !== '' ? String(data.quantity) : '—';
  var paymentId = data.paymentId ? String(data.paymentId) : '—';
  var amountText = formatInr_(data.amount);

  var subject = 'Booking confirmed — ' + EVENT_NAME;

  var plain =
    'Hi ' + name + ',\n\n' +
    'Thank you for booking with Navkar Navratri Utsav. Your payment was received and your registration is confirmed.\n\n' +
    'Booking type: ' + bookingType + '\n' +
    'Details: ' + passType + '\n' +
    'Quantity: ' + qty + '\n' +
    'Amount paid: ' + amountText + '\n' +
    'Razorpay Payment ID: ' + paymentId + '\n\n' +
    'Event: ' + EVENT_NAME + '\n' +
    'Dates: ' + EVENT_DATES + '\n' +
    'Venue: ' + EVENT_VENUE + '\n' +
    EVENT_GATES + '\n\n' +
    'Our team verifies each payment manually. Please keep this email and your Razorpay Payment ID for entry support.\n\n' +
    'Questions? WhatsApp / call Bookings: ' + SUPPORT_PHONE + '\n\n' +
    'See you in the circle,\n' +
    'Navkar Entertainment';

  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1b0310;max-width:560px;margin:0 auto;">' +
      '<p style="margin:0 0 16px;">Hi <strong>' + esc_(name) + '</strong>,</p>' +
      '<p style="margin:0 0 20px;">Thank you for booking with <strong>Navkar Navratri Utsav</strong>. Your payment was received and your registration is confirmed.</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px;">' +
        rowHtml_('Booking type', bookingType) +
        rowHtml_('Details', passType) +
        rowHtml_('Quantity', qty) +
        rowHtml_('Amount paid', amountText) +
        rowHtml_('Razorpay Payment ID', paymentId) +
      '</table>' +
      '<div style="background:#fff9dc;border:1px solid #e8d9a0;border-radius:10px;padding:14px 16px;margin:0 0 20px;">' +
        '<p style="margin:0 0 6px;font-weight:700;">' + esc_(EVENT_NAME) + '</p>' +
        '<p style="margin:0;color:#444;">' + esc_(EVENT_DATES) + '<br>' +
          esc_(EVENT_VENUE) + '<br>' + esc_(EVENT_GATES) + '</p>' +
      '</div>' +
      '<p style="margin:0 0 12px;">Our team verifies each payment manually. Please keep this email and your Razorpay Payment ID for entry support.</p>' +
      '<p style="margin:0 0 20px;color:#555;font-size:13px;">Questions? WhatsApp / call Bookings: ' + esc_(SUPPORT_PHONE) + '</p>' +
      '<p style="margin:0;">See you in the circle,<br><strong>Navkar Entertainment</strong></p>' +
    '</div>';

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: plain,
    htmlBody: html,
    name: 'Navkar Navratri Utsav'
  });

  return true;
}

function formatInr_(amount) {
  if (amount == null || amount === '') return '—';
  var n = Number(amount);
  if (isNaN(n)) return String(amount);
  return '₹' + n.toLocaleString('en-IN');
}

function rowHtml_(label, value) {
  return '<tr>' +
    '<td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;width:38%;">' + esc_(label) + '</td>' +
    '<td style="padding:8px 0;font-weight:600;vertical-align:top;">' + esc_(value) + '</td>' +
    '</tr>';
}

function esc_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: 'navkar-bookings' });
}
