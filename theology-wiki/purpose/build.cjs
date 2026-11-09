'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const letter=read('letter.txt'), map=JSON.parse(read('reading-map.json'));
const a=l=>`<a href="${esc(l.href)}">${esc(l.label)}</a>`;
const banner=`<!-- theology-purpose-intro:start -->
    <section class="purpose-entry" aria-labelledby="purpose-entry-title">
      <p class="purpose-entry-kicker">Start here</p>
      <h2 id="purpose-entry-title">Why this wiki exists</h2>
      <p class="purpose-entry-quote">“I'm searching for the Unorthodox Interpretation that changes the Orthodox Interpretation.”</p>
      <p class="purpose-entry-context">Read the purpose letter, then follow how the wiki’s historical, comparative and practical inquiries contribute to justice, peace and healing.</p>
      <a class="purpose-entry-link" href="./purpose/index.html">Read the letter &amp; explore the wiki →</a>
    </section>
<!-- theology-purpose-intro:end -->
`;
const assets='<!-- theology-purpose-assets --><link rel="stylesheet" href="./purpose/entrance.css?v=20261109">\n';
function render(){
const paragraphs=letter.trimEnd().split('\n\n');
return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Why this wiki exists | Theology Wiki</title>
<meta name="description" content="A purpose letter and a reading map through the Theology Wiki: recovering teachings, questioning inherited interpretations, and working toward justice, peace and healing.">
<link rel="canonical" href="https://v5ma.github.io/theology-wiki/purpose/index.html">
<link rel="stylesheet" href="purpose.css">
</head>
<body>
<a class="skip" href="#main">Skip to the purpose letter</a>
<header class="masthead"><a class="brand" href="../san-reader.html">Theology Wiki</a><nav aria-label="Wiki navigation"><a href="index.html" aria-current="page">Start here</a><a href="../latest/index.html">Latest</a><a href="../san-reader.html?page=sources-index">Conversations</a><a href="../san-reader.html?page=research-method">Research method</a></nav></header>
<div class="hero"><div><p class="eyebrow">A letter at the entrance to the inquiry</p><h1>Why this wiki exists</h1><p class="thesis">“I'm searching for the Unorthodox Interpretation that changes the Orthodox Interpretation.”</p><p class="hero-note">Recovering teachings. Reconsidering inherited interpretations. Working toward justice, peace and healing.</p></div><aside class="route-note"><span class="route-number">01 → 08</span><p>One purpose.<br>Eight ways into the library.</p><a href="#reading-map">See how the parts connect ↓</a></aside></div>
<nav class="contents" aria-label="On this page"><a href="#letter">The purpose letter</a><a href="#reading-map">How the wiki contributes</a><a href="#method">How to read the inquiry</a><a href="#begin">A first reading path</a></nav>
<main id="main">
<section id="letter" class="letter-section" aria-labelledby="letter-title"><div class="section-heading"><p class="eyebrow">The purpose letter · November 9, 2026</p><h2 id="letter-title">What I hope to accomplish</h2><p class="editorial-note">The letter below is preserved in full as selected for this page, with its original wording and paragraph order. The reading map that follows is a new guide connecting it to the existing wiki.</p></div><blockquote class="letter" cite="letter.txt">${paragraphs.map((p,i)=>`<p${i===4?' class="letter-thesis"':''}>${esc(p)}</p>`).join('\n')}</blockquote><p class="source-note"><a href="letter.txt">Read the plain-text letter</a> · <a href="source-integrity.json">Publication and text-preservation record</a></p></section>
<section id="reading-map" aria-labelledby="map-title"><div class="section-heading"><p class="eyebrow">From the letter to the library</p><h2 id="map-title">How each part contributes</h2><p>The letter gives the inquiry a direction: recover what was taught, examine how interpretations changed, and ask what that understanding calls us to do. The wiki’s eight topic collections approach these questions from different places.</p><p>They also contain competing hypotheses, independent religious traditions and arguments that may challenge one another. The connections below explain why a section belongs in the inquiry while leaving those differences available for examination.</p></div><div class="map-grid">${map.map((s,i)=>`<article id="${esc(s.id)}" class="map-card"><p class="card-number">${String(i+1).padStart(2,'0')} / ${esc(s.title)}</p><h3>${esc(s.question)}</h3><p>${esc(s.contribution)}</p><ul>${s.links.map(l=>`<li>${a(l)}</li>`).join('')}</ul><a class="topic-link" href="../san-reader.html?page=${esc(s.topic)}">Browse all: ${esc(s.title)} →</a></article>`).join('\n')}</div></section>
<section id="method" class="method" aria-labelledby="method-title"><p class="eyebrow">An inquiry that can be corrected</p><h2 id="method-title">How to read the inquiry</h2><p>The letter states a purpose and a theological conviction. Its questions about corruption, exclusion and empire call for investigation of specific texts, communities and decisions. Each historical explanation has to account for both supporting evidence and evidence that resists it.</p><ol><li><strong>Read the witness.</strong> Distinguish what a source says from the historical explanation inferred from it. Compare canonical and noncanonical texts with attention to genre, dating and transmission.</li><li><strong>Keep the alternatives visible.</strong> An earlier source, a later surviving copy, a shared theme and a demonstrated line of transmission answer different questions. A minority interpretation deserves examination on its evidence.</li><li><strong>Ask what changes.</strong> Trace how a reading affects conduct, institutions and the work of repair, and what new evidence would make us revise it.</li></ol><p><a href="../jesus-resurrection-empire-20261109/purpose-and-unorthodox-interpretation.html">Read the expanded inquiry into unorthodox interpretation, canon and empire</a>, then consult the <a href="../san-reader.html?page=research-method">editorial method</a>, <a href="../comparative-religion/claim-audit.html">comparative claim audit</a> and <a href="../san-reader.html?page=source-atlas">source atlas</a>.</p></section>
<section id="begin" class="begin" aria-labelledby="begin-title"><p class="eyebrow">A first reading path</p><h2 id="begin-title">Carry the question into the wiki</h2><ol><li><a href="../jesus-resurrection-empire-20261109/how-the-argument-developed.html">Follow the development of the argument</a>: Jesus’s teaching, early resurrection beliefs, Paul and the later Gospels.</li><li><a href="../jesus-resurrection-empire-20261109/early-creeds-angels-and-resurrection.html">Examine the earliest creeds and resurrection evidence</a>, then <a href="../jesus-resurrection-empire-20261109/imperial-pressure-and-pilate.html">test the imperial-pressure argument</a>.</li><li><a href="../comparative-religion/index.html">Listen to the comparative witnesses</a> and the differences that matter.</li><li><a href="../san-reader.html?page=apocalyptic-repair-theology">Return to the work of repair</a>: what could this understanding require of us now?</li></ol><p><a href="../san-reader.html?page=connected-arguments">Continue through the book argument map →</a></p></section>
</main><footer><a href="../san-reader.html">Return to the Theology Wiki</a><p>Purpose letter selected for publication on November 9, 2026. Reading map developed with AI assistance. Original articles and source conversations retain their own voices, dates and evidence notes.</p><a href="#letter">Back to the letter ↑</a></footer>
</body></html>\n`;
}
function integrate(html){
 if(!html.includes('<!-- theology-purpose-assets -->'))html=html.replace('</head>',assets+'</head>');
 if(!html.includes('<!-- theology-purpose-intro:start -->')){
 const pos=html.indexOf('    <nav class="wiki-family-strip"');
 if(pos<0)throw Error('Missing reader navigation insertion point');
 html=html.slice(0,pos)+banner+html.slice(pos);
 }
 return html.replace(/(&amp;release=20261106)(?!&amp;purpose)/g,'$1&amp;purpose=20261109');
}
function stripIntegration(html){return html.replace(assets,'').replace(banner,'').replace(/&amp;purpose=20261109/g,'');}
function build(check=false){
 const outputs={'index.html':render()};
 for(const [name,body]of Object.entries(outputs)){
 const file=path.join(__dirname,name);if(check){if(fs.readFileSync(file,'utf8')!==body)throw Error('Stale output: '+file);}else fs.writeFileSync(file,body);
 }
 for(const name of ['index.html','san-reader.html']){
 const file=path.join(ROOT,name),old=fs.readFileSync(file,'utf8'),updated=integrate(old);
 if(check){if(old!==updated)throw Error('Missing reader entrance: '+name);}else fs.writeFileSync(file,updated);
 }
}
if(require.main===module){build(process.argv.includes('--check'));console.log('Purpose letter, reading map and both reader entrances are current.');}
module.exports={render,integrate,stripIntegration,banner,assets};
