setlocal enabledelayedexpansion
for /r %%f in (*.gif *.webm *.mp4 *.ts *.mkv *.mov) do (
  ffmpeg -i "%%f" ^
  -c:v libvpx-vp9 -b:v 0 -crf 30 -pix_fmt yuva420p ^
  -y "%%~dpnf_temp.webm"
  move /y "%%~dpnf_temp.webm" "%%~dpnf.webm"
)
