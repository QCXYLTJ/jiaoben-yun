setlocal enabledelayedexpansion
chcp 65001 >nul
for /r %%f in (*.mp3 *.mp4 *.jpg) do (
    set "filename=%%~nI"
    set "extension=%%~xI"
    set "newname=!filename:。=!"
    set "newname=!newname:，=,!"
    set "newname=!newname:（=(!"
    set "newname=!newname:）=)!"
    set "newname=!newname:：=!"
    set "newname=!newname:！=!"
    set "newname=!newname:？=!"
    set "newname=!newname:.=!"
    set "finalname=!newname!!extension!"
    if not "%%I"=="!finalname!!extension!" (
        echo !finalname!
        move /Y "%%I" "!finalname!"
    )
)