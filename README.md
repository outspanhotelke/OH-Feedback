# The Outspan Hotel Guest Feedback Form

This folder contains the static website for GitHub Pages.

## Files
- `index.html` — guest feedback form
- `style.css` — responsive styling
- `Code.gs` — Google Apps Script backend (deploy separately; GitHub Pages does not run Apps Script)

## 1. Connect Google Apps Script
1. Open `index.html` and find `const SCRIPT_URL = "PASTE_YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE";`.
2. Replace the placeholder with your deployed Google Apps Script Web App URL ending in `/exec`.
3. Save and commit the change.

The Apps Script backend must also be deployed separately. In `Code.gs`, replace `management@yourhotel.com` with the real management email address. Deploy it as a Web app, execute as you, and set access to an option appropriate for guests and permitted by your organisation.

## 2. Publish with GitHub Pages
1. Create a GitHub repository, for example `outspan-guest-feedback`.
2. Upload `index.html`, `style.css`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then click **Save**.
6. Wait for GitHub Pages to publish and open the website URL shown in Settings → Pages.

## Important
GitHub Pages hosts the HTML/CSS/JavaScript only. It does not run `Code.gs`; Google Apps Script receives submissions and sends the email. The current frontend uses `fetch` with `mode: "no-cors"`, so the browser cannot confirm whether the email was delivered. Test by submitting feedback and checking the management inbox and Apps Script execution log.
