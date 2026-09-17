'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const x=JSON.parse(read('x-register.json'));
const media=JSON.parse(read('media-register.json'));
const html=read('index.html');
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s).toISOString().slice(0,10)===s;
const mediaIds=new Set(media.records.map(r=>r.id));
const sourceIds=new Set(media.sources.map(s=>s.id));

test('X recovery counts describe actual records separately from source totals',()=>{
 assert.equal(x.schema_version,1);
 assert.equal(x.records.length,12);
 assert.equal(new Set(x.records.map(r=>r.id)).size,12);
 assert.equal(x.coverage.recovered_records_in_this_file,x.records.length);
 assert.equal(x.coverage.recovered_records_with_platform_id,x.records.filter(r=>r.platform_id!==null).length);
 assert.equal(x.coverage.recovered_records_with_platform_id,11);
 assert.equal(Object.values(x.coverage.source_reported_x_counts).reduce((a,b)=>a+b,0),611);
 assert.equal(x.coverage.source_reported_total_after_2021,611);
 assert.equal(x.coverage.all_611_records_individually_recovered,false);
 assert.equal(x.coverage.native_x_full_export_recovered,false);
 assert.equal(x.coverage.old_corpus_snapshot_changed,false);
});

test('X source dates and canonical identifiers remain explicit',()=>{
 for(const r of x.records){
  assert.ok(validDate(r.displayed_date));
  assert.ok(r.displayed_date<=x.edition_date);
  assert.ok(r.source_urls.length>0);
  for(const u of r.source_urls)assert.equal(new URL(u).protocol,'https:');
  if(r.platform_id!==null){assert.match(r.platform_id,/^[0-9]+$/);assert.ok(r.original_url.endsWith('/'+r.platform_id));}
  else assert.equal(r.original_url,null);
  assert.ok(r.description&&r.research_use&&r.review_task);
 }
});

test('Reposts preserve upstream accounts without fabricated wrapper timestamps',()=>{
 const reposts=x.records.filter(r=>r.distribution_type==='archive_marked_repost');
 assert.equal(reposts.length,4);
 assert.deepEqual(reposts.map(r=>r.upstream_author).sort(),['@DanScavino','@FoxNews','@MELANIATRUMP','@THR'].sort());
 for(const r of reposts){assert.equal(r.upstream_post_id,null);assert.equal(r.trump_reshare_timestamp,null);}
 const mixed=x.records.find(r=>r.id==='x-20260124-weather');
 assert.equal(mixed.upstream_author,'@NWS');
 assert.equal(x.defaults.native_share_wrapper_captured,false);
});

test('The eight exposed 2026 X entries do not close the later coverage gap',()=>{
 assert.equal(x.records.filter(r=>r.displayed_date.startsWith('2026')).length,8);
 assert.equal(x.coverage.latest_x_record_seen_in_source,'2026-02-02');
 assert.equal(x.coverage.source_coverage_after_latest_x_record,'not_established');
 assert.equal(x.coverage.direct_native_bodies_retrieved,0);
});

test('Image records and editorial reading order resolve without duplicates',()=>{
 assert.equal(media.schema_version,1);
 assert.equal(media.records.length,9);
 assert.equal(mediaIds.size,9);
 assert.equal(media.editorial_priority_order.length,9);
 assert.equal(new Set(media.editorial_priority_order).size,9);
 for(const id of media.editorial_priority_order)assert.ok(mediaIds.has(id));
 assert.equal(media.circulation_relationships.length,3);
 for(const r of media.records){
  assert.ok(validDate(r.date_eastern));
  assert.match(r.time_eastern,/^\d{2}:\d{2}$/);
  assert.match(r.post_id,/^[0-9]+$/);
  assert.ok(r.original_url.endsWith('/'+r.post_id));
  assert.ok(r.motifs.length&&r.passage_refs.length&&r.interpretive_relevance);
 }
});

test('Every media source and circulation destination is present',()=>{
 assert.equal(sourceIds.size,media.sources.length);
 for(const s of media.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.type&&s.access);}
 for(const r of media.records)for(const id of r.source_ids)assert.ok(sourceIds.has(id));
 for(const edge of media.circulation_relationships){
  if(edge.to_record_id)assert.ok(mediaIds.has(edge.to_record_id));
  if(edge.from_record_id)assert.ok(mediaIds.has(edge.from_record_id));
  for(const id of edge.source_ids||[])assert.ok(sourceIds.has(id));
  assert.ok(edge.qualification);
 }
});

test('Earlier variants, screenshot quotations and official amplification stay distinct',()=>{
 const byId=new Map(media.circulation_relationships.map(r=>[r.id,r]));
 assert.equal(byId.get('edge-healer-earlier-version').direct_reshare_chain_proven,false);
 assert.equal(byId.get('edge-embrace-screenshot').direct_reshare_chain_proven,true);
 assert.equal(byId.get('edge-embrace-screenshot').from_url,null);
 assert.equal(byId.get('edge-pope-whitehouse').to_account,'@WhiteHouse');
 assert.equal(byId.get('edge-pope-whitehouse').exact_timestamp,null);
 assert.equal(media.defaults.original_artist,null);
});

test('Visual inspection, account attribution and image preservation are not conflated',()=>{
 assert.equal(media.defaults.native_platform_body_captured,false);
 assert.equal(media.defaults.local_asset_bytes_preserved,false);
 assert.equal(media.defaults.image_sha256,null);
 assert.equal(media.defaults.actual_military_or_supernatural_event_claimed,false);
 for(const r of media.records)assert.ok(r.description_basis&&r.distribution_type);
 assert.match(media.records.find(r=>r.id==='m-general-20260906').description_basis,/retrieval failed/);
 assert.match(media.records.find(r=>r.id==='m-throne-20260906').description_basis,/retrieval failed/);
 assert.match(media.records.find(r=>r.id==='m-button-20260517').description_basis,/visually inspected/);
});

test('The static reader links every selected image without executing scripts or fetching images automatically',()=>{
 assert.doesNotMatch(html,/<script\b|<iframe\b|<img\b|\bon[a-z]+\s*=/i);
 assert.match(html,/<html lang="en">/);
 assert.match(html,/name="viewport"/);
 for(const id of media.editorial_priority_order)assert.ok(html.includes('id="'+id+'"'));
 for(const f of ['README.md','x-register.json','media-register.json','INTERPRETIVE-NOTE.md']){
  assert.ok(fs.existsSync(path.join(__dirname,f)));
  assert.ok(html.includes('href="'+f+'"'));
 }
 assert.ok(read('../corpus-review/README.md').includes('../x-media/index.html'));
});

test('The earlier coverage and contextual collections retain their original counts',()=>{
 const oldSummary=JSON.parse(read('../corpus-review/results/summary.json'));
 const oldReview=JSON.parse(read('../corpus-review/reviewed.json'));
 const oldPosts=JSON.parse(read('../truth-social/posts.json'));
 assert.equal(oldSummary.total_unique_screened,92883);
 assert.equal(oldReview.records.length,28);
 assert.equal(oldPosts.posts.length,22);
 assert.equal(oldReview.records.length+oldPosts.posts.length,50);
});
