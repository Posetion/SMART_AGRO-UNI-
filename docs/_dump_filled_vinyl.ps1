$ErrorActionPreference = "Stop"
$pub = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.pub"
$out = "D:\SMART-AGRO\docs\_filled_dump.txt"

Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$app = New-Object -ComObject Publisher.Application
$app.ScreenUpdating = $false
$doc = $app.Open($pub)
$page = $doc.Pages.Item(1)
$lines = @()
$i = 0
foreach ($sh in $page.Shapes) {
  $i++
  $txt = ""
  $overflow = ""
  $autofit = ""
  $fsize = ""
  $fcolor = ""
  $fill = ""
  if ($sh.Type -eq 17) {
    try { $txt = $sh.TextFrame.TextRange.Text.Replace("`r"," || ").Replace("`n"," || ") } catch {}
    try { $overflow = $sh.TextFrame.Overflowing } catch { $overflow = "?" }
    try { $autofit = $sh.TextFrame.AutoFitText } catch { $autofit = "?" }
    try { $fsize = $sh.TextFrame.TextRange.Font.Size } catch {}
    try { $fcolor = [int]$sh.TextFrame.TextRange.Font.Color.RGB } catch {}
    try { $fill = [int]$sh.Fill.ForeColor.RGB } catch {}
  }
  $lines += ("{0} type={1} overflow={2} autofit={3} size={4} fontRGB={5} fill={6}" -f $i, $sh.Type, $overflow, $autofit, $fsize, $fcolor, $fill)
  if ($txt) { $lines += "  TEXT: $txt" }
}
$doc.Close()
$app.Quit()
$lines | Set-Content $out -Encoding UTF8
Get-Content $out
