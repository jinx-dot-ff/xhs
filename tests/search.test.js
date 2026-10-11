'use strict';

// Run with Node.js. No browser, network or third-party modules are needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const base = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(base, 'app/data.js'), 'utf8'), sandbox, { filename: 'data.js' });
// Move the VM-owned arrays and objects into this realm for strict assertions.
const data = JSON.parse(JSON.stringify(sandbox.window.PLZ_DATA));
const notes = data.notes;
const results = [];
let engine;
let seq = 0;

function test(name, fn, needsEngine = true) {
  if (needsEngine && !engine) {
    results.push({ name, status: 'blocked', message: 'Search module could not load' });
    console.log('BLOCKED ' + name);
    return;
  }
  try {
    fn();
    results.push({ name, status: 'passed' });
    console.log('PASS ' + name);
  } catch (error) {
    results.push({ name, status: 'failed', message: error.message });
    console.log('FAIL ' + name + '\n  ' + error.message.replace(/\n/g, '\n  '));
  }
}

function comment(body, extra = {}) {
  return {
    id: 'fixture-' + (++seq), body, kind: 'experience', topics: [], constraints: {},
    publishedAt: '2026-10-10T12:00:00+08:00', replies: [], ...extra
  };
}
function note(comments, extra = {}) { return { id: 'fixture', comments, ...extra }; }
function search(comments, query, mode = 'keyword', extra = {}, options = {}) {
  return engine.search(note(comments, extra), query, mode, options);
}
function hitIds(result) { return result.groups.flatMap(group => group.matches.map(item => item.comment.id)); }
function countTree(comments) { return comments.reduce((count, item) => count + 1 + countTree(item.replies || []), 0); }
function noHits(result) {
  assert.equal(result.status, 'empty');
  assert.equal(result.matchCount, 0);
  assert.equal(result.discussionCount, 0);
}
function includesId(result, id) { assert.ok(hitIds(result).includes(id), 'Expected matched ID ' + id); }
function excludesId(result, id) { assert.ok(!hitIds(result).includes(id), 'Unexpected matched ID ' + id); }

test('data: six fictional scenarios and complete comment counts', () => {
  assert.equal(data.fictional, true);
  assert.equal(notes.length, 6);
  assert.deepEqual(new Set(notes.map(item => item.category)), new Set(['生活', '穿搭', '学习', '出行', '数码', '家居']));
  notes.forEach(item => assert.ok(countTree(item.comments) >= 105, item.id + ' has fewer than 105 stored comments'));
}, false);

test('data: every stored comment has a unique ID', () => {
  const all = [];
  function visit(items) { items.forEach(item => { all.push(item.id); visit(item.replies || []); }); }
  notes.forEach(item => visit(item.comments));
  assert.equal(new Set(all).size, all.length);
}, false);

test('engine: module loads and exports search', () => {
  engine = require(path.join(base, 'app/search.js'));
  assert.equal(typeof engine.search, 'function');
}, false);

test('keyword: AND is satisfied within the same comment only', () => {
  const parent = comment('数学学习', { kind: 'question' });
  parent.replies.push(comment('基础需要补', { replyToId: parent.id }));
  const complete = comment('数学基础需要补');
  const result = search([parent, complete], '数学 基础');
  assert.deepEqual(hitIds(result), [complete.id]);
});

test('keyword: does not expand synonyms', () => {
  noHits(search([comment('店旁边有车位')], '停车'));
});

test('keyword: quoted phrase preserves continuous wording', () => {
  const continuous = comment('数学 基础很重要');
  const separated = comment('数学学习之前先补基础');
  assert.deepEqual(hitIds(search([continuous, separated], '"数学 基础"')), [continuous.id]);
});

test('keyword: unclosed quote is invalid rather than empty', () => {
  const result = search([comment('数学基础')], '"数学');
  assert.equal(result.status, 'invalid');
});

test('keyword: full-width digits normalize to half-width', () => {
  assert.equal(search([comment('身高160cm')], '１６０').matchCount, 1);
});

