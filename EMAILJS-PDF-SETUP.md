# Enable survey PDF attachments

The form now generates a PDF from the same `emailHTML` content sent as
`html_content`. The email keeps its existing body and receives the PDF as an
additional attachment once the dashboard configuration below is saved.

Before publishing the updated page, open EmailJS > Email Templates >
`template_1mjq977` > Attachments and add a dynamic attachment:

| Setting | Value |
| --- | --- |
| Attachment type | Variable Attachment |
| Parameter name | `survey_pdf` |
| Filename | `{{pdf_filename}}` |
| Content type | `application/pdf` |

Save the template. Keep `{{{html_content}}}` in the email body to display the
existing response layout. Any extra layout configured only in the EmailJS
dashboard is not available to the PDF generator; add shared layout changes to
`emailHTML` in `index.html` if both should match.

Check that your EmailJS subscription supports attachments and has enough attachment
capacity. Attachment limits depend on the plan. The attachment parameter must be
configured in the dashboard so it is treated as an attachment rather than ordinary
template data (ordinary template variables have a 50 KB combined limit).

Submit a test response after configuration and confirm the email contains both
the formatted response and a readable PDF with all seven questions. Also check a
response with long, multiline comments. The PDF uses A4 pages, so page breaks may
differ from the email. PDF generation happens in the browser and requires the
html2pdf CDN script to load. A generation or sending failure leaves the form filled
in and displays an error for retry.

References:
- https://www.emailjs.com/docs/user-guide/file-attachments/
- https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/
- https://ekoopmans.github.io/html2pdf.js/
