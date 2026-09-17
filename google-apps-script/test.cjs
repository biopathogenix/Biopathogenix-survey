const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');
const cache = new Map();
const sent = [];
let quota=100, failSend=false, failPdf=false, failCache=false, released=0;
let pdfHtml='';
const context = {
  console,
  HtmlService:{createHtmlOutput(html) {
    pdfHtml=html;
    return {getAs(type) {
      assert.equal(type,'application/pdf');
      if(failPdf) throw Error('conversion failed');
      return {setName(name) {return {name,type};}};
    }};
  }},
  MailApp:{getRemainingDailyQuota:()=>quota,sendEmail(message) {
    if(failSend) throw Error('send failed');
    sent.push(message);
  }},
  CacheService:{getScriptCache:()=>({get:key=>cache.get(key),put(key,value) {
    if(failCache) throw Error('cache failed');
    cache.set(key,value);
  }})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})}
};
vm.createContext(context);
vm.runInContext(read('EmailTemplate.gs')+'\n'+read('Code.gs'),context);
const response = {
  name:'Test <script>alert(1)</script>',org:'Bio & Test',email:'test@example.com',role:'IT',
  source:'Other: Conference',validationRating:'5',validationComment:'First line\nSecond line',
  fasName:'Venkatesh Kolluru',fasRating:'4',fasComment:'Thank you',
  workflowSuggestions:'x'.repeat(5000),satisfaction:'Very satisfied',
  productsInterested:'Instrumentation; Reagents & consumables',likelihood:'0',
  to:'attacker@example.com',htmlBody:'UNTRUSTED'
};
const id=n=>'12345678-1234-4234-8234-'+String(n).padStart(12,'0');
const result=context.submitSurvey(response,id(1));
assert.equal(result.ok,true);
assert.equal(sent.length,1);
assert.equal(sent[0].to,'venkatesh.kolluru@biopathogenix.com');
assert.equal(sent[0].bcc,'rajeswari.gopu@biopathogenix.com');
assert.equal(sent[0].replyTo,response.email);
assert.equal(sent[0].htmlBody,pdfHtml);
assert(!pdfHtml.includes('<script>'));
assert(!pdfHtml.includes('UNTRUSTED'));
assert(pdfHtml.includes('&lt;script&gt;'));
assert(pdfHtml.includes('First line<br/>Second line'));
assert(pdfHtml.includes('0/10'));
for(let n=1;n<=7;n++) assert(pdfHtml.includes('Q'+n+' &mdash;'));
assert(sent[0].attachments[0].name.endsWith('.pdf'));
assert.equal(context.submitSurvey(response,id(1)).submittedAt,result.submittedAt);
assert.equal(sent.length,1);
assert.throws(()=>context.submitSurvey({...response,name:'Changed'},id(1)),/already sent/);
assert.throws(()=>context.submitSurvey({...response,email:'bad'},id(2)),/valid email/);
assert.throws(()=>context.submitSurvey({...response,fasRating:'9'},id(2)),/ratings/);
assert.throws(()=>context.submitSurvey({...response,workflowSuggestions:'x'.repeat(5001)},id(2)),/too long/);
quota=1;
assert.throws(()=>context.submitSurvey(response,id(2)),/daily email limit/);
quota=100; failPdf=true;
assert.throws(()=>context.submitSurvey(response,id(2)),/conversion failed/);
assert.equal(sent.length,1);
failPdf=false; failSend=true;
assert.throws(()=>context.submitSurvey(response,id(2)),/send failed/);
assert(!cache.has('survey:'+id(2)));
failSend=false;
assert.equal(context.submitSurvey(response,id(2)).ok,true);
failCache=true;
assert.equal(context.submitSurvey(response,id(3)).ok,true);
assert(released>=8);
const page=read('Index.html');
assert(!page.includes('emailjs'));
assert(!page.includes('const PK'));
assert(page.includes('data:image/jpeg;base64,'));
assert(page.includes('.withSuccessHandler(resolve).withFailureHandler(reject)'));
assert(page.includes('sending.current=true'));
assert(page.includes('result.ok !== true'));
assert(page.includes('submissionId.current=crypto.randomUUID()'));
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const template=source.slice(source.indexOf('const esc ='),source.indexOf('const blank ='));
assert(read('EmailTemplate.gs').endsWith(template));
console.log('PASS: original template preserved, same HTML for email/PDF, fixed recipients, escaping, all answers, validation, quota, duplicate retries, failure handling, and client integration.');