test('keyword: 160 matches 160cm but excludes 1600 and 2160', () => {
  const exact = comment('身高160cm');
  assert.deepEqual(hitIds(search([exact, comment('花了1600元'), comment('分辨率2160')], '160')), [exact.id]);
});

test('keyword: integer excludes decimals and numeric-equivalent literals', () => {
  noHits(search([comment('身高160.5cm'), comment('尺寸160.0cm')], '160'));
});

test('keyword: decimal only matches the complete decimal', () => {
  const exact = comment('宽度是90.5cm');
  assert.deepEqual(hitIds(search([exact, comment('90.50cm'), comment('190.5cm')], '90.5')), [exact.id]);
});

test('keyword: negative number excludes longer negative numbers', () => {
  const exact = comment('温度-5度');
  assert.deepEqual(hitIds(search([exact, comment('温度-50度'), comment('温度-5.5度')], '-5')), [exact.id]);
});

test('keyword: positive integer does not silently match a negative number', () => {
  noHits(search([comment('温度-5度')], '5'));
});

test('keyword: full English-word boundaries avoid plural substrings', () => {
  const exact = comment('a dog is allowed');
  assert.deepEqual(hitIds(search([exact, comment('dogs are allowed'), comment('hotdog')], 'dog')), [exact.id]);
});

test('keyword: English case and Chinese adjacency are supported', () => {
  assert.equal(search([comment('这里有WiFi可以用')], 'wifi').matchCount, 1);
});

test('keyword: invisible zero-width characters normalize', () => {
  assert.equal(search([comment('数\u200b学基础')], '数学').matchCount, 1);
});

test('keyword: known N7 model excludes N7 Pro and N70', () => {
  const exact = comment('N7用了三周');
  const result = search([exact, comment('N7 Pro用了三周'), comment('N70用了三周')], 'N7', 'keyword', { models: ['N7', 'N7 Pro'] });
  assert.deepEqual(hitIds(result), [exact.id]);
});

test('keyword: independent N7 mention survives a longer model mention', () => {
  assert.equal(search([comment('N7 Pro没试过，N7用了三周')], 'N7', 'keyword', { models: ['N7', 'N7 Pro'] }).matchCount, 1);
});

test('keyword: hyphenated model is not silently aliased', () => {
  noHits(search([comment('N7用了三周')], 'N-7', 'keyword', { models: ['N7', 'N7 Pro'] }));
});

test('highlight: full-width digits map to the original text offsets', () => {
  const body = '身高１６０cm';
  const ranges = engine.highlightRanges(body, ['160']);
  assert.deepEqual(ranges, [[2, 5]]);
  assert.equal(body.slice(...ranges[0]), '１６０');
});

test('highlight: zero-width removal retains the original span', () => {
  const body = '数\u200b学基础';
  const ranges = engine.highlightRanges(body, ['数学']);
  assert.deepEqual(ranges, [[0, 3]]);
  assert.equal(body.slice(...ranges[0]), '数\u200b学');
});

test('highlight: emoji before normalized digits keeps UTF-16 offsets', () => {
  const body = '🙂身高１６０cm';
  assert.deepEqual(engine.highlightRanges(body, ['160']), [[4, 7]]);
});

test('highlight: 160 excludes 1600 and decimal fragments', () => {
  const body = '160cm，1600元，160.5cm';
  assert.deepEqual(engine.highlightRanges(body, ['160']), [[0, 3]]);
});

test('highlight: N7 excludes the longer known Pro entity', () => {
  const body = 'N7 Pro通话一般，N7日常够用';
  const start = body.lastIndexOf('N7');
  const ranges = engine.highlightRanges(body, ['N7'], ['n7 pro', 'n7']);
  assert.deepEqual(ranges, [[start, start + 2]]);
});

test('highlight: overlapping keyword ranges merge', () => {
  assert.deepEqual(engine.highlightRanges('数学基础很重要', ['数学', '学基础', '基础']), [[0, 4]]);
});

test('highlight: normalized whitespace maps the complete original phrase', () => {
  assert.deepEqual(engine.highlightRanges('数学 \t基础', ['数学 基础']), [[0, 6]]);
});

