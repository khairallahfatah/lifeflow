@echo off
chcp 65001 >nul
cd /d "%~dp0"
title LifeFlow Personal Life OS — Control Panel

:menu
cls
echo ====================================================================
echo             🌿 LifeFlow — Personal Life OS (PWA)
echo ====================================================================
echo.
echo   يرجى اختيار العملية المطلوبة برقم الخيار:
echo.
echo   [1] تشغيل خادم التطوير السريع (Dev Server - Vite)
echo   [2] بناء حزمة الإنتاج النهائية (Build Production)
echo   [3] معاينة حزمة الإنتاج محلياً (Preview Production)
echo   [4] خروج (Exit)
echo.
echo ====================================================================
set /p choice="أدخل اختيارك [1-4]: "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto build
if "%choice%"=="3" goto preview
if "%choice%"=="4" goto exit

echo.
echo [!] خيار غير صحيح، يرجى إدخال رقم بين 1 و 4.
timeout /t 2 >nul
goto menu

:dev
cls
echo ====================================================================
echo   [1] تشغيل خادم التطوير السريع (Vite Dev Server)...
echo   الرابط المحلي: http://localhost:8000
echo ====================================================================
echo.
npm run dev
goto end

:build
cls
echo ====================================================================
echo   [2] بناء حزمة الإنتاج النهائية (dist)...
echo ====================================================================
echo.
npm run build
echo.
echo ====================================================================
echo   [✓] اكتمل بناء مجلد الإنتاج (dist) بنجاح!
echo   يمكنك الآن رفعه على Cloudflare Pages أو Vercel أو معاينته محلياً.
echo ====================================================================
echo.
pause
goto menu

:preview
cls
echo ====================================================================
echo   [3] تشغيل خادم معاينة الإنتاج (Preview Production)...
echo   يقوم هذا الخادم بتشغيل ملفات مجلد dist لمحاكاة بيئة الإنترنت الحقيقية.
echo   الرابط المحلي: http://localhost:4173
echo ====================================================================
echo.
npm run preview
goto end

:exit
cls
echo وداعاً! شكراً لاستخدامك LifeFlow.
exit /b

:end
pause
