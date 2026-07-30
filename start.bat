@echo off
cd /d "%~dp0"

echo ========================================
echo   MyBlog - 启动博客系统
echo ========================================
echo.

:: 启动后端
echo [1/2] 启动后端服务...
start "MyBlog-Backend" cmd /c "npx tsx api/start.ts & pause"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [2/2] 启动前端服务...
start "MyBlog-Frontend" cmd /c "npx vite --host & pause"

echo.
echo ========================================
echo   ✅ 启动完成！
echo.
echo   打开浏览器访问：
echo   http://localhost:5173
echo.
echo   关闭博客请关闭两个命令行窗口
echo ========================================
pause
