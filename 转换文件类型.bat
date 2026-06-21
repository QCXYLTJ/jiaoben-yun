for %%e in (gif ts mkv mp4) do (
  for /r %%f in (*.%%e) do (
    ffmpeg -i "%%f" ^
    -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 28 ^
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ^
    -c:a aac -b:a 64k ^
    -movflags +faststart ^
    -y "%%~dpnf_temp.mp4"
    move /y "%%~dpnf_temp.mp4" "%%~dpnf.mp4"
  )
)
for %%e in (mp3 wav m4a flac ogg) do (
  for /r %%f in (*.%%e) do (
    ffmpeg -i "%%f" -c:a libmp3lame -b:a 64k -af "loudnorm=I=-12:LRA=11:TP=-1.5" -y "%%~dpnf_temp.mp3"
    move /y "%%~dpnf_temp.mp3" "%%~dpnf.mp3"
  )
)
for %%e in (jpg png webp jpeg heic) do (
  for /r %%f in (*.%%e) do (
    ffmpeg -i "%%f" -y "%%~dpnf_temp.jpg"
    move /y "%%~dpnf_temp.jpg" "%%~dpnf.jpg"
  )
)
