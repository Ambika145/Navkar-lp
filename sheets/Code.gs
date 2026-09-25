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
 * Duplicate prevention: Razorpay Payment ID must be unique.
 * Optional screenshots go to Drive folder "Navkar Payment Proofs".
 *
 * Redeploy the Web app after every script change.
 */

var SHEET_NAME = 'Bookings';
var PROOF_FOLDER = 'Navkar Payment Proofs';
var COL_PAYMENT_ID = 10; // Razorpay Payment ID
var COL_PROOF = 13;      // Payment Proof

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

    /* Duplicate Payment ID — do not create another booking row */
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

    return json_({ ok: true, proofUrl: proofUrl || '' });
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

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: 'navkar-bookings' });
}
