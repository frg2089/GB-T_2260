#Requires -Version 5.1

[CmdletBinding()]
param (
  [Parameter()]
  [int]
  $StartYear = 1980,
  [Parameter()]
  [int]
  $EndYear = (Get-Date).Year - 1,
  [Parameter()]
  [string]
  $OutputPath = "./data",
  [Parameter()]
  [timespan]
  $Interval = [timespan]::Zero
)

$StartYear..$EndYear | ForEach-Object -Process {
  $Private:Response = Invoke-WebRequest -Uri "https://dmfw.mca.gov.cn/9095/xzqh/getList?year=$PSItem"
  $Private:Content = $Private:Response.Content

  $Private:OutputJsonPath = Join-Path -Path $OutputPath -ChildPath "$PSItem.json"
  $Private:Content | Out-File -FilePath $Private:OutputJsonPath -Encoding UTF8
  if ($Interval -ne [timespan]::Zero) {
    Start-Sleep -Duration $Interval
  }
}