# Allow inbound TCP 3000 so your phone can reach the backend.
# Run as Administrator: Right-click PowerShell -> Run as administrator, then run:
#   & "d:\SWE_projetcts\Health-Companion-App\scripts\allow-backend-firewall.ps1"

$ruleName = "Health Companion Backend TCP 3000"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Remove-NetFirewallRule -DisplayName $ruleName
}
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
Write-Host "Done. Inbound TCP 3000 allowed. Try the app from your phone."
