$ErrorActionPreference = "Stop"

$ENV_FILE = "apps\application\.env"

# Kill any existing ngrok
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force

# Start ngrok in background (port 3000 = content/Payload)
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http 3000" -PassThru -WindowStyle Hidden

Write-Host "Starting ngrok (PID: $($ngrokProcess.Id))..."
Write-Host "Waiting for tunnel..."

# Wait up to 30 seconds for tunnel URL
$url = $null
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($tunnel) {
            $url = $tunnel.public_url
            break
        }
    } catch {
        # Not ready yet
    }
    Start-Sleep -Seconds 1
}

if (-not $url) {
    Write-Error "ERROR: Could not get ngrok URL after 30 seconds"
    Stop-Process -Id $ngrokProcess.Id -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Ngrok tunnel ready: $url"

# Update .env file
$content = Get-Content $ENV_FILE
$content = $content -replace "^EXPO_PUBLIC_API_URL=.*", "EXPO_PUBLIC_API_URL=$url/"
Set-Content -Path $ENV_FILE -Value $content

Write-Host "Updated $ENV_FILE -> EXPO_PUBLIC_API_URL=$url/"