test('highlight: separated repeated hits remain separate', () => {
  assert.deepEqual(engine.highlightRanges('数学很重要；数学要复习', ['数学']), [[0, 2], [6, 8]]);
});

test('context: reply-only hit includes its root but does not count it', () => {
  const root = comment('这个怎么安排？', { kind: 'question' });
  const reply = comment('停车在北侧', { replyToId: root.id });
  root.replies.push(reply);
  const result = search([root], '停车');
  assert.equal(result.discussionCount, 1);
  assert.equal(result.matchCount, 1);
  assert.deepEqual(result.groups[0].context.map(item => item.comment.id), [root.id]);
  assert.deepEqual(result.groups[0].items.map(item => item.comment.id), [root.id, reply.id]);
});

test('context: root plus two reply hits produce N=1 M=3', () => {
  const root = comment('停车怎么安排？', { kind: 'question' });
  root.replies.push(comment('北侧停车', { replyToId: root.id }), comment('南侧也有停车', { replyToId: root.id }));
  const result = search([root], '停车');
  assert.equal(result.discussionCount, 1);
  assert.equal(result.matchCount, 3);
  assert.equal(result.groups[0].context.length, 0);
});

test('context: deep reply keeps the complete parent chain', () => {
  const root = comment('这段怎么走？', { kind: 'question' });
  const middle = comment('从木桥过去', { replyToId: root.id, kind: 'question' });
  const leaf = comment('雨天石阶很滑', { replyToId: middle.id });
  middle.replies.push(leaf);
  root.replies.push(middle);
  const result = search([root], '石阶');
  assert.equal(result.matchCount, 1);
  assert.deepEqual(result.groups[0].items.map(item => item.comment.id), [root.id, middle.id, leaf.id]);
});

test('context: flat sibling storage still follows replyToId', () => {
  const root = comment('怎么走？', { kind: 'question' });
  const middle = comment('从木桥过去', { replyToId: root.id, kind: 'question' });
  const leaf = comment('雨天石阶很滑', { replyToId: middle.id });
  root.replies.push(middle, leaf);
  assert.deepEqual(search([root], '石阶').groups[0].items.map(item => item.comment.id), [root.id, middle.id, leaf.id]);
});

test('AI: concrete pet question matches a different expression', () => {
  const doc = comment('四脚小朋友可以坐露台', { topics: ['pet'], kind: 'experience' });
  includesId(search([doc], '有人带狗去过吗', 'ai'), doc.id);
});

test('AI: no relevant material returns empty counts', () => {
  noHits(search([comment('咖啡很好喝', { topics: ['taste'] })], '有人带狗去过吗', 'ai'));
});

test('AI: questions without an answer retain nonzero counts', () => {
  const result = search([comment('能安装吗', { topics: ['setup'], kind: 'question' })], '安装', 'ai');
  assert.equal(result.status, 'unanswered');
  assert.equal(result.matchCount, 1);
  assert.equal(result.discussionCount, 1);
});

test('AI: question plus thanks is not treated as answered', () => {
  const root = comment('能安装吗', { topics: ['setup'], kind: 'question' });
  root.replies.push(comment('谢谢！', { replyToId: root.id, topics: ['setup'], kind: 'opinion' }));
  assert.equal(search([root], '安装', 'ai').status, 'unanswered');
});

test('AI: explicit height filters incompatible height evidence', () => {
  const match = comment('身高160cm选S', { topics: ['height', 'size'], constraints: { height: 160 } });
  const other = comment('身高158cm选S', { topics: ['height', 'size'], constraints: { height: 158 } });
  assert.deepEqual(hitIds(search([match, other], '身高160cm怎么选码', 'ai')), [match.id]);
});

test('AI: explicit width filters incompatible width evidence', () => {
  const match = comment('桌面宽90cm够用', { topics: ['width'], constraints: { width: 90 } });
  const other = comment('桌面宽100cm够用', { topics: ['width'], constraints: { width: 100 } });
  assert.deepEqual(hitIds(search([match, other], '90cm宽的书桌够用吗', 'ai')), [match.id]);
});

