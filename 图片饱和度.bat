for /r %%f in (*.jpg) do (
    ffmpeg -i "%%f" -vf "hue=s=1.5" -y "%%~dpnf_temp.jpg"
    move /y "%%~dpnf_temp.jpg" "%%f"
)