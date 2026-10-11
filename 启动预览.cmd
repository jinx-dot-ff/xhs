@echo off
chcp 65001 >nul
call "%~dp0scripts\run-node.cmd" "%~dp0server.cjs" --open
if errorlevel 1 pause
