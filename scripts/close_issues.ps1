$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repo = "Charelas/chronos-app"
$comment = "Sudah diimplementasi dan di-push ke branch master pada commit 21b70ca. Semua task dalam issue ini telah selesai dikerjakan."

# Issues 1-16 semuanya sudah selesai diimplementasi
1..16 | ForEach-Object {
    $num = $_
    Write-Host "Closing issue #$num..." -NoNewline
    & $gh issue close $num --repo $repo --comment $comment
    Write-Host " Done"
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "All 16 issues closed!"
