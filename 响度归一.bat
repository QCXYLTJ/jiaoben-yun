setlocal enabledelayedexpansion
for /r %%f in (*.mp3) do (
  ffmpeg -i "%%f" -c:a libmp3lame -b:a 64k -af "loudnorm=I=-12:LRA=11:TP=-1.5" -y "%%~dpnf_temp.mp3"
  move /y "%%~dpnf_temp.mp3" "%%~dpnf.mp3"
)
