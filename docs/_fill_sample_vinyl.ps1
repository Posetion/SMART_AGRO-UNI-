$ErrorActionPreference = "Stop"

$sample = "c:\Users\ASUS\Downloads\Telegram Desktop\ProjectSampleVinyl(English).pub"
$pub = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.pub"
$pdf = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl.pdf"
$preview = "D:\SMART-AGRO\docs\Smart-Agro-Community-Vinyl-preview.png"
$ph = "D:\SMART-AGRO\docs\vinyl-sample"
$crestPath = Join-Path $ph "crest.png"

# OLE RGB = R + G*256 + B*65536
$paddy = 46 + (125 * 256) + (50 * 65536)    # #2E7D32
$forest = 27 + (67 * 256) + (50 * 65536)    # #1B4332
$white = 16777215

Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

if (-not (Test-Path $sample)) { throw "Sample vinyl not found: $sample" }
if (-not (Test-Path $crestPath)) { throw "Crest not found: $crestPath" }
Copy-Item $sample $pub -Force

$nl = [char]13
$dia = [char]9670

$objectives = @(
  "$dia  To identify crop diseases and pests with AI, then get treatment and prevention methods"
  "$dia  To obtain expert review and analysis of field cases"
  "$dia  To display regional plant and crop outbreaks on a heatmap"
  "$dia  To build a farmer-to-farmer community for sharing problems, experience and solutions"
  "$dia  To ask weather and farming advice in Myanmar through the AI advisor BaGyi Pyoe"
  "$dia  To increase digital knowledge for farmers with the help of AI"
) -join $nl

$forFarmers = @(
  "For Farmers"
  "$dia  Identify crop diseases and pests with AI"
  "$dia  Ask BaGyi Pyoe for weather and farm advice"
  "$dia  Share problems and solutions with other farmers"
  "$dia  Study diseases and pests in the Knowledge Center"
) -join $nl

$forStaff = @(
  "For Experts"
  "$dia  Review and analyse farmer field cases"
  "$dia  Check regional outbreaks on the heatmap"
  "$dia  Support the farmer-to-farmer community"
) -join $nl

$benefits = @(
  "$dia  An AI farming platform built for Myanmar farmers"
  "$dia  Expert Review so a specialist can check the result"
  "$dia  Heatmap of regional crop disease and pest outbreaks"
  "$dia  Knowledge Center and a Myanmar-language AI chatbot"
) -join $nl

# Font sizes match the sample vinyl (large academic type). AutoFit stays OFF.
$textSpec = @{
  1 = @{ Text = "Objectives"; Kind = "header"; Size = 56 }
  2 = @{ Text = "University of Computer Studies (Meiktila)"; Kind = "title"; Size = 42 }
  3 = @{ Text = $objectives; Kind = "body"; Size = 32 }
  4 = @{ Text = ("SMART AGRO Community" + $nl + "Smart Tool for Myanmar Farmers"); Kind = "title"; Size = 52 }
  5 = @{ Text = "Benefits"; Kind = "header"; Size = 56 }
  6 = @{ Text = $benefits; Kind = "body"; Size = 34 }
  7 = @{ Text = "Functions"; Kind = "header"; Size = 56 }
  8 = @{ Text = $forFarmers; Kind = "body"; Size = 26; Heading = $true }
  9 = @{ Text = $forStaff; Kind = "body"; Size = 26; Heading = $true }
}

$picSpec = @{
  11 = Join-Path $ph "placeholder-1.png"
  12 = Join-Path $ph "placeholder-2.png"
  13 = Join-Path $ph "placeholder-3.png"
}

$app = New-Object -ComObject Publisher.Application
$app.ScreenUpdating = $false
$doc = $app.Open($pub)
$page = $doc.Pages.Item(1)

$captured = @()
$i = 0
foreach ($sh in $page.Shapes) {
  $i++
  $captured += [pscustomobject]@{
    I = $i
    Type = $sh.Type
    Left = $sh.Left
    Top = $sh.Top
    Width = $sh.Width
    Height = $sh.Height
    Shape = $sh
  }
}

$crestGeo = $captured | Where-Object { $_.I -eq 10 } | Select-Object -First 1

# Delete every sample shape, then rebuild so nothing covers the crest.
foreach ($row in ($captured | Sort-Object I -Descending)) {
  $row.Shape.Delete()
}

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

