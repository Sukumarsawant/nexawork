import assert from 'node:assert/strict';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';

import { localSupabaseConfig } from './local-supabase.mjs';

const { url, anonKey } = localSupabaseConfig();

const runId = `db-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = 'local-only-password-123';

function newClient() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function expectOk(error, label) {
  assert.equal(error, null, `${label}: ${error?.message || 'unknown error'}`);
}

async function createAccount(label, role, name) {
  const supabase = newClient();
  const email = `${label}.${runId}@example.test`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, name } },
  });
  expectOk(error, `sign up ${label}`);
  assert.ok(data.user, `sign up ${label} returns a user`);

  const session = data.session || (await supabase.auth.signInWithPassword({ email, password })).data.session;
  assert.ok(session, `local auth returns a session for ${label}`);
  const { error: sessionError } = await supabase.auth.setSession(session);
  expectOk(sessionError, `set ${label} session`);
  return { supabase, id: data.user.id };
}

async function ownProfile(account, label) {
  const { data, error } = await account.supabase.from('profiles').select('*').eq('id', account.id).single();
  expectOk(error, `${label} reads its profile`);
  return data;
}

const studentA = await createAccount('student-a', 'student', 'Student A');
const studentB = await createAccount('student-b', 'student', 'Student B');
const business = await createAccount('business', 'business', 'Business Owner');

const profileA = await ownProfile(studentA, 'student A');
const profileBusiness = await ownProfile(business, 'business');
assert.equal(profileA.role, 'student', 'signup trigger bootstraps student role once');
assert.equal(profileBusiness.role, 'business', 'signup trigger bootstraps business role once');
assert.equal(profileA.name, 'Student A', 'signup trigger preserves supplied display name');
const { error: duplicateBootstrapError } = await studentA.supabase.rpc('bootstrap_profile', {
  chosen_role: 'business', display_name: 'Attempted role change',
});
assert.ok(duplicateBootstrapError, 'bootstrap RPC cannot overwrite an established profile');

// This local-only fixture models a pre-existing oversized post. Re-adding the
// constraint as NOT VALID must preserve the row while continuing to reject new
// oversized content.
const legacyPostId = crypto.randomUUID();
execFileSync('docker', [
  'exec', '-i', 'supabase_db_nexawork', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
], {
  input: `
    begin;
    alter table public.community_posts drop constraint if exists community_posts_content_or_image;
    alter table public.community_posts disable trigger validate_post_image;
    insert into public.community_posts (id, user_id, content, image_url)
    values ('${legacyPostId}', '${studentA.id}', repeat('legacy-content-', 250), 'https://legacy.example/image.png');
    alter table public.community_posts add constraint community_posts_content_or_image check (
      char_length(content) <= 3000 and (
        char_length(btrim(content)) > 0
        or nullif(btrim(coalesce(image_url, '')), '') is not null
        or nullif(btrim(coalesce(image_path, '')), '') is not null
      )
    ) not valid;
    alter table public.community_posts enable trigger validate_post_image;
    commit;
  `,
  stdio: 'pipe',
});
const { data: legacyFeed, error: legacyFeedError } = await studentA.supabase.rpc('feed_page', { page_size: 50 });
expectOk(legacyFeedError, 'feed reads preservation fixture');
const legacyPost = legacyFeed.items.find((item) => item.id === legacyPostId);
assert.ok(legacyPost, 'legacy oversized post remains readable');
assert.equal(legacyPost.image_url, 'https://legacy.example/image.png', 'legacy image URL remains readable');

const { data: crossProfile, error: crossProfileError } = await studentB.supabase
  .from('profiles').select('id,role,badges,email_verified,avg_rating').eq('id', studentA.id);
expectOk(crossProfileError, 'other student profile projection is blocked rather than failing');
assert.equal(crossProfile.length, 0, 'profiles are owner-readable only');

const { error: editableProfileError } = await studentA.supabase
  .from('profiles').update({ bio: 'Synthetic local biography' }).eq('id', studentA.id);
expectOk(editableProfileError, 'owner can update editable profile columns');
const { error: roleMutationError } = await studentA.supabase
  .from('profiles').update({ role: 'business' }).eq('id', studentA.id);
assert.ok(roleMutationError, 'owner cannot change role');
const { error: badgeMutationError } = await studentA.supabase
  .from('profiles').update({ badges: ['figma'] }).eq('id', studentA.id);
assert.ok(badgeMutationError, 'owner cannot directly award badges');

const postIds = Array.from({ length: 3 }, () => crypto.randomUUID());
for (const [index, id] of postIds.entries()) {
  const { error } = await studentA.supabase.from('community_posts').insert({
    id,
    user_id: studentA.id,
    content: `Synthetic post ${index + 1}`,
  });
  expectOk(error, `student inserts post ${index + 1}`);
}
const { error: oversizedPostError } = await studentA.supabase.from('community_posts').insert({
  id: crypto.randomUUID(), user_id: studentA.id, content: 'x'.repeat(3001),
});
assert.ok(oversizedPostError, 'new oversized post is rejected');
const { error: oversizedImagePostError } = await studentA.supabase.from('community_posts').insert({
  id: crypto.randomUUID(), user_id: studentA.id, content: 'x'.repeat(3001), image_url: 'https://example.test/image.png',
});
assert.ok(oversizedImagePostError, 'an image cannot bypass the post length limit');

const { data: businessFeed, error: businessFeedError } = await business.supabase.rpc('feed_page', { page_size: 1 });
assert.ok(businessFeedError, 'business cannot call student feed RPC');
assert.equal(businessFeed, null, 'business receives no feed payload');

const { data: firstFeed, error: firstFeedError } = await studentB.supabase.rpc('feed_page', { page_size: 2 });
expectOk(firstFeedError, 'student feed page');
assert.equal(firstFeed.items.length, 2, 'feed honors page size');
assert.equal(typeof firstFeed.items[0].like_count, 'number', 'feed normalizes like count');
assert.equal(typeof firstFeed.items[0].comment_count, 'number', 'feed normalizes comment count');
assert.equal(typeof firstFeed.items[0].liked_by_me, 'boolean', 'feed normalizes caller like state');
assert.deepEqual(Object.keys(firstFeed.items[0].author).sort(), ['id', 'name', 'profile_image_url', 'username'], 'feed exposes only minimal author fields');
assert.ok(firstFeed.next_cursor, 'feed emits a continuation cursor when more rows exist');

const { data: secondFeed, error: secondFeedError } = await studentB.supabase.rpc('feed_page', {
  before_created_at: firstFeed.next_cursor.created_at,
  before_id: firstFeed.next_cursor.id,
  page_size: 2,
});
expectOk(secondFeedError, 'second feed page');
assert.ok(secondFeed.items.length >= 1, 'feed cursor advances');
assert.ok(!secondFeed.items.some((item) => firstFeed.items.some((first) => first.id === item.id)), 'feed pages do not repeat rows');

const targetPost = postIds[0];
await studentB.supabase
  .from('community_posts').update({ content: 'not allowed' }).eq('id', targetPost);
const { data: originalPost, error: originalPostError } = await studentA.supabase
  .from('community_posts').select('content').eq('id', targetPost).single();
expectOk(originalPostError, 'owner re-reads post');
assert.equal(originalPost.content, 'Synthetic post 1', 'cross-user update did not change the post');

const { data: firstLike, error: firstLikeError } = await studentB.supabase.rpc('like_post', { p_post_id: targetPost });
expectOk(firstLikeError, 'first like');
const { data: repeatedLike, error: repeatedLikeError } = await studentB.supabase.rpc('like_post', { p_post_id: targetPost });
expectOk(repeatedLikeError, 'repeated like');
assert.deepEqual(firstLike, repeatedLike, 'duplicate likes are idempotent');
const { data: likedFeed, error: likedFeedError } = await studentB.supabase.rpc('feed_page', { page_size: 50 });
expectOk(likedFeedError, 'feed after like');
const likedPost = likedFeed.items.find((item) => item.id === targetPost);
assert.equal(likedPost.like_count, 1, 'idempotent like stores one row');
assert.equal(likedPost.liked_by_me, true, 'feed reflects caller like state');

const commentIds = Array.from({ length: 3 }, () => crypto.randomUUID());
for (const [index, id] of commentIds.entries()) {
  const { error } = await studentB.supabase.from('community_post_comments').insert({
    id,
    post_id: targetPost,
    user_id: studentB.id,
    content: `Synthetic comment ${index + 1}`,
  });
  expectOk(error, `student inserts comment ${index + 1}`);
}
const { error: emptyCommentError } = await studentB.supabase.from('community_post_comments').insert({
  id: crypto.randomUUID(), post_id: targetPost, user_id: studentB.id, content: '   ',
});
assert.ok(emptyCommentError, 'empty comment is rejected');
const { error: longCommentError } = await studentB.supabase.from('community_post_comments').insert({
  id: crypto.randomUUID(), post_id: targetPost, user_id: studentB.id, content: 'x'.repeat(1001),
});
assert.ok(longCommentError, 'oversized comment is rejected');

const { data: firstComments, error: firstCommentsError } = await studentA.supabase.rpc('comment_page', { post_id: targetPost, page_size: 2 });
expectOk(firstCommentsError, 'first comment page');
assert.equal(firstComments.items.length, 2, 'comment page honors page size');
assert.ok(firstComments.next_cursor, 'comment page emits a continuation cursor');
const { data: secondComments, error: secondCommentsError } = await studentA.supabase.rpc('comment_page', {
  post_id: targetPost,
  after_created_at: firstComments.next_cursor.created_at,
  after_id: firstComments.next_cursor.id,
  page_size: 2,
});
expectOk(secondCommentsError, 'second comment page');
assert.equal(secondComments.items.length, 1, 'comment cursor advances without duplicates');

const image = new Blob(['synthetic-image'], { type: 'image/png' });
const ownPath = `${studentA.id}/${crypto.randomUUID()}.png`;
const { error: ownUploadError } = await studentA.supabase.storage.from('community-images').upload(ownPath, image, { contentType: 'image/png' });
expectOk(ownUploadError, 'owner uploads under their UUID folder');
for (const refs of [{image_path:'bogus'},{image_path:`${studentB.id}/borrowed.png`},{image_url:'https://example.test/tracking.png'}]) {
  const {error}=await studentA.supabase.from('community_posts').insert({id:crypto.randomUUID(),user_id:studentA.id,content:'',...refs});
  assert.ok(error,'new image references must be owned existing objects');
}
const ownedImagePost=crypto.randomUUID();
const {data:ownedImageRow,error:ownedImageError}=await studentA.supabase.from('community_posts').insert({
  id:ownedImagePost,user_id:studentA.id,content:'',image_path:ownPath,image_url:'https://example.test/untrusted.png',
}).select('id,image_path,image_url').single();
expectOk(ownedImageError,'owned existing object accepted as image-only post');
assert.equal(ownedImageRow.image_url,null,'new images use a validated path, not an arbitrary remote URL');
await studentA.supabase.storage.from('community-images').remove([ownPath]);
const {data:protectedImage,error:protectedImageError}=await studentA.supabase.storage.from('community-images').download(ownPath);
expectOk(protectedImageError,'published object remains available after attempted cleanup');
assert.ok(protectedImage);
expectOk((await studentA.supabase.from('community_posts').delete().eq('id',ownedImagePost)).error,'owner removes image-post fixture');
expectOk((await studentA.supabase.storage.from('community-images').remove([ownPath])).error,'unreferenced owned object cleanup');
const { error: crossUploadError } = await studentB.supabase.storage
  .from('community-images').upload(`${studentA.id}/${crypto.randomUUID()}.png`, image, { contentType: 'image/png' });
assert.ok(crossUploadError, 'other user cannot upload into an owner folder');

const { data: browseRows, error: browseError } = await business.supabase.rpc('browse_students', { page_size: 100 });
expectOk(browseError, 'business browses student projection');
const browsedStudent = browseRows.find((row) => row.id === studentA.id);
assert.ok(browsedStudent, 'business projection includes students');
assert.ok('availability_status' in browsedStudent, 'business projection includes availability status');
assert.equal('resume_url' in browsedStudent, false, 'business projection excludes private resume URLs');
assert.equal('badges' in browsedStudent, false, 'business projection excludes trust flags');
const { error: studentBrowseError } = await studentA.supabase.rpc('browse_students', { page_size: 100 });
assert.ok(studentBrowseError, 'students cannot call business browse projection');

const {error:nullBadgeError}=await studentA.supabase.rpc('award_practice_badge',{quiz_id:null});
assert.ok(nullBadgeError,'null practice IDs are rejected before modifying badges');
const { data: firstBadge, error: firstBadgeError } = await studentA.supabase.rpc('award_practice_badge', { quiz_id: 'figma' });
expectOk(firstBadgeError, 'award allowed practice badge');
const { data: repeatedBadge, error: repeatedBadgeError } = await studentA.supabase.rpc('award_practice_badge', { quiz_id: 'figma' });
expectOk(repeatedBadgeError, 'repeat practice badge award');
assert.deepEqual(firstBadge.badges, repeatedBadge.badges, 'practice badge award is idempotent');
assert.equal(repeatedBadge.badges.filter((badge) => badge === 'figma').length, 1, 'practice badge appears once');
const { error: invalidBadgeError } = await studentA.supabase.rpc('award_practice_badge', { quiz_id: 'arbitrary-client-value' });
assert.ok(invalidBadgeError, 'unknown practice badge is rejected');

const { error: projectError } = await studentA.supabase.from('projects').insert({
  user_id: studentA.id, title: 'Compatibility project', description: 'Synthetic baseline record', technologies: ['React'],
});
expectOk(projectError, 'projects baseline remains writable by owner');
const { data: job, error: jobError } = await business.supabase.from('jobs').insert({
  posted_by: business.id, title: 'Compatibility job', description: 'Synthetic baseline record', company_name: 'Nexawork Local',
}).select('id').single();
expectOk(jobError, 'jobs baseline remains writable by business owner');
const { error: proposalError } = await studentA.supabase.from('proposals').insert({
  job_id: job.id, submitted_by: studentA.id, cover_letter: 'Synthetic proposal', total_quote: 100, delivery_time: 2,
});
expectOk(proposalError, 'proposals baseline remains writable by student owner');
const { data: businessProposals, error: businessProposalsError } = await business.supabase
  .from('proposals').select('id,submitted_by,job_owner_id').eq('job_id', job.id);
expectOk(businessProposalsError, 'job owner reads proposals for its job');
assert.equal(businessProposals.length, 1, 'proposal ownership is derived from the job owner');
assert.equal(businessProposals[0].job_owner_id, business.id, 'derived proposal owner is correct');

// Business dashboards show only their owner's records. Open jobs remain discoverable
// to signed-in users by design; dashboard ownership is an additional query filter.
const businessB = await createAccount('business-b', 'business', 'Business B');
const { data: jobB, error: jobBError } = await businessB.supabase.from('jobs').insert({
  posted_by: businessB.id, title: 'Other business opening',
}).select('id').single();
expectOk(jobBError, 'business B creates its own job');
const { error: proposalBError } = await studentB.supabase.from('proposals').insert({
  job_id: jobB.id, submitted_by: studentB.id, cover_letter: 'Other business proposal',
});
expectOk(proposalBError, 'student submits to business B');
const contractA = crypto.randomUUID();
const contractB = crypto.randomUUID();
const paymentA = crypto.randomUUID();
const paymentB = crypto.randomUUID();
execFileSync('docker', ['exec', '-i', 'supabase_db_nexawork', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], {
  input: `
    insert into public.contracts (id,job_id,student_id,business_id,title,budget,due_date) values
    ('${contractA}','${job.id}','${studentA.id}','${business.id}','Synthetic contract A',100,'2027-01-01'),
    ('${contractB}','${jobB.id}','${studentB.id}','${businessB.id}','Synthetic contract B',200,'2027-01-01');
    insert into public.payments (id,contract_id,business_id,student_id,amount) values
    ('${paymentA}','${contractA}','${business.id}','${studentA.id}',100),
    ('${paymentB}','${contractB}','${businessB.id}','${studentB.id}',200);
  `, stdio: 'pipe',
});
for (const [table, foreignId] of [['contracts', contractB], ['payments', paymentB]]) {
  const { data, error } = await business.supabase.from(table).select('id').eq('id', foreignId);
  expectOk(error, `${table} cross-business query returns no private data`);
  assert.equal(data.length, 0, `business A cannot read business B ${table}`);
  const { data: ownRows, error: ownError } = await business.supabase.from(table).select('id').eq('business_id', business.id).limit(5);
  expectOk(ownError, `business A reads own ${table}`);
  assert.equal(ownRows.length, 1, `business A sees its own ${table} only`);
}
const { data: otherProposals, error: otherProposalsError } = await business.supabase.from('proposals').select('id').eq('job_owner_id', businessB.id);
expectOk(otherProposalsError, 'business proposal isolation query');
assert.equal(otherProposals.length, 0, 'other business proposals remain private');
const { data: ownJobs, error: ownJobsError } = await business.supabase.from('jobs').select('id').eq('posted_by', business.id).limit(5);
expectOk(ownJobsError, 'owner-filtered dashboard jobs');
assert.equal(ownJobs.some(row => row.id === jobB.id), false, 'dashboard jobs exclude other business');
const { error: forgePayment } = await business.supabase.from('payments').insert({ business_id: business.id, student_id: studentA.id, amount: 999 });
assert.ok(forgePayment, 'read-only payment records cannot be forged by normal clients');
const { error: approveOwnProposal } = await studentA.supabase.from('proposals').update({status:'accepted'}).eq('job_id',job.id);
assert.ok(approveOwnProposal, 'students cannot approve their own proposals');

const grants = execFileSync('docker',['exec','-i','supabase_db_nexawork','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'],{
  input: `select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('bootstrap_profile','feed_page','comment_page','like_post','unlike_post','browse_students','award_practice_badge')
    and has_function_privilege('anon',p.oid,'execute');`,encoding:'utf8',stdio:['pipe','pipe','pipe']
}).trim();
assert.equal(grants,'0','anonymous callers have no effective restricted-RPC execution grant');
// Concurrency regression: policy visibility alone cannot see an uncommitted post.
// The storage FK must serialize a concurrent delete and reject it after publication.
const racePath=`${studentA.id}/${crypto.randomUUID()}.png`;
expectOk((await studentA.supabase.storage.from('community-images').upload(racePath,image,{contentType:'image/png'})).error,'upload concurrent-reference fixture');
const racePost=crypto.randomUUID();
const lockKey=Math.floor(Math.random()*1000000000)+1;
const psqlArgs=['exec','-i','supabase_db_nexawork','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1'];
const runPsql=(sql)=>promisify(execFile)('docker',[...psqlArgs,'-c',sql],{timeout:15000,maxBuffer:1024*1024});
const publishing=runPsql(`begin; insert into public.community_posts(id,user_id,content,image_path) values ('${racePost}','${studentA.id}','','${racePath}'); select pg_advisory_xact_lock(${lockKey}); select pg_sleep(3); commit;`);
let publishingReady=false;
for(let attempt=0;attempt<30;attempt++) {
  const {stdout}=await runPsql(`select exists(select 1 from pg_locks where locktype='advisory' and objid=${lockKey} and granted);`);
  if(stdout.trim()==='t'){publishingReady=true;break;}
  await new Promise(resolve=>setTimeout(resolve,50));
}
assert.ok(publishingReady,'post transaction reaches its uncommitted-reference checkpoint');
let deletionError;
try {await runPsql(`begin; set local storage.allow_delete_query='true'; delete from storage.objects where bucket_id='community-images' and name='${racePath}'; commit;`);} catch(error){deletionError=error;}
await publishing;
assert.ok(deletionError?.stderr?.includes('community_post_image_object_fk'),'concurrent cleanup cannot delete an image referenced by an in-flight post');
expectOk((await studentA.supabase.storage.from('community-images').download(racePath)).error,'concurrently referenced image remains retrievable');
expectOk((await studentA.supabase.from('community_posts').delete().eq('id',racePost)).error,'remove concurrent-reference fixture');
expectOk((await studentA.supabase.storage.from('community-images').remove([racePath])).error,'cleanup no-longer-referenced image');
console.log('Local database integration checks passed.');
