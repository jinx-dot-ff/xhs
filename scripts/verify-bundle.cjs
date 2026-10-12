'use strict';
// Portable delivery verification. Built-in Node.js modules only; no browser automation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'bundle-manifest.json');
const excluded = new Set(['bundle-manifest.json', 'tests/handoff-results.json']);
const checks = [];
function walk(directory = root) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ['.git', 'node_modules', 'runtime'].includes(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('交付不允许依赖目录外的软链接：' + absolute);
    return entry.isDirectory() ? walk(absolute) : [path.relative(root, absolute).split(path.sep).join('/')];
  }).sort();
}
function digest(relative) {
  const bytes = fs.readFileSync(path.join(root, relative));
  return { path: relative, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
}
function record(name, fn) {
  try { const detail = fn(); checks.push({ name, status: 'passed', detail }); console.log('PASS ' + name); }
  catch (error) { checks.push({ name, status: 'failed', message: error.message }); console.error('FAIL ' + name + ': ' + error.message); }
}
function ensure(condition, message) { if (!condition) throw new Error(message); }
function resolveResource(base, value) {
  if (/^(?:https?:|data:|#|mailto:)/i.test(value)) return null;
  const relative = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!relative) return null;
  const absolute = path.resolve(path.dirname(path.join(root, base)), relative);
  ensure(absolute.startsWith(root + path.sep), '目录外资源：' + value);
  ensure(fs.existsSync(absolute) && fs.statSync(absolute).isFile(), '缺少资源：' + base + ' → ' + value);
  return path.relative(root, absolute).split(path.sep).join('/');
}
async function httpSmoke(files) {
  const child = spawn(process.execPath, [path.join(root, 'server.cjs')], {
    cwd: root, env: { ...process.env, PORT: '0' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', bytes => { stderr += bytes.toString(); });
  let buffer = '';
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('服务启动超时：' + stderr)), 10000);
      child.stdout.on('data', bytes => {
        buffer += bytes.toString();
        const match = buffer.match(/http:\/\/127\.0\.0\.1:(\d+)\/app\/index\.html/);
        if (match) { clearTimeout(timer); resolve(Number(match[1])); }
      });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error('服务提前结束：' + code + ' ' + stderr)); });
    });
    const origin = 'http://127.0.0.1:' + port;
    for (const relative of files) {
      const url = origin + '/' + relative.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      ensure(response.status === 200, relative + ' HTTP ' + response.status);
      const body = Buffer.from(await response.arrayBuffer());
      ensure(body.equals(fs.readFileSync(path.join(root, relative))), 'HTTP 内容不一致：' + relative);
    }
    const home = await fetch(origin + '/', { signal: AbortSignal.timeout(5000) });
    ensure(home.status === 200 && (await home.text()).includes('home-app'), '根路径未提供首页');
    const note = await fetch(origin + '/app/note.html?id=home', { signal: AbortSignal.timeout(5000) });
    ensure(note.status === 200 && (await note.text()).includes('id="query"'), '带查询参数详情页不可用');
    return { servedFiles: files.length, rootRoute: 'passed', noteRoute: 'passed' };
  } finally {
    if (child.exitCode === null) {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      child.kill();
      await stopped;
    }
  }
}
(async () => {
  if (process.argv.includes('--refresh-manifest')) {
    const files = walk().filter(relative => !excluded.has(relative)).map(digest);
    fs.writeFileSync(manifestPath, JSON.stringify({
      project: '小红书笔试 评里找', snapshotDate: '2026-10-12', algorithm: 'SHA-256',
      excluded: [...excluded], files
    }, null, 2) + '\n', 'utf8');
    console.log('已更新交付文件清单：' + files.length + ' 个文件。');
  }
  record('文件清单与 SHA-256', () => {
    ensure(fs.existsSync(manifestPath), '缺少 bundle-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const file of manifest.files) {
      ensure(!path.isAbsolute(file.path) && !file.path.split('/').includes('..'), '不合法清单路径');
      ensure(fs.existsSync(path.join(root, file.path)), '缺失文件：' + file.path);
      const actual = digest(file.path);
      ensure(actual.sha256 === file.sha256 && actual.bytes === file.bytes, '文件已改变：' + file.path);
    }
    const actualFiles = walk().filter(relative => !excluded.has(relative));
    ensure(JSON.stringify(actualFiles) === JSON.stringify(manifest.files.map(file => file.path)), '交付文件列表与清单不同');
    return { files: manifest.files.length };
  });
  record('页面相对资源', () => {
    const references = [];
    for (const html of ['index.html', 'app/index.html', 'app/note.html']) {
      const text = fs.readFileSync(path.join(root, html), 'utf8');
      for (const match of text.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        const result = resolveResource(html, match[1]);
        if (result) references.push(result);
      }
      ensure(!/<(?:script|img|link)\b[^>]*(?:src|href)="https?:/i.test(text), '页面依赖远程资源');
    }
    const css = fs.readFileSync(path.join(root, 'app/styles.css'), 'utf8');
    for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
      ensure(!/^https?:/i.test(match[1]), '样式依赖远程资源');
      const result = resolveResource('app/styles.css', match[1]);
      if (result) references.push(result);
    }
    return { references: references.length };
  });
  record('九篇笔记与全部图片', () => {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'app/data.js'), 'utf8'), sandbox);
    const notes = sandbox.window.PLZ_DATA.notes;
    ensure(notes.length === 9, '笔记数量不同');
    let comments = 0;
    const count = list => list.reduce((sum, comment) => sum + 1 + count(comment.replies || []), 0);
    for (const note of notes) {
      for (const image of [note.cover, ...(note.images || [])]) resolveResource('app/data.js', image);
      comments += count(note.comments);
      ensure(count(note.comments) > 100, note.id + ' 的评论数不足以显示搜索入口');
    }
    const originalIds = ['cafe', 'outfit', 'study', 'trail', 'earbuds', 'home'];
    ensure(notes.filter(note => originalIds.includes(note.id)).reduce((total, note) => total + count(note.comments), 0) === 633, '原六篇评论数量不同');
    for (const name of [...originalIds, 'travel', 'benefits', 'computer', 'avatars']) {
      ensure(fs.existsSync(path.join(root, 'source-assets', name + '.png')), '缺少原图：' + name);
      ensure(fs.existsSync(path.join(root, 'app/assets', name + '.webp')), '缺少页面素材：' + name);
    }
    const suppliedAvatar=fs.readFileSync(path.join(root,'source-assets/self-avatar.jpg'));
    ensure(suppliedAvatar.equals(fs.readFileSync(path.join(root,'app/assets/self-avatar.jpg'))), '自己头像与用户原图副本不同');
    return { notes: notes.length, comments, originalImages: 10, webpImages: 10, userAvatarImages: 1 };
  });
  record('JavaScript 语法', () => {
    const files = walk().filter(relative => /\.(?:js|cjs)$/.test(relative));
    for (const relative of files) {
      const result = spawnSync(process.execPath, ['--check', path.join(root, relative)], { encoding: 'utf8', windowsHide: true });
      ensure(result.status === 0, relative + ': ' + result.stderr);
    }
    return { checkedFiles: files.length };
  });
  try {
    const files = walk().filter(relative => relative.startsWith('app/') || ['index.html', 'PRD.html'].includes(relative));
    const detail = await httpSmoke(files);
    checks.push({ name: '独立目录 HTTP 预览', status: 'passed', detail });
    console.log('PASS 独立目录 HTTP 预览');
  } catch (error) {
    checks.push({ name: '独立目录 HTTP 预览', status: 'failed', message: error.message });
    console.error('FAIL 独立目录 HTTP 预览: ' + error.message);
  }
  const report = { project: '小红书笔试 评里找', passed: checks.filter(check => check.status === 'passed').length,
    failed: checks.filter(check => check.status === 'failed').length, checks };
  fs.writeFileSync(path.join(root, 'tests/handoff-results.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed }, null, 2));
  process.exitCode = report.failed ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
