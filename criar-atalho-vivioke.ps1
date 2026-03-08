$projectPath = "C:\Users\nb28166\Documents\Ambiente\pessoal\Workspace\vivioke"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Vivioke.lnk"

$installedExeCandidates = @(
	"$env:LOCALAPPDATA\Programs\Vivioke\Vivioke.exe",
	"$env:ProgramFiles\Vivioke\Vivioke.exe",
	"$env:ProgramFiles(x86)\Vivioke\Vivioke.exe",
	"$projectPath\release\win-unpacked\Vivioke.exe"
)

$desktopTarget = $installedExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)

if ($desktopTarget) {
	$shortcut.TargetPath = $desktopTarget
	$shortcut.WorkingDirectory = Split-Path $desktopTarget -Parent
	$shortcut.Description = "Abrir aplicativo Vivioke"
	$shortcut.IconLocation = "$desktopTarget,0"
	Write-Host "Atalho configurado para app desktop: $desktopTarget"
} else {
	$shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
	$shortcut.Arguments = "/k cd /d `"$projectPath`" && npm run start && start http://localhost:3002"
	$shortcut.WorkingDirectory = $projectPath
	$shortcut.Description = "Abrir Vivioke (modo servidor local)"
	Write-Host "App desktop não encontrado. Atalho criado em modo fallback (npm start)."
}

$shortcut.Save()
Write-Host "Atalho criado em: $shortcutPath"