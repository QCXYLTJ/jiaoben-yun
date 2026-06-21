for /d %%I in (".\*") do (
    echo 温柔一刀 火灵月影 缺德扩展 太虚幻境 三国全系列 色图杀 英雄外传 果包 boss cardpile coin wuxing 拖拽读取 应用配置 全能搜索 node_modules | findstr /c:"%%~nxI" >nul || (
        "C:\Program Files\7-Zip\7z.exe" a -tzip "%%~nxI.zip" "%%I\*" -mx9
    )
)
pause