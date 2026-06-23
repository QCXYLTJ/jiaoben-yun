setlocal enabledelayedexpansion
for /r %%f in (*.jpg) do (
  ffmpeg -i "%%f" -y "%%~dpnf_temp.jpg"
  move /y "%%~dpnf_temp.jpg" "%%~dpnf.jpg"
)
