# Autopay Exit

UPI AutoPay mandates keep pulling money for subscriptions, loans and apps long after you stop thinking about them. Autopay Exit keeps your mandates in one list, walks you through the documented exit path for each, and tracks every cancellation attempt until the status reads cancelled.

Open `index.html` in any browser. Nothing to install, no account. The page itself sends nothing anywhere; it forgets everything when you close it unless you tick "remember in this browser" or copy an export text.

## What is inside

- **My mandates** - who pulls the money, how much, how often, which UPI app holds the mandate, since when, and its status (Active / Cancellation requested / Cancelled-revoked / Unsure).
- **The exit path** - the three documented routes, each with its source and the date it was read:
  1. Inside the UPI app that created the mandate (Profile/Settings - AutoPay/Mandates - Cancel/Revoke - confirm, usually with UPI PIN; RBI requires an extra authentication step at revocation), per NPCI's product page and HDFC Bank's guide.
  2. From the merchant's side, then verifying the mandate status in the UPI app.
  3. Through your bank - the page tells the user to ask their bank which revocation route it offers, since RBI's framework establishes the right but banks' routes vary.
- **Attempt log** - per mandate: date, route tried, what happened, and a label pointing at your proof (SMS, screenshot).
- **Summary** - the whole record as plain text for a bank conversation or your own notes, including an approximate monthly pull that counts only known fixed-frequency amounts and says so.

## What it does not do

It cannot cancel, pause or modify any mandate - only you can, in your app or through your bank. It says plainly, before any cancellation guidance, that stopping the money is not ending the agreement behind it: a subscription still needs cancelling with the merchant, a loan cannot simply be ended and needs a repayment arrangement with the lender, and a revocation's effective timing should be confirmed when a debit date is close. It also says that some mandates (HDFC Bank's guide names debt collection and loan repayment, as per the regulator) cannot be cancelled in the UPI app and need the merchant or lender, and that a revocation close to a debit date may not stop that debit (NPCI: 24-hour pre-debit notice; HDFC Bank: cancel 2-3 days ahead). It does not promise a cancellation will succeed or that money will come back. It is not affiliated with NPCI, RBI, any bank or any UPI app. Menu names differ between apps and change over time; the steps are the general documented routes, not screenshots of your exact app.

## Sources (read 23 Nov 2026, re-checked 25 Nov 2026)

- NPCI, UPI AutoPay product page: https://www.npci.org.in/product/autopay
- HDFC Bank, cancel a UPI AutoPay mandate: https://www.hdfc.bank.in/payments/services/cancel-upi-autopay-mandate
- RBI circular, e-mandates in UPI, 10 Jan 2020: https://www.rbi.org.in/scripts/FS_Notification.aspx?Id=11784

## Engineering notes

Single self-contained HTML file, zero dependencies, no cookies, no analytics. The page makes no network requests of its own; like any web page, wherever it is hosted can see that it was loaded. Data persists only in `localStorage` under an explicit opt-in checkbox (untick erases it); export/import moves your data as base64 text under your control. All rendering escapes user input; unknown fields stay unknown and are never treated as zero. Node tests cover the pure logic (`node ae-test.js`), and the interaction layer is exercised in a real browser before any release.

Maintained by [Shivangi Priya](https://www.linkedin.com/in/shivangii-priyaa).
