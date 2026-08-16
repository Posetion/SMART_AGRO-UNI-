$ErrorActionPreference = "Stop"
$png = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.png"
$pub = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.pub"
$pdf = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.pdf"

Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
if (-not (Test-Path $png)) { throw "Missing $png" }

$app = New-Object -ComObject Publisher.Application
$app.ScreenUpdating = $false
$doc = $app.NewDocument()
$w = $app.InchesToPoints(24)
$h = $app.InchesToPoints(42)
$doc.PageSetup.PageWidth = $w
$doc.PageSetup.PageHeight = $h
$page = $doc.Pages.Item(1)
[void]$page.Shapes.AddPicture($png, $false, $true, 0, 0, $w, $h)

if (Test-Path $pub) { Remove-Item $pub -Force }
$doc.SaveAs($pub)
try { $doc.ExportAsFixedFormat(2, $pdf) } catch { Write-Host "PDF skipped: $($_.Exception.Message)" }
$doc.Close()
$app.Quit()
Start-Sleep -Seconds 1
Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Item $pub | Format-List FullName, Length, LastWriteTime
if (Test-Path $pdf) { Get-Item $pdf | Format-List FullName, Length }
