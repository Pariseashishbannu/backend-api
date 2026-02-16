<#
Auto-activate a virtual environment in the current workspace folder.
Looks for `.venv` then `venv` and sources the corresponding Activate.ps1.
Run this from your PowerShell profile to automatically activate when you `cd` into the repo.
#>

$venvNames = @('.venv','venv')
foreach ($name in $venvNames) {
    $activatePath = Join-Path -Path (Get-Location) -ChildPath (Join-Path $name 'Scripts\Activate.ps1')
    if (Test-Path $activatePath) {
        . $activatePath
        return
    }
}
