$ErrorActionPreference = "Stop"
$pub = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.pub"
Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$app = New-Object -ComObject Publisher.Application
$app.ScreenUpdating = $false
$doc = $app.Open($pub)
$page = $doc.Pages.Item(1)
$i = 0
foreach ($sh in $page.Shapes) {
  $i++
  if ($sh.Type -eq 17) {
    $fillVis = ""
    try { $fillVis = $sh.Fill.Visible } catch { $fillVis = "?" }
    Write-Host ("SHAPE {0} fillVis={1} fillRGB={2}" -f $i, $fillVis, $sh.Fill.ForeColor.RGB)
    $n = $sh.TextFrame.TextRange.Paragraphs.Count
    for ($p = 1; $p -le $n; $p++) {
      $pg = $sh.TextFrame.TextRange.Paragraphs($p)
      $t = $pg.Text.Replace("`r","").Replace("`n","")
      if ($t.Length -gt 60) { $t = $t.Substring(0,60) + "..." }
      Write-Host ("  p{0} size={1} bold={2} name={3} | {4}" -f $p, $pg.Font.Size, $pg.Font.Bold, $pg.Font.Name, $t)
    }
  } else {
    Write-Host ("SHAPE {0} type={1} L={2:N0} T={3:N0} W={4:N0} H={5:N0}" -f $i, $sh.Type, $sh.Left, $sh.Top, $sh.Width, $sh.Height)
  }
}
$doc.Close()
$app.Quit()
