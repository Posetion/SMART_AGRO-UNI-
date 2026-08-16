$ErrorActionPreference = "Stop"
$sample = "c:\Users\ASUS\Downloads\Telegram Desktop\ProjectSampleVinyl(English).pub"
$out = "D:\SMART-AGRO\docs\_form_dump.txt"
$picDir = "D:\SMART-AGRO\docs\vinyl-sample"
New-Item -ItemType Directory -Force -Path $picDir | Out-Null

Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$app = New-Object -ComObject Publisher.Application
$app.ScreenUpdating = $false
$doc = $app.Open($sample)
$page = $doc.Pages.Item(1)
$lines = @()
$lines += "PageWidth=$($doc.PageSetup.PageWidth) PageHeight=$($doc.PageSetup.PageHeight)"
$i = 0
foreach ($sh in $page.Shapes) {
  $i++
  $fill = ""
  $line = ""
  $txt = ""
  $type = $sh.Type
  try { $fill = [int]$sh.Fill.ForeColor.RGB } catch { $fill = "-" }
  try { $line = [int]$sh.Line.ForeColor.RGB } catch { $line = "-" }
  if ($type -eq 17) {
    try { $txt = $sh.TextFrame.TextRange.Text.Replace("`r"," | ").Replace("`n"," | ") } catch { $txt = "" }
  }
  $lines += ("{0,3} type={1} L={2:N1} T={3:N1} W={4:N1} H={5:N1} fill={6} line={7} text={8}" -f $i, $type, $sh.Left, $sh.Top, $sh.Width, $sh.Height, $fill, $line, $txt)
  if ($type -eq 13) {
    $picPath = Join-Path $picDir ("pic{0}.png" -f $i)
    try { $sh.SaveAsPicture($picPath) } catch { $lines += "  save pic failed: $($_.Exception.Message)" }
  }
}
$doc.Close()
$app.Quit()
$lines | Set-Content -Path $out -Encoding UTF8
Get-Content $out
