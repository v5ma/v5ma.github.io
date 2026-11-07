'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createRenderer} = require('../../jesus-ethics-20261105/build.cjs');
const source = require('./transcript.json');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prose = (text, id) => createRenderer(new Set(),new Set()).render(text).html.replace(/id="([^"]+)"/g, (_,anchor) => `id="${id}-${anchor}"`).replace(/href="#([^"]+)"/g, (_,anchor) => `href="#${id}-${anchor}"`);
function outputs(data = source) {
  const userTurns = data.turns.filter(t => t.speaker === 'User');
  const toc = userTurns.map(t => `<li><a href="#${esc(t.id)}">${esc(t.topic)}</a></li>`).join('\n');
  const turns = data.turns.map((t,i) => `<section class="turn ${t.speaker === 'User' ? 'user' : 'assistant'}" id="${esc(t.id)}" aria-labelledby="${esc(t.id)}-label">
<div class="turn-header"><h2 id="${esc(t.id)}-label">${esc(t.speaker)} <span>· Turn ${i+1}</span></h2><a class="permalink" href="#${esc(t.id)}" aria-label="Permalink to turn ${i+1}">${esc(t.time)}</a></div>
${t.text ? `<div class="prose original-message">${prose(t.text,t.id)}</div>` : '<p class="attachment-only">Attachment-only message.</p>'}
${(t.attachments || []).map((a,j) => `<aside class="attachment" aria-label="User-provided attachment"><p class="attachment-label">User-provided text · ${esc(a.name)}</p><div class="prose attachment-text">${prose(a.text,t.id+'-attachment-'+j)}</div></aside>`).join('\n')}
</section>`).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="The complete November 6, 2026 conversation about Jesus, Resurrection Theology and imperial capture, with original prompts, replies and supplied texts."><title>${esc(data.title)} | Theology Wiki</title><link rel="stylesheet" href="conversation.css"></head>
<body>
<a class="skip" href="#main">Skip to conversation</a>
<header><p class="eyebrow">Theology Wiki · Conversation record</p><h1>${esc(data.title)}</h1><p class="lede">A dialogue about the historical Jesus, the interpretation of resurrection, and imperial pressure within the Gospel narratives.</p><p class="dates">Conversation: November 6, 2026 · Published: November 7, 2026</p><nav aria-label="Wiki navigation"><a href="../../san-reader.html?page=home">Theology Wiki</a><a href="../../latest/index.html">Latest</a><a href="../../jesus-ethics-20261105/index.html">Jesus, Easter and ethics</a></nav></header>
<main id="main">
<aside class="editorial-note" aria-label="About this transcript"><h2>About this conversation</h2><p>The complete topical exchange is reproduced below in chronological order: six user messages, eleven replies from dot, and two texts supplied as attachments. Prompts and replies retain their original wording, including spelling, quotations, disagreement and uncertainty. The reading view renders Markdown formatting; the <a href="transcript.json">source transcript</a> retains the exact message text.</p><p>Some user messages quote or paste alternative AI responses. Their placement under “User” identifies who supplied the text, not authorship of every sentence or endorsement of every claim. The attached texts are likewise identified as user-provided material.</p><p>This is a conversation record, not an independently fact-checked article. Historical claims, hypotheses and qualifications remain attributed to the relevant turns. The clarification in <a href="#turn-15">turn 15</a> shifts the focus from fourth-century institutions to imperial pressure within Matthew, Mark, Luke and John. Source links remain in the replies where they were cited.</p><p><a href="transcript.md">Read the full Markdown transcript</a> · <a href="README.md">Editorial and preservation notes</a></p></aside>
<nav class="contents" aria-label="Conversation topics"><h2>Follow the questions</h2><ol>${toc}</ol></nav>
<div class="transcript">${turns}</div>
<aside class="related"><h2>Continue the inquiry</h2><ul><li><a href="../../jesus-ethics-20261105/would-jesus-oppose-the-resurrection-gospel.html">Would Jesus Oppose the Resurrection Gospel?</a></li><li><a href="../../jesus-ethics-20261105/early-resurrection-accounts-and-source-criticism.html">Early resurrection accounts and source criticism</a></li><li><a href="../../jesus-ethics-20261105/christianity-after-bodily-resurrection.html">Christianity After Bodily Resurrection?</a></li></ul><p>These related chapters are separate from the transcript above.</p></aside>
</main><footer><a href="../../latest/index.html">Back to Latest additions</a> · <a href="#main">Back to conversation</a><p>The original discussion remains unchanged. Editorial topic labels and navigation are additions for this publication.</p></footer>
</body></html>
`;
  const md = `# ${data.title}\n\nConversation: ${data.conversation_date}. Published: ${data.publication_date}.\n\nComplete topical exchange. Speaker labels identify the sender; user messages may contain pasted AI text. Original message wording is preserved. Source links remain where cited.\n\n` + data.turns.map((t,i) => `## Turn ${i+1}: ${t.speaker} (${t.time})\n\n${t.text}` + (t.attachments||[]).map(a => `\n\n### User-provided attachment: ${a.name}\n\n${a.text}`).join('') + '\n\n').join('');
  return {'index.html':html,'transcript.md':md};
}
if (require.main === module) for (const [name,content] of Object.entries(outputs())) {
  const file = path.join(__dirname,name);
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file,'utf8'),content,'Rebuild '+name);
  else fs.writeFileSync(file,content);
}
module.exports = {outputs,prose};
