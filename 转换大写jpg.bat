setlocal enabledelayedexpansion
for /r %%f in (*.JPG) do (
  set "ext=%%~xf"
  set "ext_upper=!ext:~0,4!"
  if /i "!ext_upper!"==".JPG" (
    if "!ext!"==".JPG" (
      ffmpeg -i "%%f" -y "%%~dpnf_temp.jpg"
      move /y "%%~dpnf_temp.jpg" "%%~dpnf.jpg"
    )
  )
)
