setlocal enabledelayedexpansion
for /r %%f in (*.MP3) do (
  set "ext=%%~xf"
  set "ext_upper=!ext:~0,4!"
  if /i "!ext_upper!"==".MP3" (
    if "!ext!"==".MP3" (
      ffmpeg -i "%%f" -c:a libmp3lame -b:a 64k -af "loudnorm=I=-12:LRA=11:TP=-1.5" -y "%%~dpnf_temp.mp3"
      move /y "%%~dpnf_temp.mp3" "%%~dpnf.mp3"
    )
  )
)
