/* 本地静态预览，只读取本交付目录。无外部依赖。 */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {execFile}=require('node:child_process');
const root=__dirname;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8'};
let port=Number(process.env.PORT ?? 8765);
if(!Number.isInteger(port)||port<0||port>65535){console.error('PORT 必须是 0 到 65535 的整数。');process.exit(1);}
const lastPort=Math.min(65535,port+10);
const server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
  if(pathname==='/')pathname='/app/index.html';
  const target=path.resolve(root,'.'+pathname);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  fs.stat(target,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD'){res.end();return;}
    fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
  });
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE'&&port<lastPort){port++;server.listen(port,'127.0.0.1');}
  else{console.error('无法启动本地预览：'+error.message);process.exit(1);}
});
server.on('listening',()=>{
  port=server.address().port;
  const url='http://127.0.0.1:'+port+'/app/index.html';
  console.log('\n评里找交互原型已就绪\n'+url+'\n产品文档：http://127.0.0.1:'+port+'/PRD.html\n关闭此窗口即可停止预览。\n');
  // 仅双击启动脚本传入 --open 时，在用户的默认浏览器中打开。
  if(process.argv.includes('--open')&&process.platform==='win32')execFile('cmd.exe',['/d','/c','start','',url],{windowsHide:true},()=>{});
});
server.listen(port,'127.0.0.1');
