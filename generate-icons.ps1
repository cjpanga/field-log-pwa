Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
$iconsDir = Join-Path $root "icons"
if (-not (Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir | Out-Null }

$accent = [System.Drawing.Color]::FromArgb(255, 0xFF, 0x6B, 0x1A)
$dark   = [System.Drawing.Color]::FromArgb(255, 0x14, 0x18, 0x1C)
$light  = [System.Drawing.Color]::FromArgb(255, 0xE8, 0xEB, 0xEE)

function New-Icon($size, $path, $bgColor, $faceColor, $handColor) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear($bgColor)

  # clock face circle, sized to stay within a maskable-safe zone (~62% of canvas)
  $faceD = [int]($size * 0.62)
  $faceX = [int](($size - $faceD) / 2)
  $faceY = $faceX
  $faceBrush = New-Object System.Drawing.SolidBrush($faceColor)
  $g.FillEllipse($faceBrush, $faceX, $faceY, $faceD, $faceD)

  $cx = $size / 2
  $cy = $size / 2
  $penWidth = [Math]::Max(2, [int]($size * 0.045))
  $pen = New-Object System.Drawing.Pen($handColor, $penWidth)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  # minute hand (up)
  $g.DrawLine($pen, $cx, $cy, $cx, $cy - $size * 0.22)
  # hour hand (right-down)
  $g.DrawLine($pen, $cx, $cy, $cx + $size * 0.15, $cy + $size * 0.06)

  # center dot
  $dotR = [Math]::Max(2, [int]($size * 0.035))
  $dotBrush = New-Object System.Drawing.SolidBrush($handColor)
  $g.FillEllipse($dotBrush, $cx - $dotR, $cy - $dotR, $dotR * 2, $dotR * 2)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
  $faceBrush.Dispose()
  $dotBrush.Dispose()
  $pen.Dispose()
}

# Filenames are versioned (v2) to bust iOS Safari's touch-icon cache, which
# keys off the URL and can keep serving a stale icon even after the web clip
# is deleted and re-added from the home screen.

# light/default variant: orange background, dark face, light hands
New-Icon 180 (Join-Path $iconsDir "icon-180-v2.png") $accent $dark $light
New-Icon 192 (Join-Path $iconsDir "icon-192-v2.png") $accent $dark $light
New-Icon 512 (Join-Path $iconsDir "icon-512-v2.png") $accent $dark $light

# dark-appearance variant: dark background, white face, orange hands
# (used via <link rel="apple-touch-icon" media="(prefers-color-scheme: dark)">
# in case iOS does honor per-appearance touch icons once the cache is busted)
New-Icon 180 (Join-Path $iconsDir "icon-180-dark-v2.png") $dark $light $accent

Write-Host "Icons written to $iconsDir"