foreach ($row in ($captured | Where-Object { $_.I -le 9 } | Sort-Object I)) {
  $spec = $textSpec[$row.I]
  $box = $page.Shapes.AddTextbox(1, $row.Left, $row.Top, $row.Width, $row.Height)
  $tf = $box.TextFrame
  try { $tf.AutoFitText = 0 } catch {}
  $tr = $tf.TextRange
  $tr.Text = $spec.Text

  if ($spec.Kind -eq "header") {
    $box.Fill.Visible = -1
    $box.Fill.ForeColor.RGB = $paddy
    try { $box.Line.Visible = 0 } catch {}
    $tr.Font.Bold = -1
    $tr.Font.Color.RGB = $white
    try { $tr.ParagraphFormat.Alignment = 1 } catch {}
    try { $tf.VerticalTextAlignment = 1 } catch {}
    try { $tf.MarginLeft = 10; $tf.MarginRight = 10; $tf.MarginTop = 6; $tf.MarginBottom = 6 } catch {}
    Apply-Font $tr "Times New Roman" $spec.Size (-1) $white
  } elseif ($spec.Kind -eq "title") {
    # No fill — a white box here is what hid the university crest.
    try { $box.Fill.Visible = 0 } catch {}
    try { $box.Line.Visible = 0 } catch {}
    $tr.Font.Bold = -1
    $tr.Font.Color.RGB = $paddy
    try { $tr.ParagraphFormat.Alignment = 1 } catch {}
    try { $tf.VerticalTextAlignment = 1 } catch {}
    Apply-Font $tr "Times New Roman" $spec.Size (-1) $paddy
    if ($row.I -eq 4) {
      try { $tr.Paragraphs(2).Font.Name = "Times New Roman" } catch {}
      try { $tr.Paragraphs(2).Font.Size = 30 } catch {}
      try { $tr.Paragraphs(2).Font.Bold = 0 } catch {}
      try { $tr.Paragraphs(2).Font.Italic = -1 } catch {}
      try { $tr.Paragraphs(2).Font.Color.RGB = $paddy } catch {}
    }
  } else {
    $box.Fill.Visible = -1
    $box.Fill.ForeColor.RGB = $white
    try { $box.Line.Visible = -1 } catch {}
    try { $box.Line.ForeColor.RGB = $paddy } catch {}
    try { $box.Line.Weight = 1.75 } catch {}
    try { $tf.MarginLeft = 20; $tf.MarginRight = 16; $tf.MarginTop = 16; $tf.MarginBottom = 14 } catch {}
    try { $tr.ParagraphFormat.SpaceAfter = 12 } catch {}
    Apply-Font $tr "Times New Roman" $spec.Size (0) $forest
    if ($spec.Heading) {
      try { $tr.Paragraphs(1).Font.Name = "Times New Roman" } catch {}
      try { $tr.Paragraphs(1).Font.Bold = -1 } catch {}
      try { $tr.Paragraphs(1).Font.Size = [double]$spec.Size + 8 } catch {}
      try { $tr.Paragraphs(1).Font.Color.RGB = $paddy } catch {}
    }
    try { $tf.AutoFitText = 0 } catch {}
  }
}

foreach ($row in ($captured | Where-Object { $picSpec.ContainsKey($_.I) })) {
  [void]$page.Shapes.AddPicture($picSpec[$row.I], $false, $true, $row.Left, $row.Top, $row.Width, $row.Height)
}

# Embed a high-res crest last and keep it in front.
$cl = 49.5; $ct = 73.3; $cw = 252.2; $ch = 229.1
if ($crestGeo) {
  $cl = $crestGeo.Left; $ct = $crestGeo.Top; $cw = $crestGeo.Width; $ch = $crestGeo.Height
}
# Slightly larger crest so it does not look clipped under the titles
$cw = $cw * 1.08
$ch = $ch * 1.08
$crest = $page.Shapes.AddPicture($crestPath, $false, $true, $cl, $ct, $cw, $ch)
try { $crest.ZOrder(0) } catch {}  # msoBringToFront

$doc.Save()
try { $doc.ExportAsFixedFormat(2, $pdf) } catch { Write-Host "PDF skipped: $($_.Exception.Message)" }
try { $page.SaveAsPicture($preview) } catch { Write-Host "Preview skipped: $($_.Exception.Message)" }
$doc.Close()
$app.Quit()
Start-Sleep -Seconds 1
Get-Process MSPUB -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Get-Item $pub | Format-List FullName, Length, LastWriteTime
if (Test-Path $pdf) { Get-Item $pdf | Format-List FullName, Length }
if (Test-Path $preview) { Get-Item $preview | Format-List FullName, Length }
