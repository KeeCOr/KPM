@echo off
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-ChildItem -Path \"%~dp0\" -Filter \"KPM_v*_portable.exe\" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"') do (
    start "" "%%i"
    exit /b
)
echo KPM 실행파일을 찾을 수 없습니다.
pause
