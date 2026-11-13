#Requires -Version 5.1

<#
.SYNOPSIS
    从中国·国家地名信息库（National Database for Geographical Names of China）
    按年份导出的 JSON 文件构建行政区划代码数据库。
.DESCRIPTION
    读取目录下所有 YYYY.json 文件，取 $root.data 递归遍历，
    按 code 聚合 name/type/level 的变化历史，输出符合 DB 类型的 JSON。
.PARAMETER InputPath
    存放年份 JSON 文件的目录，默认当前目录。
.PARAMETER OutputPath
    输出数据库 JSON 文件路径，默认 ./db.json。
#>
[CmdletBinding()]
param (
  [Parameter()]
  [string]$InputPath = "./data",

  [Parameter()]
  [string]$OutputPath = "./db.json"
)

# ---------- 1. 收集年份文件 ----------
$files = @(Get-ChildItem -Path $InputPath -Filter "*.json" | Where-Object {
    $_.Name -match '^\d{4}\.json$'
  } | Sort-Object { [int]([System.IO.Path]::GetFileNameWithoutExtension($_.Name)) })

if ($files.Count -eq 0) {
  Write-Error "在 '$InputPath' 下未找到年份 JSON 文件（如 1980.json）"
  return
}

$years = $files | ForEach-Object { [int]([System.IO.Path]::GetFileNameWithoutExtension($_.Name)) }
$maxYear = ($years | Measure-Object -Maximum).Maximum

# ---------- 2. 初始化数据库 ----------
# key: 12 位 code；value: List[Item]
$script:db = @{}
# 记录每个 code 最后出现的年份，用于处理断档和收尾
$script:lastSeen = @{}

# ---------- 3. 递归处理节点 ----------
function Add-Node {
  param(
    $Node,
    [int]$Year
  )

  if ($null -eq $Node) { return }

  $code = [string]$Node.code
  if ([string]::IsNullOrWhiteSpace($code)) { return }

  $name = [string]$Node.name
  $type = [string]$Node.type
  $level = $Node.level

  if (-not $script:db.Contains($code)) {
    $script:db[$code] = [System.Collections.Generic.List[object]]::new()
  }

  $list = $script:db[$code]
  $last = if ($list.Count -gt 0) { $list[$list.Count - 1] } else { $null }

  if ($null -eq $last) {
    # 首次出现
    $item = [ordered]@{
      name  = $name
      type  = $type
      level = $level
      year  = [ordered]@{ start = $Year }
    }
    $list.Add($item)
  }
  elseif (
    $last.name -eq $name -and
    $last.type -eq $type -and
    $last.level -eq $level -and
    $script:lastSeen[$code] -eq ($Year - 1)
  ) {
    # 属性相同且年份连续：延续
    $last.year.end = $Year
  }
  else {
    # 属性变化，或中间出现断档：结束上一条，新增一条
    if (-not $last.year.Contains('end')) {
      $last.year.end = $Year - 1
    }
    $item = [ordered]@{
      name  = $name
      type  = $type
      level = $level
      year  = [ordered]@{ start = $Year }
    }
    $list.Add($item)
  }

  $script:lastSeen[$code] = $Year

  # 递归子节点。若接口字段名不是 children，请在此处调整
  $children = $Node.children
  if ($null -ne $children) {
    foreach ($child in $children) {
      Add-Node -Node $child -Year $Year
    }
  }
}

# ---------- 4. 逐年读取并建库 ----------
foreach ($file in $files) {
  $year = [int]([System.IO.Path]::GetFileNameWithoutExtension($file.Name))
  Write-Host "处理 $year ..."

  $root = Get-Content -Path $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  $data = $root.data
  if ($null -eq $data) {
    Write-Warning "$year 缺少 data 字段，跳过"
    continue
  }

  foreach ($node in $data) {
    Add-Node -Node $node -Year $year
  }
}

# ---------- 5. 后处理：补全 end，移除仍有效的 end ----------
foreach ($code in $script:db.Keys) {
  $list = $script:db[$code]
  $lastYear = $script:lastSeen[$code]

  foreach ($item in $list) {
    if (-not $item.year.Contains('end')) {
      $item.year.end = $lastYear
    }
    # 如果一直有效到最后一年，则省略 end
    if ($item.year.end -eq $maxYear) {
      $item.year.Remove('end')
    }
  }
}

# ---------- 6. 输出 ----------
$outputDir = Split-Path -Path $OutputPath -Parent
if ($outputDir -and -not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$json = $script:db | ConvertTo-Json -Depth 20 -Compress
$json | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "完成：共 $($script:db.Keys.Count) 个代码，已输出到 $OutputPath"