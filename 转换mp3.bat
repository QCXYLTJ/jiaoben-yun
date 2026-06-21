setlocal enabledelayedexpansion
for /r %%f in (*.mp3 *.wav *.m4a *.flac *.ogg) do (
  ffmpeg -i "%%f" -c:a libmp3lame -b:a 64k -y "%%~dpnf_temp.mp3"
  move /y "%%~dpnf_temp.mp3" "%%~dpnf.mp3"
)
