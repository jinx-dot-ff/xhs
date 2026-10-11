@echo off
chcp 65001 >nul
call "%~dp0scripts\run-node.cmd" "%~dp0tests\search.test.js"
if errorlevel 1 goto failed
call "%~dp0scripts\run-node.cmd" "%~dp0scripts\verify-bundle.cjs"
if errorlevel 1 goto failed
echo.
echo 全部检查通过。
pause
exit /b 0
:failed
echo.
echo 检查未通过，请查看上方结果。
pause
exit /b 1
