param (
    [string]$InputFile = "..\..\source_full.doc",
    [string]$OutputFile = "..\..\full_output.html"
)

$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# Resolve paths relative to script dir if they are relative
if (-not [System.IO.Path]::IsPathRooted($InputFile)) {
    $InputFile = Join-Path $currentDir $InputFile
}
if (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
    $OutputFile = Join-Path $currentDir $OutputFile
}

$path = [System.IO.Path]::GetFullPath($InputFile)
$htmlPath = [System.IO.Path]::GetFullPath($OutputFile)

Write-Host "Converting: $path"
Write-Host "To: $htmlPath"

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false

    if (-not (Test-Path $path)) {
        throw "Input file not found: $path"
    }

    # Open the document
    $doc = $word.Documents.Open($path, $false, $true) # ReadOnly

    # Save as HTML (FileFormat 8 is wdFormatHTML)
    $doc.SaveAs([ref]$htmlPath, [ref]8)

    Write-Output "Successfully converted to HTML at: $htmlPath"

    $doc.Close($false)
} catch {
    Write-Error $_.Exception.Message
} finally {
    if ($word) {
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
}