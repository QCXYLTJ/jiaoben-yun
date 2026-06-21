# 确保这里的路径是正确的，指向TagLibSharp.dll的位置
$dllPath = Join-Path -Path $PWD -ChildPath "TagLibSharp.dll"

# 动态加载TagLibSharp库
Add-Type -Path $dllPath

# 获取当前目录下的所有mp3文件
Get-ChildItem -Filter *.mp3 | ForEach-Object {
    $mp3File = $_.FullName
    $title = ""

    try {
        # 使用TagLibSharp打开文件
        $file = [TagLib.File]::Create($mp3File)
            
        # 获取文件的标签信息
        $tag = $file.GetTag([TagLib.TagTypes]::ID3v2)
            
        # 获取标题
        if ($tag.Title -ne $null) {
            $title = $tag.Title.ToString()
        }
            
        # 关闭文件
        $file.Dispose()
    } 
    catch {
        Write-Host "Failed to open or read metadata from file: $mp3File"
    }
    # 获取当前文件名（不包含路径）
    $currentFileName = Split-Path -Leaf $mp3File
    # 如果找到了标题信息，则重命名文件
    if ($title -ne "") {
        $newName = "$title.mp3"

        # 检查新旧文件名是否相同
        if ($currentFileName -eq $newName) {
            Write-Output "The current file name '$currentFileName' is the same as the new name '$newName'. Skipping renaming."
        }
        else {
            # 如果新文件名已经存在，则添加递增后缀
            $counter = 1
            while (Test-Path $newName) {
                $newName = "$title$counter.mp3"
                $counter++
            }
        
            Rename-Item -Path $mp3File -NewName $newName
        }
    }
    Write-Host "重命名 file: $currentFileName"
}
Write-Host "Done."