@echo off
setlocal
chcp 65001 >nul
if defined NODE_BIN if exist "%NODE_BIN%" goto custom_node
if exist "%~dp0..\runtime\node.exe" goto bundled_node
where node >nul 2>nul
if not errorlevel 1 goto system_node
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" goto codex_node
echo 找不到 Node.js。请安装 Node.js 18 或更新版本后重试。
echo 此项目不需要 npm install，不需要 API 密钥。
exit /b 1
:custom_node
"%NODE_BIN%" %*
exit /b %errorlevel%
:bundled_node
"%~dp0..\runtime\node.exe" %*
exit /b %errorlevel%
:system_node
node %*
exit /b %errorlevel%
:codex_node
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" %*
exit /b %errorlevel%