test('AI: explicit model does not include Pro-only experience', () => {
  const match = comment('N7开会收音还行', { topics: ['calls'], constraints: { model: 'N7' } });
  const other = comment('N7 Pro开会收音还行', { topics: ['calls'], constraints: { model: 'N7 Pro' } });
  assert.deepEqual(hitIds(search([match, other], '只看N7开会收音', 'ai', { models: ['N7', 'N7 Pro'] })), [match.id]);
});

test('AI: budget cap excludes higher prices and unknown prices', () => {
  const match = comment('安装花了300元', { topics: ['setup', 'budget'], constraints: { price: 300 } });
  const other = comment('安装花了600元', { topics: ['setup', 'budget'], constraints: { price: 600 } });
  const unknown = comment('安装挺方便', { topics: ['setup', 'budget'] });
  assert.deepEqual(hitIds(search([match, other, unknown], '安装预算不超过500', 'ai')), [match.id]);
});

test('AI: explicit child age excludes incompatible and unknown age', () => {
  const match = comment('带六岁孩子走了平路', { topics: ['children', 'distance'], constraints: { age: 6 } });
  const other = comment('带十岁孩子走了平路', { topics: ['children', 'distance'], constraints: { age: 10 } });
  const unknown = comment('带孩子走了一段平路', { topics: ['children', 'distance'] });
  assert.deepEqual(hitIds(search([match, other, unknown], '带6岁孩子走会不会累', 'ai')), [match.id]);
});

test('AI: does not claim a required no-drill condition for drilling', () => {
  const match = comment('不用打孔也能安装', { topics: ['setup'], constraints: { noDrill: true } });
  const other = comment('需要在墙上打孔安装', { topics: ['setup'], constraints: { noDrill: false } });
  assert.deepEqual(hitIds(search([match, other], '只看不用打孔的安装方法', 'ai')), [match.id]);
});

test('AI: permission question keeps both allowing and prohibiting experiences', () => {
  const yes = comment('宠物可以坐室外', { topics: ['pet'] });
  const no = comment('宠物不让进室内', { topics: ['pet'] });
  const result = search([yes, no], '能不能带狗', 'ai');
  includesId(result, yes.id);
  includesId(result, no.id);
});

test('AI: recent query excludes old evidence', () => {
  const recent = comment('宠物可以坐露台', { topics: ['pet'], publishedAt: '2026-10-08T12:00:00+08:00' });
  const old = comment('宠物可以坐露台', { topics: ['pet'], publishedAt: '2026-01-08T12:00:00+08:00' });
  assert.deepEqual(hitIds(search([recent, old], '最近能带狗吗', 'ai')), [recent.id]);
});

test('AI: vague query requests clarification, without zero counts', () => {
  const result = engine.search(notes.find(item => item.id === 'cafe'), '这家怎么样', 'ai');
  assert.equal(result.status, 'clarify');
  assert.equal(result.matchCount, null);
  assert.equal(result.discussionCount, null);
  assert.ok(result.clarifications.length > 0 && result.clarifications.length <= 4);
});

test('error: unavailable service is not an empty-result claim', () => {
  const result = search([comment('宠物坐露台', { topics: ['pet'] })], '带狗', 'ai', {}, { simulateError: true });
  assert.equal(result.status, 'error');
  assert.equal(result.matchCount, null);
  assert.equal(result.discussionCount, null);
});

test('adapter: production semantic maps to demo ai including clarification', () => {
  const productionRequest = { mode: 'semantic', query: '这家怎么样' };
  const demoMode = productionRequest.mode === 'semantic' ? 'ai' : productionRequest.mode;
  const result = engine.search(notes.find(item => item.id === 'cafe'), productionRequest.query, demoMode);
  assert.equal(result.mode, 'ai');
  assert.equal(result.status, 'clarify');
});

