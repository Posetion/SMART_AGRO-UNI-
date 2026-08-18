$ErrorActionPreference = "Stop"

$src = "C:\Users\ASUS\Desktop\Smart-Agro-Community-Vinyl6.pub"
$dest = "C:\Users\ASUS\Desktop\Smart-Agro-Community-Vinyl6.pub"
$preview = "C:\Users\ASUS\Desktop\Smart-Agro-Community-Vinyl6-preview.png"

$paddy = 46 + (125 * 256) + (50 * 65536)    # #2E7D32
$forest = 27 + (67 * 256) + (50 * 65536)    # #1B4332
$white = 16777215
$nl = [char]13
$dot = "  " + [char]183 + "  "

Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$app = New-Object -ComObject Publisher.Application
$app.ScreenUpdating = $false
$doc = $app.Open($src)
$page = $doc.Pages.Item(1)

function Apply-Font($tr, $name, $size, $bold, $color) {
  $tr.Font.Name = $name
  $tr.Font.Size = [double]$size
  $tr.Font.Bold = $bold
  $tr.Font.Color.RGB = $color
  try {
    $n = $tr.Paragraphs.Count
    for ($p = 1; $p -le $n; $p++) {
      $pg = $tr.Paragraphs($p)
      $pg.Font.Name = $name
      $pg.Font.Size = [double]$size
      $pg.Font.Bold = $bold
      $pg.Font.Color.RGB = $color
    }
  } catch {}
}

$empty = $null
foreach ($sh in $page.Shapes) {
  if ($sh.Type -eq 17 -and $sh.Top -gt 3000) {
    $empty = $sh
    break
  }
}
if (-not $empty) { throw "Bottom team box not found" }

$headerH = 100.0
$gap = 10.0
$left = $empty.Left
$top = $empty.Top
$width = $empty.Width
$bottom = $empty.Top + $empty.Height

# Green section bar, same family as Objectives / Functions / Benefits
$hdr = $page.Shapes.AddTextbox(1, 90.9, $top, 602.5, $headerH)
$hdr.Fill.Visible = -1
$hdr.Fill.ForeColor.RGB = $paddy
try { $hdr.Line.Visible = 0 } catch {}
$htf = $hdr.TextFrame
try { $htf.AutoFitText = 0 } catch {}
try { $htf.VerticalTextAlignment = 1 } catch {}
try { $htf.MarginLeft = 10; $htf.MarginRight = 10; $htf.MarginTop = 6; $htf.MarginBottom = 6 } catch {}
$htr = $htf.TextRange
$htr.Text = "Team"
try { $htr.ParagraphFormat.Alignment = 1 } catch {}
Apply-Font $htr "Times New Roman" 52 (-1) $white

# Remaining framed box: team name + four members
$bodyTop = $top + $headerH + $gap
$bodyH = [Math]::Max(160.0, $bottom - $bodyTop)
$empty.Top = $bodyTop
$empty.Height = $bodyH
$empty.Left = $left
$empty.Width = $width

$tf = $empty.TextFrame
try { $tf.AutoFitText = 0 } catch {}
try { $tf.VerticalTextAlignment = 1 } catch {}
try { $tf.MarginLeft = 20; $tf.MarginRight = 20; $tf.MarginTop = 12; $tf.MarginBottom = 12 } catch {}
$empty.Fill.Visible = -1
$empty.Fill.ForeColor.RGB = $white
try { $empty.Line.Visible = -1 } catch {}
try { $empty.Line.ForeColor.RGB = $paddy } catch {}
try { $empty.Line.Weight = 1.75 } catch {}

$members = "Arkar Thet Naing" + $dot + "Khant Zaw" + $nl + "Kaung Myat Tun" + $dot + "Yawai Aung"
$tr = $tf.TextRange
$tr.Text = "NextGen Innovators" + $nl + $members
try { $tr.ParagraphFormat.Alignment = 1 } catch {}
Apply-Font $tr "Times New Roman" 36 (0) $forest

try {
  $tr.Paragraphs(1).Font.Name = "Times New Roman"
  $tr.Paragraphs(1).Font.Size = 52
  $tr.Paragraphs(1).Font.Bold = -1
  $tr.Paragraphs(1).Font.Color.RGB = $paddy
  $tr.Paragraphs(1).ParagraphFormat.SpaceAfter = 14
} catch {}
try {
  $tr.Paragraphs(2).Font.Name = "Times New Roman"
  $tr.Paragraphs(2).Font.Size = 34
  $tr.Paragraphs(2).Font.Bold = 0
  $tr.Paragraphs(2).Font.Color.RGB = $forest
  $tr.Paragraphs(2).ParagraphFormat.SpaceAfter = 8
} catch {}
try {
  $tr.Paragraphs(3).Font.Name = "Times New Roman"
  $tr.Paragraphs(3).Font.Size = 34
  $tr.Paragraphs(3).Font.Bold = 0
  $tr.Paragraphs(3).Font.Color.RGB = $forest
} catch {}

$doc.Save()
try { $page.SaveAsPicture($preview) } catch { Write-Host "Preview skipped: $($_.Exception.Message)" }
$doc.Close()
$app.Quit()
Start-Sleep -Seconds 1
Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Get-Item $dest | Format-List FullName, Length, LastWriteTime
if (Test-Path $preview) { Get-Item $preview | Format-List FullName, Length }
