setlocal enabledelayedexpansion
for %%I in (*.zip *.7z) do (
    set "filename=%%~nI" 
    if "!filename:fire=!"=="!filename!" (
        ren "%%I" "%%~nI(fire)%%~xI"
    ) 
)