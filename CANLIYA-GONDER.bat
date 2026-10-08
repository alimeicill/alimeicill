@echo off
title Canliya ve GitHub'a Gonder
echo =======================================================
echo SiteHesabim - Canliya ve GitHub'a Kod Gonderiliyor...
echo =======================================================
cd /d C:\Users\Alime\.gemini\antigravity\scratch\apartment-management
git push origin main
if errorlevel 1 (
    echo.
    echo =======================================================
    echo HATA! Gonderim BASARISIZ oldu. Kod canliya GITMEDI.
    echo Yukaridaki hata mesajini kontrol edin.
    echo =======================================================
    pause
    exit /b 1
)
echo.
echo =======================================================
echo ISLEM TAMAMLANDI! Canli sunucunuza aktarildi.
echo =======================================================
pause
