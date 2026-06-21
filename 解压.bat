for %%i in (*.zip) do (
    7z x "%%i" -o"%%~ni" -aoa >nul
)