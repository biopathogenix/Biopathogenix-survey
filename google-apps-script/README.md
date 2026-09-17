# Google survey: formatted email and attached PDF

This version keeps the existing survey design and uses the original email template
for both the HTML email and the PDF. EmailJS is not used by this version.
The PDF is generated on Google's servers; no PDF subscription or Drive folder is
required. Google may render fonts, rounded corners and page breaks differently
from an email client. Verify the exported PDF after deployment.

The existing GitHub Pages `index.html` remains on the working EmailJS integration
until the Google deployment is ready. Opening `Index.html` directly on GitHub Pages
will not work: `google.script.run` requires Google's HTML-service environment.

## One-time setup

1. Sign into the Google account that should SEND survey emails and open
   https://script.google.com/home/start. Create a **New project** called
   **BioPathogenix Survey**.
2. Replace the default `Code.gs` contents with this folder's **Code.gs**.
3. Click **+** beside Files, choose **Script**, name it **EmailTemplate**, and
   paste **EmailTemplate.gs** into it.
4. Click **+**, choose **HTML**, name it **Index** (capital I), and paste the
   complete **Index.html** into it. There are only three files to paste;
   `build.py` and `test.cjs` are development tools and should not be uploaded.
5. At the top of `Code.gs`, verify the recipient and BCC:
   - To: `venkatesh.kolluru@biopathogenix.com`
   - BCC: `rajeswari.gopu@biopathogenix.com`
   Set `BCC` to an empty string if no copy is wanted. Reply goes to the respondent.
6. Save. Select **checkSetup** in the editor's function menu and click **Run**.
   Authorize the script to send email from your account. This check does not send
   a test email. The execution log shows your remaining recipient allowance.
7. Choose **Deploy > New deployment**, select **Web app**, set
   **Execute as: Me** and **Who has access: Anyone**. Click **Deploy**.
   If your Workspace administrator disallows public deployments, ask them to
   permit it or deploy using an account that allows public web apps.
8. Copy the **Web app URL**, ending in `/exec`, and open it in an incognito window.
   Share that URL with respondents. They do not need to authorize email access.
9. Submit a test response. Confirm both mailboxes receive the formatted email
   with a readable PDF containing the contact information and all seven answers.
   Test long comments, line breaks, special characters, and a recommendation of 0.
10. Send the deployed `/exec` URL to your developer to connect the existing
    GitHub Pages link to the Google version. Until then the old link still uses
    EmailJS and the new Google link sends email plus PDF.

For later changes, save files and use **Deploy > Manage deployments > Edit >
New version > Deploy** to update the existing URL.

## Limits and behavior

- Personal Gmail accounts normally allow 100 email recipients per day through
  Apps Script. With the To and BCC above, each response uses two recipients.
  Other scripts sending from your account share that quota. Workspace quotas
  differ. Google can change quotas.
- The sender is the deploying Google account with display name
  **BioPathogenix Survey**. It does not impersonate the respondent.
- The form only shows success after Google accepts the send. Mailbox delivery
  and spam filtering still depend on the receiving provider.
- Failed sends preserve answers and allow retry. The server checks required
  answers and lengths, fixes recipient addresses, escapes answers in the template,
  and uses a lock and a six-hour cache to reduce duplicate retry emails. Cache
  eviction or an interruption after sending can still cause duplicates.
- This is a public survey without CAPTCHA. It can receive automated submissions,
  which can consume your quota. Consider adding abuse protection before sharing
  widely if this becomes a problem.
- Responses are emailed, not stored in Google Sheets or Google Docs. The existing
  browser-local response list and CSV export remain on the survey device.

## Development checks

Run `python google-apps-script/build.py` to regenerate the Google frontend and
email template after editing the original survey. Run
`node google-apps-script/test.cjs` for local tests with mocked Google services.
Live mail delivery and PDF conversion must be tested in the deployed Google app.

Official references:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/reference/mail/mail-app
- https://developers.google.com/apps-script/reference/html/html-output
- https://developers.google.com/apps-script/guides/services/quotas
