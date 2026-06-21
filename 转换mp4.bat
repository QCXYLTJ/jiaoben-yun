setlocal enabledelayedexpansion
for /r %%f in (*.gif *.webm *.mp4 *.ts *.mkv *.mov) do (
  ffmpeg -i "%%f" ^
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 28 ^
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ^
  -c:a aac -b:a 64k ^
  -movflags +faststart ^
  -y "%%~dpnf_temp.mp4"
  move /y "%%~dpnf_temp.mp4" "%%~dpnf.mp4"
)