test('adapter: engine directly accepts semantic as an ai alias', () => {
  const cafe = notes.find(item => item.id === 'cafe');
  const direct = engine.search(cafe, '这家怎么样', 'semantic');
  const expected = engine.search(cafe, '这家怎么样', 'ai');
  assert.equal(direct.mode, 'ai');
  assert.equal(direct.status, 'clarify');
  assert.deepEqual(direct.clarifications, expected.clarifications);
  assert.equal(direct.matchCount, null);
});

test('adapter: production keyword remains keyword with exact behavior', () => {
  const productionRequest = { mode: 'keyword', query: '停车' };
  const demoMode = productionRequest.mode === 'semantic' ? 'ai' : productionRequest.mode;
  const result = search([comment('车位在店旁边')], productionRequest.query, demoMode);
  noHits(result);
});

test('data search: cafe pet intent finds original experiences', () => {
  const result = engine.search(notes.find(item => item.id === 'cafe'), '有人带狗去过吗？', 'ai');
  assert.equal(result.status, 'success');
  assert.ok(result.groups.length > 0);
  assert.ok(result.groups.some(group => group.matches.some(item => /四脚|毛孩子|小型犬/.test(item.comment.body))));
  assert.equal(result.matchCount, new Set(hitIds(result)).size);
});

test('data search: only unanswered biology question is not a fabricated answer', () => {
  const result = engine.search(notes.find(item => item.id === 'study'), '生物', 'keyword');
  assert.equal(result.status, 'unanswered');
  assert.ok(result.matchCount > 0);
});

test('data search: wired-computer query does not expand into general compatibility', () => {
  const result = engine.search(notes.find(item => item.id === 'earbuds'), 'N7能直接用线连电脑吗？', 'ai');
  assert.equal(result.status, 'unanswered');
  assert.equal(result.discussionCount, 1);
  assert.equal(result.matchCount, 1);
  assert.deepEqual(hitIds(result), ['earbuds-c20']);
});

test('data search: 160 does not retrieve the 1600mm room-width comment', () => {
  const result = engine.search(notes.find(item => item.id === 'home'), '160', 'keyword');
  noHits(result);
});

test('data search: N7 excludes every Pro-only text', () => {
  const result = engine.search(notes.find(item => item.id === 'earbuds'), 'N7', 'keyword');
  assert.ok(result.matchCount > 0);
  const proOnly = result.groups.flatMap(group => group.matches).filter(item => {
    const present = engine.entities(item.comment.body, ['n7 pro', 'n7']);
    return present.includes('n7 pro') && !present.includes('n7');
  });
  assert.equal(proOnly.length, 0);
});

test('data search: searchable total equals stored roots and replies', () => {
  notes.forEach(item => assert.equal(engine.search(item, '绝无此词x9z', 'keyword').totalVisibleCount, countTree(item.comments)));
});


test('keyword: metric units match attached digits and normalize case and width', () => {
  const attached = comment('桌面100cm');
  const spaced = comment('深度55 CM');
  const fullWidth = comment('宽度８０ＣＭ');
  const decimal = comment('深度55.5cm');
  const bare = comment('单位用cm');
  const expected = [attached, spaced, fullWidth, decimal, bare];
  const unrelated = ['SCM', 'cmm', 'cm2', 'cm100', 'acm'].map(body => comment(body));
  for (const query of ['cm', 'CM', 'ＣＭ']) {
    const result = search([...expected, ...unrelated], query);
    assert.deepEqual(new Set(hitIds(result)), new Set(expected.map(item => item.id)));
  }
});

test('keyword: each metric unit excludes fragments of other units', () => {
  const byUnit = { m: comment('长度1.2m'), cm: comment('宽120cm'), mm: comment('长1200mm'), km: comment('路线1km') };
  for (const [unit, expected] of Object.entries(byUnit)) {
    assert.deepEqual(hitIds(search(Object.values(byUnit), unit)), [expected.id]);
  }
});

test('keyword: numeric and unit tokens retain exact numeric boundaries', () => {
  const attached = comment('宽100cm');
  const spaced = comment('宽100 CM');
  const other = [comment('宽80cm'), comment('宽1100cm'), comment('宽100.5cm')];
  assert.deepEqual(new Set(hitIds(search([attached, spaced, ...other], '100 cm'))), new Set([attached.id, spaced.id]));
  assert.deepEqual(hitIds(search([attached, ...other], '100CM')), [attached.id]);
});

