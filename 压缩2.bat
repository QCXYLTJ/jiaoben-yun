for /d %%I in (".\*") do (
    for %%F in (神怒降世 三国全系列 英雄联盟 错乱时空 猫猫叹气 仙家之魂 命运线 坎公骑冠剑 太虚幻境 异闻带 末日浩劫 极想 概念武将 活动BOSS 浪琴天阙 弹丸杀) do (
        if "%%~nI"=="%%F" (
        "C:\Program Files\7-Zip\7z.exe" a -tzip "%%~nxI.zip" "%%I\*" -mx9
        )
    )
)