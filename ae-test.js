/* Node tests for Autopay Exit pure logic (AE namespace in index.html). */
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if(!m){ console.error("no script block found"); process.exit(1); }
const cut = m[1].lastIndexOf("(function(){");
if(cut < 0){ console.error("DOM IIFE boundary not found"); process.exit(1); }
eval(m[1].slice(0, cut));

let pass = 0, fail = 0;
function ok(cond, name){ if(cond){ pass++; } else { fail++; console.error("FAIL: " + name); } }
function eq(a, b, name){ ok(a === b, name + " (got " + JSON.stringify(a) + ")"); }

eq(AE.inr(649), "\u20B9649", "inr small");
eq(AE.inr(1234567), "\u20B912,34,567", "inr grouping");
eq(AE.inr(NaN), "-", "inr NaN");
eq(AE.num(""), null, "num blank");
eq(AE.num("649"), 649, "num parses");
eq(AE.num("-1"), null, "num negative rejected");
eq(AE.validStatus("Active"), "Active", "status kept");
eq(AE.validStatus("junk"), "Unsure", "junk status normalised to Unsure, never trusted");

eq(AE.fmtDate("2026-11-21"), "21 Nov 2026", "fmtDate");
eq(AE.fmtDate(""), null, "fmtDate blank");
eq(AE.fmtDate("2026-13-99"), "2026-13-99", "fmtDate invalid verbatim");

/* monthly burn: only known fixed-frequency amounts, cancelled excluded */
const ms = [
  { name:"A", amount:"649", freq:"Monthly", status:"Active" },
  { name:"B", amount:"3000", freq:"Yearly", status:"Active" },
  { name:"C", amount:"100", freq:"Per use", status:"Active" },
  { name:"D", amount:"", freq:"Monthly", status:"Active" },
  { name:"E", amount:"500", freq:"Monthly", status:"Cancelled / revoked" }
];
const b = AE.monthlyBurn(ms);
eq(Math.round(b.total), 899, "burn sums monthly + yearly/12 only");
eq(b.counted, 2, "burn counts only included mandates");
eq(AE.monthlyBurn([]).counted, 0, "burn empty");

/* roundtrip */
const st = AE.fresh();
st.mandates.push({ id:"m1", name:"Loan <app> & Co", amount:"2500", freq:"Monthly", app:"PhonePe", since:"2025-01-15", status:"Active", attempts:[{id:"a1", date:"2026-11-21", route:"UPI app", result:"tapped Revoke", ref:"SMS 21 Nov"}] });
const rt = AE.decode(AE.encode({ app:"autopay-exit", v:1, data:st }));
eq(rt.mandates[0].name, "Loan <app> & Co", "roundtrip unicode intact");
eq(rt.mandates[0].attempts[0].ref, "SMS 21 Nov", "roundtrip attempt intact");
let threw = false;
try { AE.decode(AE.encode({ app:"deposit-file", data:{} })); } catch(e){ threw = true; }
ok(threw, "foreign export rejected");
threw = false;
try { AE.decode("zzz!!!"); } catch(e){ threw = true; }
ok(threw, "garbage rejected");

/* summary */
const bare = AE.fresh();
const sBare = AE.summaryText(bare);
ok(sBare.indexOf("No mandates recorded.") > -1, "empty summary honest");
ok(sBare.indexOf("Only you can cancel") > -1, "summary honesty line");
const s2 = AE.summaryText(st);
ok(s2.indexOf("\u20B92,500") > -1, "summary amount");
ok(s2.indexOf("via PhonePe") > -1, "summary app");
ok(s2.indexOf("since 15 Jan 2025") > -1, "summary date");
ok(s2.indexOf("[Active]") > -1, "summary status");
ok(s2.indexOf("21 Nov 2026 - tried UPI app: tapped Revoke (proof: SMS 21 Nov)") > -1, "summary attempt line");
ok(s2.indexOf("Approx monthly pull across 1 known mandate(s): \u20B92,500") > -1, "summary burn line");

/* static checks */
ok(html.indexOf("Maintained by <a href=\"https://www.linkedin.com/in/shivangii-priyaa\"") > -1 && html.indexOf(">Shivangi Priya</a>.") > -1, "maintainer line links to LinkedIn");
ok(!/AI assistance/i.test(html), "no AI attribution");
ok(html.indexOf('id="remember"') > -1, "opt-in remember");
ok(/npci\.org\.in\/product\/autopay/.test(html), "NPCI source cited in-page");
ok(/hdfc\.bank\.in\/payments\/services\/cancel-upi-autopay-mandate/.test(html), "HDFC source cited in-page");
ok(/rbi\.org\.in\/scripts\/FS_Notification\.aspx\?Id=11784/.test(html), "RBI circular cited in-page");
ok(/read 23 Nov 2026/.test(html), "access dates stamped");
ok(!/Google Pay.{0,40}(tap|click|open).{0,40}(profile|menu)/i.test(html), "no invented per-app click path");
ok(/Stopping the money is not ending the agreement behind it/.test(html), "mandate-vs-agreement warning present before guidance");
ok(/a loan cannot simply be ended/.test(html), "loan handled as repayment-method agreement, not generic cancellation");
ok(/still needs cancelling with the merchant/.test(html), "subscription cancellation distinguished from loan");
ok(/confirm with the app or bank when the stop actually takes effect/.test(html), "timing caveat for pending debits");
ok(/usually with your <b>UPI PIN<\/b>/.test(html), "PIN framed as usual, not universal");
ok(/extra authentication step at revocation/.test(html), "AFA grounding for PIN step");
ok(/ask what mandate-revocation route it offers/.test(html), "bank route narrowed to ask-your-bank");
ok(!/net banking, app or branch - can act on a mandate/.test(html), "overbroad bank capability claim removed");
ok(html.indexOf("Stopping the money") < html.indexOf("Route 1"), "contract warning precedes route 1");
ok(/cannot be cancelled through the UPI app/.test(html) && /loan repayment/.test(html), "non-revocable mandate caveat present");
ok(/at least 24 hours before a debit/.test(html) && /2-3 days before/.test(html), "timing caveat present");

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
