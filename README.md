# The Outspan Hotel Guest Feedback Form

This folder contains the website for GitHub Pages and the Google Apps Script backend.

## Files
- `index.html` — guest feedback form
- `style.css` — responsive styling
- `Code.gs` — saves feedback to Google Sheets (and can optionally email management)

## 1. Create and connect the Google Sheet
1. Visit https://script.google.com/ and create a new Apps Script project.
2. Replace the contents of `Code.gs` with the code in this folder's `Code.gs`.
3. Save the project.
4. Select `setupSpreadsheet` in the function dropdown and click **Run**.
5. Approve the requested Google permissions.
6. Open **Execution log** and copy the URL printed after `Feedback spreadsheet URL:`. This is your response spreadsheet. The script stores its ID automatically, so you do not need to paste the ID into the code.
7. The spreadsheet will have a `Guest Feedback` tab. Each form submission adds a new row.

## 2. Deploy the Apps Script web app
1. In Apps Script, click **Deploy → New deployment**.
2. Select the gear icon and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to the option suitable for your guests and permitted by your organisation. Public access may be restricted by Google Workspace administrators.
5. Click **Deploy**, approve permissions if prompted, and copy the Web App URL ending in `/exec`.
6. Open `index.html` and replace `PASTE_YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE` in `SCRIPT_URL` with that URL.
7. Save the file and upload/commit the updated `index.html` to GitHub.

If you change the Apps Script code later, create a new version under **Deploy → Manage deployments → Edit** and deploy the updated version.

## 3. Publish the website with GitHub Pages
1. Create a GitHub repository, for example `outspan-guest-feedback`.
2. Upload `index.html`, `style.css`, and `README.md` to the repository root. `Code.gs` may also be stored there for reference, but it runs only in Google Apps Script.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/(root)`, then click **Save**.
6. Wait for GitHub Pages to publish and open the URL shown on the Pages settings screen.

## Optional: email management as well
By default, submissions are saved to Google Sheets only. To also email management, set `MANAGEMENT_EMAIL` near the top of `Code.gs` to a real email address, save, and redeploy the web app. The first time, Google may ask you to authorise email sending.

## Important notes
- The Apps Script backend and GitHub Pages website are deployed separately.
- The browser code uses `fetch` with `mode: "no-cors"`, so the website cannot read the server's response. It may display a sent message even if the server encounters an error. Confirm submissions by checking the Google Sheet and the Apps Script execution log.
- Do not share edit access to the response spreadsheet with guests. Share it only with authorised hotel staff.
