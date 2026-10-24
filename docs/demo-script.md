# College demonstration script (8–10 minutes)

1. Sign in as `owner@docnest.demo` / `DemoPass123!`.
2. Show the dashboard counts coming from the database (initially empty or after seed uploads).
3. Upload `samples/synthetic_pan.png`. Review OCR fields. Correct the holder name if needed. Save.
4. Open the document, verify SHA-256, then run the tamper demo and show `mismatch`.
5. Create a scooter asset and link the uploaded document.
6. Set or confirm an expiry date and open Reminders.
7. Share the document with `guest@docnest.demo` for view-only access with a future expiry.
8. Sign out, sign in as the guest, open the shared document, then show that the repository does not list other household files.
9. Sign back in as owner, revoke the grant, and confirm the guest is denied.
10. Delete the document and show the audit log entry. Mention that an on-chain digest, if used later, would remain.

Do not use real Aadhaar, PAN, or medical documents during evaluation.
