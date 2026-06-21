for /r %%f in (*.mp3) do (
    ffmpeg -i "%%f" -af "volume=10dB" -y "%%~dpnf_temp.mp3"
    move /y "%%~dpnf_temp.mp3" "%%f"
)