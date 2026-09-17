// Messages are sent from the Google account that deploys this web app.
// Recipients are configured here, never accepted from the public form.
const RECIPIENT = 'venkatesh.kolluru@biopathogenix.com';
const BCC = 'rajeswari.gopu@biopathogenix.com';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('BioPathogenix Client Experience Survey')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Run this once in the editor to authorize sending; it does not send a message.
function checkSetup() {
  const remaining = MailApp.getRemainingDailyQuota();
  console.log('Email recipients remaining today: ' + remaining);
  return remaining;
}

function validateResponse_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid survey response.');
  }
  const limits = {
    name:200, org:200, email:254, role:200, source:1000,
    validationRating:1, validationComment:5000, fasName:100, fasRating:1,
    fasComment:5000, workflowSuggestions:5000, satisfaction:30,
    productsInterested:2000, likelihood:2
  };
  const response = {};
  Object.keys(limits).forEach(function(key) {
    const value = input[key] == null ? '' : input[key];
    if (typeof value !== 'string' || value.length > limits[key]) {
      throw new Error('Invalid or too long answer: ' + key);
    }
    response[key] = value.trim();
  });
  if (!response.name || !response.org || !response.source ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response.email)) {
    throw new Error('Please provide your name, organization, valid email and referral source.');
  }
  if (!/^[1-5]$/.test(response.validationRating) || !/^[1-5]$/.test(response.fasRating) ||
      !/^(?:[0-9]|10)$/.test(response.likelihood)) {
    throw new Error('Please complete all ratings.');
  }
  if (['Venkatesh Kolluru','Norma Drew','Jatinder Sambi'].indexOf(response.fasName) < 0 ||
      ['Very satisfied','Satisfied','Neutral','Dissatisfied','Very dissatisfied'].indexOf(response.satisfaction) < 0) {
    throw new Error('Please select a valid FAS and satisfaction level.');
  }
  return response;
}

function submitSurvey(input, submissionId) {
  if (typeof submissionId !== 'string' || !/^[a-zA-Z0-9-]{20,80}$/.test(submissionId)) {
    throw new Error('Invalid submission ID. Please refresh the survey.');
  }
  const response = validateResponse_(input);
  const fingerprint = JSON.stringify(response);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('The survey is busy. Please try again shortly.');
  try {
    const cache = CacheService.getScriptCache();
    const key = 'survey:' + submissionId;
    const previous = cache.get(key);
    if (previous) {
      const saved = JSON.parse(previous);
      if (saved.fingerprint !== fingerprint) throw new Error('This submission was already sent. Please start a new response.');
      return {ok:true, submittedAt:saved.submittedAt};
    }
    const recipientCount = BCC ? 2 : 1;
    if (MailApp.getRemainingDailyQuota() < recipientCount) {
      throw new Error('The daily email limit has been reached. Please try again tomorrow.');
    }
    response.submittedAt = new Date().toISOString();
    // Both outputs share the original email template, including all seven answers.
    const html = emailHTML(response);
    const pdf = HtmlService.createHtmlOutput(html).getAs('application/pdf')
      .setName('Survey-Response-' + response.submittedAt.replace(/[:.]/g, '-') + '.pdf');
    const message = {
      to:RECIPIENT,
      subject:('New Survey - ' + response.name + ' (' + response.org + ')').replace(/[\r\n]/g,' ').slice(0,200),
      body:'New survey response\n\n' + Object.keys(response).map(function(key) {
        return key + ': ' + response[key];
      }).join('\n'),
      htmlBody:html,
      attachments:[pdf],
      name:'BioPathogenix Survey',
      replyTo:response.email
    };
    if (BCC) message.bcc = BCC;
    MailApp.sendEmail(message);
    // Cache is best effort: an already accepted email must not be reported as failed.
    try {
      cache.put(key, JSON.stringify({fingerprint:fingerprint, submittedAt:response.submittedAt}), 21600);
    } catch (error) {
      console.warn('Submission retry cache unavailable.');
    }
    return {ok:true, submittedAt:response.submittedAt};
  } finally {
    lock.releaseLock();
  }
}
