# Register (or replace) the daily source check as a Windows scheduled task.
#
#   powershell -ExecutionPolicy Bypass -File register-daily-task.ps1
#   powershell -ExecutionPolicy Bypass -File register-daily-task.ps1 -Time 07:15
#
# The task runs run-daily-check.cmd, which sets the working directory, runs
# daily-check.mjs and appends to logs\daily-check.log. A failed source makes the
# script exit nonzero, so the task's Last Result reflects it.
param(
  [string]$Time = "06:30",
  [string]$TaskName = "EU JUST daily check"
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$wrapper = Join-Path $root "run-daily-check.cmd"

if (-not (Test-Path $wrapper)) { throw "missing wrapper: $wrapper" }

$action = New-ScheduledTaskAction -Execute $wrapper -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -DontStopIfGoingOnBatteries `
  -AllowStartIfOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName
Write-Output "registered: $TaskName"
Write-Output ("state:      " + $task.State)
Write-Output ("next run:   " + $info.NextRunTime)
Write-Output ("timezone:   " + (Get-TimeZone).Id + " (06:30 local == 06:30 Europe/Brussels)")