test('highlight: metric unit boundaries and normalization match search', () => {
  const body = '100cm，55 CM，８０ＣＭ；SCM cmm cm2';
  assert.deepEqual(engine.highlightRanges(body, ['CM']).map(range => body.slice(...range)), ['cm', 'CM', 'ＣＭ']);
  const mixed = '1200mm，120cm，1km，1.2m';
  assert.deepEqual(engine.highlightRanges(mixed, ['m']).map(range => mixed.slice(...range)), ['m']);
});

test('context: a unit hit in a reply retains the parent without counting it', () => {
  const root = comment('桌面深度多少？', { kind: 'question' });
  const reply = comment('深度55cm', { kind: 'answer', replyToId: root.id });
  root.replies.push(reply);
  for (const mode of ['keyword', 'ai']) {
    const result = search([root], 'CM', mode);
    assert.equal(result.matchCount, 1);
    assert.equal(result.discussionCount, 1);
    assert.deepEqual(hitIds(result), [reply.id]);
    assert.deepEqual(result.groups[0].context.map(item => item.comment.id), [root.id]);
  }
});

test('data search: cm variants retrieve six home comments in both modes', () => {
  const home = notes.find(item => item.id === 'home');
  const expected = ['home-c01', 'home-c02', 'home-c03', 'home-c04', 'home-c05-r1', 'home-c16'];
  for (const mode of ['ai', 'keyword']) {
    for (const query of ['cm', 'CM', 'ＣＭ']) {
      const result = engine.search(home, query, mode);
      assert.equal(result.status, 'success');
      assert.equal(result.matchCount, 6);
      assert.equal(result.discussionCount, 6);
      assert.deepEqual(new Set(hitIds(result)), new Set(expected));
      const replyGroup = result.groups.find(group => group.matches.some(item => item.comment.id === 'home-c05-r1'));
      assert.deepEqual(replyGroup.context.map(item => item.comment.id), ['home-c05']);
    }
  }
});

test('data search: cm does not automatically expand to every height discussion', () => {
  const outfit = notes.find(item => item.id === 'outfit');
  assert.deepEqual(hitIds(engine.search(outfit, 'cm', 'ai')), ['outfit-c02']);
});

test('AI: English words containing cm are not interpreted as height', () => {
  const outfit = notes.find(item => item.id === 'outfit');
  noHits(engine.search(outfit, 'SCM', 'ai'));
  const actual = comment('SCM这个缩写是什么意思？');
  assert.deepEqual(hitIds(search([actual], 'SCM', 'ai')), [actual.id]);
});


test('AI: explicit outfit heights preserve intent recall without a literal unit', () => {
  const outfit = notes.find(item => item.id === 'outfit');
  for (const query of ['158cm', '１５８ＣＭ', '158cm怎么穿', '身高158cm怎么选码']) {
    assert.deepEqual(hitIds(engine.search(outfit, query, 'ai')), ['outfit-c03']);
  }
  assert.deepEqual(hitIds(engine.search(outfit, '168cm', 'ai')), ['outfit-c04']);
});

const summary = {
  passed: results.filter(item => item.status === 'passed').length,
  failed: results.filter(item => item.status === 'failed').length,
  blocked: results.filter(item => item.status === 'blocked').length,
  total: results.length,
  storedComments: notes.map(item => ({ id: item.id, title: item.title, count: countTree(item.comments) })),
  adapterNote: 'semantic-to-ai mapping is tested at the contract boundary; this does not claim a production adapter or live model exists.',
  results
};
fs.writeFileSync(path.join(__dirname, 'search-results.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log('\n' + JSON.stringify({ passed: summary.passed, failed: summary.failed, blocked: summary.blocked, total: summary.total, storedComments: summary.storedComments }, null, 2));
process.exitCode = summary.failed || summary.blocked ? 1 : 0;
