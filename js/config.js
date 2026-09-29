/* ============================================================
   Navkar — public config (no secrets here)
   Fill these before going live. Razorpay key_secret must NEVER
   be placed in frontend code.
   ============================================================ */
window.NAVKAR_CONFIG = {
  /* Razorpay Dashboard → API Keys → Key Id (test or live) */
  razorpayKey: 'rzp_test_T3C6cn6Psek2Fc',

  /* Google Apps Script web-app URL after you Deploy → Web app
     (Execute as: Me, Who has access: Anyone) */
  sheetsEndpoint: 'https://script.google.com/macros/s/AKfycbyCeVVBQaEPcbupGakycGAC1mhK1m0II7kSRxIqek9BU2Kg0akVR4AmWqSFKGXuQhIc/exec',

  /* Shown inside Razorpay Checkout */
  merchantName: 'Navkar Navratri Utsav',
  merchantImage: 'assets/img/logo-128.png'
};
