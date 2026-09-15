# ============================================================
#  Infonix Deployment Script v3 - LOCAL BUILD + PSCP UPLOAD
#  Avoids git on server entirely (server DNS can't reach GitHub)
#
#  Usage:
#    .\deploy.ps1                      -> Interactive menu
#    .\deploy.ps1 -EnvName allblog     -> Build + deploy all blog
#    .\deploy.ps1 -EnvName all         -> Everything
#
#  Environments: dev | au | com | blogadmin | blogapi | allblog | all
# ============================================================

param ([string]$EnvName)

$plink    = "C:\Program Files\PuTTY\plink.exe"
$pscp     = "C:\Program Files\PuTTY\pscp.exe"
$baseDir  = Split-Path $MyInvocation.MyCommand.Path -Parent  # d:\infonix

$blogApiUrl = "https://api.infogenx.com/api"

foreach ($tool in @($plink, $pscp)) {
    if (-not (Test-Path $tool)) {
        Write-Host "ERROR: $tool not found. Install PuTTY from https://putty.org" -ForegroundColor Red
        exit 1
    }
}

# ── Server environments ───────────────────────────────────────
$environments = @{
    "Dev" = @{
        Host = "209.182.232.150"; User = "infogenx-dev"; Pass = "infogenx@1234"
        LocalSrc  = "$baseDir\dev"
        RemoteDir = "/home/infogenx-dev/htdocs/dev.infogenx.com"
        Label = "Dev        (dev.infogenx.com)"; Type = "Frontend"
    }
    "Au" = @{
        Host = "209.182.232.150"; User = "infogenxau"; Pass = "infogenx@1234"
        LocalSrc  = "$baseDir\infogenx.com.au"
        RemoteDir = "/home/infogenxau/htdocs/infogenx.com.au"
        Label = "AU         (infogenx.com.au)"; Type = "Frontend"
    }
    "Com" = @{
        Host = "209.182.232.150"; User = "infogenx"; Pass = "infogenx@1234"
        LocalSrc  = "$baseDir\infogenx.com"
        RemoteDir = "/home/infogenx/htdocs/infogenx.com"
        Label = "COM        (infogenx.com)"; Type = "Frontend"
    }
    "BlogAdmin" = @{
        Host = "209.182.232.150"; User = "infogenx-blogadmin"; Pass = "infogenx-blogadmin@1234"
        LocalSrc  = "$baseDir\blog-react"
        RemoteDir = "/home/infogenx-blogadmin/htdocs/blogadmin.infogenx.com"
        Label = "BlogAdmin  (blogadmin.infogenx.com)"; Type = "Frontend"
    }
    "BlogApi" = @{
        Host = "209.182.232.150"; User = "infogenx-api"; Pass = "infogenx-api@1234"
        LocalSrc  = "$baseDir\blog-api"
        RemoteDir = "/home/infogenx-api/htdocs/api.infogenx.com"
        Label = "BlogAPI    (api.infogenx.com)"; Type = "Api"
    }
    "Dialer" = @{
        Host = "209.182.232.150"; User = "infogenx-twilliodialer"; Pass = "gdccD7t9rt0NIss6GTNF"
        LocalSrc  = "$baseDir\infogenx-twilio-dialer"
        RemoteDir = "/home/infogenx-twilliodialer/htdocs/twilliodialer.infogenx.com"
        Label = "Dialer     (twilliodialer.infogenx.com)"; Type = "Django"
    }
    "Candidates" = @{
        Host = "209.182.232.150"; User = "infogenx-candidates"; Pass = "infogenx@1234"
        LocalSrc  = "$baseDir\infogenx-candidates-onboarding\frontend"
        RemoteDir = "/home/infogenx-candidates/htdocs/candidates.infogenx.com"
        Label = "Candidates (candidates.infogenx.com)"; Type = "Frontend"
    }
}

# ── Helper: run plink SSH command ─────────────────────────────
function Invoke-SSH($user, $srvHost, $pass, $cmd) {
    $clean = $cmd -replace "`r`n", "`n"
    $output = "y" | & $plink -ssh -batch -pw $pass "$user@$srvHost" $clean
    $output | ForEach-Object { Write-Host $_ }
    return $LASTEXITCODE
}

# ── Build + upload frontend ───────────────────────────────────
function Deploy-Frontend($env) {
    $src = $env.LocalSrc
    $name = Split-Path $src -Leaf

    $env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"

    Write-Host "  [0/5] Running Automated SEO Guardrail Verification..." -ForegroundColor Magenta
    & python "$baseDir\scripts\seo_audit_guardrail.py"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Automated SEO Guardrail Check FAILED! Deployment aborted." -ForegroundColor Red
        return $false
    }

    Write-Host "  [1/5] Clearing caches in $name..." -ForegroundColor DarkCyan
    Remove-Item "$src\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$src\.cache"              -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path "$src\build") {
        try {
            Remove-Item "$src\build" -Recurse -Force -ErrorAction Stop
        } catch {
            cmd.exe /c "rmdir /s /q `"$src\build`""
        }
    }


    Write-Host "  [2/5] Installing dependencies..." -ForegroundColor DarkCyan
    $npmResult = & npm install --prefix $src --legacy-peer-deps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  npm install failed:" -ForegroundColor Red
        Write-Host $npmResult -ForegroundColor Red
        return $false
    }

    Write-Host "  [3/5] Building ($name)..." -ForegroundColor DarkCyan
    if (Test-Path "$src\build") {
        Remove-Item "$src\build" -Recurse -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path "$src\dist") {
        Remove-Item "$src\dist" -Recurse -Force -ErrorAction SilentlyContinue
    }
    $env:REACT_APP_BLOG_API_URL = $blogApiUrl
    $env:PUPPETEER_EXECUTABLE_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    $env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
    $env:GENERATE_SOURCEMAP = "false"
    $env:DISABLE_ESLINT_PLUGIN = "true"
    Push-Location $src
    if (Test-Path "$src\vite.config.js") {
        $buildResult = & npm run build 2>&1
        if (Test-Path "$src\dist") {
            Copy-Item "$src\dist" "$src\build" -Recurse -Force
        }
    } else {
        $buildResult = & node "$src\node_modules\react-scripts\bin\react-scripts.js" build 2>&1
    }
    Pop-Location
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path "$src\build\index.html")) {
        Write-Host "  Build failed!" -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
        return $false
    }

    # Pre-render dynamic blog posts for SEO
    $siteParam = "com"
    if ($name -match "com\.au") { $siteParam = "com.au" }
    elseif ($name -match "dev") { $siteParam = "dev" }
    
    if ($name -ne "blog-react" -and $name -ne "infogenx-twilio-dialer" -and $name -ne "student-onboarding") {
        Write-Host "  [3b/5] Pre-rendering dynamic blog posts for SEO ($siteParam)..." -ForegroundColor DarkCyan
        try {
            $blogApiRes = Invoke-RestMethod -Uri "$blogApiUrl/posts?site=$siteParam" -Method Get -TimeoutSec 15
            $posts = $blogApiRes.posts
            if ($posts -and $posts.Count -gt 0) {
                foreach ($p in $posts) {
                    $blogDir = "$src\build\blog\$($p.slug)"
                    if (-not (Test-Path $blogDir)) { New-Item -ItemType Directory -Path $blogDir -Force | Out-Null }
                    $prerenderUrl = "$blogApiUrl/seo/prerender/blog/$($p.slug)?site=$siteParam"
                    Invoke-WebRequest -Uri $prerenderUrl -OutFile "$blogDir\index.html" -TimeoutSec 15 | Out-Null
                }
                Write-Host "  Successfully pre-rendered $($posts.Count) blog posts into build/blog/!" -ForegroundColor Green
            }
        } catch {
            Write-Host "  Warning: Blog pre-rendering step failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Ensure build/blog/index.html always exists so Nginx never returns 403 Forbidden on /blog/
        if (Test-Path "$src\build\blog") {
            Copy-Item "$src\build\index.html" "$src\build\blog\index.html" -Force
        }
    }

    Write-Host "  [4/5] Packaging and Uploading build to server..." -ForegroundColor DarkCyan
    
    # 1. Compress build folder using tar.exe in $env:TEMP (avoids Drive D: partition exhaustion)
    $tempDir = [System.IO.Path]::GetTempPath()
    $archivePath = Join-Path $tempDir "build.tar.gz"
    Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
    Remove-Item "$archivePath.part*" -Force -ErrorAction SilentlyContinue
    & tar.exe -czf $archivePath -C "$src\build" .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  tar compression failed!" -ForegroundColor Red
        return $false
    }
    
    # 2. Split and Upload build.tar.gz in chunks of 10MB
    $chunkSize = 10 * 1024 * 1024 # 10MB
    $buffer = New-Object System.Byte[] $chunkSize
    $reader = [System.IO.File]::OpenRead($archivePath)
    $chunkFiles = @()
    $chunkNum = 0
    try {
        while ($true) {
            $bytesRead = $reader.Read($buffer, 0, $chunkSize)
            if ($bytesRead -le 0) { break }
            $chunkFile = "$archivePath.part$chunkNum"
            $writer = [System.IO.File]::Create($chunkFile)
            try {
                $writer.Write($buffer, 0, $bytesRead)
            } finally {
                $writer.Close()
            }
            $chunkFiles += $chunkFile
            $chunkNum++
        }
    } finally {
        $reader.Close()
    }

    Write-Host "  Uploading build.tar.gz in $($chunkFiles.Count) parts..." -ForegroundColor DarkCyan
    foreach ($part in $chunkFiles) {
        $partName = Split-Path $part -Leaf
        Write-Host "  Uploading $partName..." -ForegroundColor DarkCyan
        & $pscp -pw $env.Pass $part "$($env.User)@$($env.Host):$($env.RemoteDir)/" | Out-Host
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  pscp upload of $partName failed!" -ForegroundColor Red
            $chunkFiles | ForEach-Object { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
            Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
            return $false
        }
    }
    # Cleanup local parts and archive
    $chunkFiles | ForEach-Object { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
    Remove-Item $archivePath -Force -ErrorAction SilentlyContinue

    # 3. Reconstruct and Extract on server
    Write-Host "  [5/5] Reconstructing and Extracting build on server..." -ForegroundColor DarkCyan
    
    $reconstructCmd = "cat $($env.RemoteDir)/build.tar.gz.part* > $($env.RemoteDir)/build.tar.gz && rm -f $($env.RemoteDir)/build.tar.gz.part*"
    Invoke-SSH $env.User $env.Host $env.Pass $reconstructCmd | Out-Null

    if ($env.DeployToRoot) {
        $extractCmd = "find $($env.RemoteDir) -mindepth 1 -maxdepth 1 ! -name '.well-known' ! -name 'build.tar.gz' -exec rm -rf {} + && tar -xzf $($env.RemoteDir)/build.tar.gz -C $($env.RemoteDir)/ && rm -f $($env.RemoteDir)/build.tar.gz"
    } else {
        $extractCmd = "rm -rf $($env.RemoteDir)/build_old 2>/dev/null; mv $($env.RemoteDir)/build $($env.RemoteDir)/build_old 2>/dev/null; mkdir -p $($env.RemoteDir)/build && tar -xzf $($env.RemoteDir)/build.tar.gz -C $($env.RemoteDir)/build/ && rm -f $($env.RemoteDir)/build.tar.gz"
    }
    Invoke-SSH $env.User $env.Host $env.Pass $extractCmd | Out-Null

    Write-Host "  Fixing permissions..." -ForegroundColor DarkCyan
    if ($env.DeployToRoot) {
        $permCmd = "find $($env.RemoteDir) -mindepth 1 -maxdepth 1 ! -name '.well-known' -exec chmod -R 755 {} + && find $($env.RemoteDir) -mindepth 1 ! -path '*/.well-known*' -type f -exec chmod 644 {} +"
    } else {
        $permCmd = "chmod -R 755 $($env.RemoteDir)/build && find $($env.RemoteDir)/build -type f -exec chmod 644 {} +"
    }
    Invoke-SSH $env.User $env.Host $env.Pass $permCmd | Out-Null

    if ($env.DeployToRoot) {
        Write-Host "  Verifying index.html..." -ForegroundColor DarkCyan
        $checkCmd = "test -f $($env.RemoteDir)/index.html && echo OK || echo MISSING"
    } else {
        Write-Host "  Verifying build/index.html..." -ForegroundColor DarkCyan
        $checkCmd = "test -f $($env.RemoteDir)/build/index.html && echo OK || echo MISSING"
    }
    $check = Invoke-SSH $env.User $env.Host $env.Pass $checkCmd
    return $true
}

# ── Upload blog-api source + restart PM2 ─────────────────────
function Deploy-Api($env) {
    $src = $env.LocalSrc
    $nvmPre = "export NVM_DIR=`"`$HOME/.nvm`" && [ -s `"`$NVM_DIR/nvm.sh`" ] && \. `"`$NVM_DIR/nvm.sh`" && "

    Write-Host "  [1/4] Uploading API source files (excl. node_modules)..." -ForegroundColor DarkCyan
    # Upload everything except node_modules and .git
    $uploadCmd = "mkdir -p $($env.RemoteDir)"
    Invoke-SSH $env.User $env.Host $env.Pass $uploadCmd | Out-Null

    # Copy all files via pscp (node_modules excluded by listing individual key dirs/files)
    $apiFiles = @("server.js","websocket.js","package.json","package-lock.json","public","routes","middleware","database",".env","db","utils","services","cron","assets")
    foreach ($item in $apiFiles) {
        $localPath = "$src\$item"
        if (Test-Path $localPath) {
            & $pscp -batch -r -pw $env.Pass $localPath "$($env.User)@$($env.Host):$($env.RemoteDir)/" | Out-Null
        }
    }

    Write-Host "  [2/4] Installing dependencies on server..." -ForegroundColor DarkCyan
    $installCmd = $nvmPre + "cd $($env.RemoteDir) && npm install --omit=dev 2>&1"
    $r = Invoke-SSH $env.User $env.Host $env.Pass $installCmd
    if ($r -ne 0) { Write-Host "  npm install failed on server" -ForegroundColor Red; return $false }

    Write-Host "  [3/4] Running DB migrations..." -ForegroundColor DarkCyan
    $migrateCmd = $nvmPre + "cd $($env.RemoteDir) && node database/migrate.js"
    Invoke-SSH $env.User $env.Host $env.Pass $migrateCmd | Out-Null

    Write-Host "  [4/4] Restarting PM2..." -ForegroundColor DarkCyan
    $pm2Cmd = $nvmPre + "cd $($env.RemoteDir) && (pm2 restart blog-api || pm2 start server.js --name blog-api) && pm2 status blog-api && pm2 save"
    $r = Invoke-SSH $env.User $env.Host $env.Pass $pm2Cmd
    return ($r -eq 0)
}

# ── Deploy Django app via pscp (no git on server) ────────────
function Deploy-Django($env) {
    $src    = $env.LocalSrc
    $remote = $env.RemoteDir

    Write-Host "  [1/6] Creating remote directories..." -ForegroundColor DarkCyan
    $mkdirCmd = "mkdir -p $remote"
    Invoke-SSH $env.User $env.Host $env.Pass $mkdirCmd | Out-Null

    Write-Host "  [2/6] Uploading project files via pscp..." -ForegroundColor DarkCyan
    # Upload everything except venv, __pycache__, db.sqlite3, node_modules, .git
    $djangoFiles = @(
        "manage.py","requirements.txt","twilio_dialer","dialer","db_setup.sql","setup_server.sh","deploy.sh"
    )
    foreach ($item in $djangoFiles) {
        $localPath = "$src\$item"
        if (Test-Path $localPath) {
            Write-Host "    Uploading $item..." -ForegroundColor Gray
            $result = & $pscp -batch -r -pw $env.Pass $localPath "$($env.User)@$($env.Host):$remote/" 2>&1
        }
    }

    Write-Host "  [3/6] Writing .env on server..." -ForegroundColor DarkCyan
    $createEnvCmd = @"
cat > $remote/.env << 'EOENV'
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_NUMBER=+61748024033
TWILIO_API_KEY=YOUR_TWILIO_API_KEY
TWILIO_API_SECRET=YOUR_TWILIO_API_SECRET
TWILIO_APP_SID=YOUR_TWILIO_APP_SID
TWILIO_MESSAGING_SERVICE_SID=YOUR_TWILIO_MESSAGING_SERVICE_SID
WHATSAPP_PHONE_NUMBER=+61480050400
WHATSAPP_PROVIDER=ZADARMA_META
DB_NAME=twilliodialer
DB_USER=infogenxtwilliodialer
DB_PASSWORD=TNPnwwVk7h4R47mTRilG
DB_HOST=127.0.0.1
DB_PORT=3306
VOICE_AGENT_DB=/home/infogenx-twilliodialer/htdocs/twilliodialer.infogenx.com/data/infogenx.db
TEST_PHONE_NUMBER=+61403339424
FORWARD_CALL_NUMBERS=+61403339424,+919787806366
FORWARD_SMS_NUMBERS=+61403339424
FORWARD_MOBILE_NUMBER=+61403339424,+919787806366
POST_CALL_WEBHOOK=https://flow.zoho.in/60070621801/flow/webhook/incoming?zapikey=1001.4b1fc5dccfd0bb515f489e8fa1023150.ac6dd0ea4269db3f348f5b25e9795c6d&isdebug=false
ZADARMA_API_KEY=e46c3011a890e51ba140
ZADARMA_API_SECRET=ec1376429df5cf7f5f74
ZADARMA_NUMBER=+61480050400
ZADARMA_SIP=100
ZADARMA_WIDGET_ID=not_needed
DIALER_API_KEY=infogenx-secret-2026
TWILIO_SIP_DOMAIN=infogenx-dialer-80244ea6.sip.us1.twilio.com
TWILIO_SIP_USER=zoho_user
ULGEBRA_SMS_WEBHOOK=https://api.ulgebra.com/v1/webhooks?a=twilioforzohocrm&o=1290746000000451410&t=dHdpbGlvZm9yem9ob2NybS5XUTNYVGVBSzR0Zkl4OFNHM0RWYm5QVWN2Q1YyLl9UUEFfM2FlYmUyOWFkOGY1LTRkYWQtOWRjMi05NTFkMjBmYzVkMmM=
ADDITIONAL_SMS_RECIPIENT=+61403339424
ZOHO_CAMPAIGNS_CLIENT_ID=1000.I8BXR1U9XEX0TGSSBBS969PUAQDDCO
ZOHO_CAMPAIGNS_CLIENT_SECRET=f0b12ded0b82b34eca1aa52f3a4e688ac43603755b
ZOHO_CAMPAIGNS_REFRESH_TOKEN=1000.6818a1993384a74811b3d1b587b31368.b38f5b6af4a0d23d66185f1ce04e7cb4
HOLD_MUSIC_URL=https://api.twilio.com/cowbell.mp3
VAPID_PUBLIC_KEY=BEx2doSL92dpgR5l-hraCLDgcSqvdkHk5Zi4Wj1R3kYmBD7sP6lr_CQqTx7kh0E_Fq2Qj-9y0paNhHj4qxgQPQg
VAPID_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0hBZ0VBTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEJHMHdhd0lCQVFRZ3ZmbEkvSURCWVoyR2MrNDgKQmxQb0FIWVk3dmI5MTQrUUF4bWczK04vUlVDaFJBTkNBQVJNZG5hRWkvZG5hWUVlWmZvYTJnaXc0SEVxcjNaQgo1T1dZdUZvOVVkNUdKZ1ErN0QrcGEvd2tLazhlNUlkQlB4YXRrSS92Y3RLV2pZUjQrS3NZRUQwSQotLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tCg==
VAPID_CLAIM_EMAIL=admin@infogenx.com
EOENV

"@
    Invoke-SSH $env.User $env.Host $env.Pass $createEnvCmd | Out-Null

    Write-Host "  [4/6] Setting up Python venv + installing packages..." -ForegroundColor DarkCyan
    $setupCmd = "cd $remote && ([ -d .venv ] || python3 -m venv .venv) && .venv/bin/pip install --upgrade pip --quiet && .venv/bin/pip install -r requirements.txt --quiet 2>&1"
    $r = Invoke-SSH $env.User $env.Host $env.Pass $setupCmd
    if ($r -ne 0) { Write-Host "  pip install failed!" -ForegroundColor Red; return $false }

    Write-Host "  [5/6] Running Django migrations + collectstatic..." -ForegroundColor DarkCyan
    $migrateCmd = "cd $remote && .venv/bin/python manage.py migrate --noinput 2>&1 && .venv/bin/python manage.py collectstatic --noinput --clear 2>&1"
    Invoke-SSH $env.User $env.Host $env.Pass $migrateCmd | Out-Null

    Write-Host "  [6/6] Reloading Gunicorn (Zero Downtime)..." -ForegroundColor DarkCyan
    $gunicornCmd = 'cd ' + $remote + ' && PID_FILE="gunicorn.pid" && if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then echo "Zero-downtime graceful reload..." && kill -HUP $(cat "$PID_FILE"); else pkill -f "gunicorn.*twilio_dialer" 2>/dev/null || true; sleep 1; .venv/bin/gunicorn twilio_dialer.wsgi:application --bind 127.0.0.1:8090 --workers 3 --daemon --pid gunicorn.pid --access-logfile gunicorn_access.log --error-logfile gunicorn_error.log --forwarded-allow-ips="*" 2>&1; fi'
    Invoke-SSH $env.User $env.Host $env.Pass $gunicornCmd | Out-Null

    Start-Sleep -Seconds 3
    Write-Host "  Verifying app is up on port 8090..." -ForegroundColor DarkCyan
    $checkCmd = "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090/ 2>/dev/null"
    $code = Invoke-SSH $env.User $env.Host $env.Pass $checkCmd
    Write-Host "  HTTP Response: $code" -ForegroundColor Cyan
    return $true
}

# ── Selection logic ───────────────────────────────────────────
$selected = @()
if ($EnvName) {
    switch ($EnvName.ToLower()) {
        "dev"        { $selected = @("Dev") }
        "au"         { $selected = @("Au") }
        "com"        { $selected = @("Com") }
        "blogadmin"  { $selected = @("BlogAdmin") }
        "blogapi"    { $selected = @("BlogApi") }
        "dialer"     { $selected = @("Dialer") }
        "candidates" { $selected = @("Candidates") }
        "allblog"    { $selected = @("Dev","Au","Com","BlogAdmin","BlogApi") }
        "all"        { $selected = @("Dev","Au","Com","BlogAdmin","BlogApi","Dialer","Candidates") }
        default { Write-Host "Invalid: '$EnvName'. Use: dev|au|com|blogadmin|blogapi|dialer|candidates|allblog|all" -ForegroundColor Red; exit 1 }
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Infonix Deployment Tool v3.1" -ForegroundColor Cyan
    Write-Host "  (Local Build + Direct Upload)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " 1) Dev        dev.infogenx.com" -ForegroundColor Green
    Write-Host " 2) AU         infogenx.com.au" -ForegroundColor Green
    Write-Host " 3) COM        infogenx.com" -ForegroundColor Green
    Write-Host " 4) BlogAdmin  blogadmin.infogenx.com" -ForegroundColor Blue
    Write-Host " 5) BlogAPI    api.infogenx.com" -ForegroundColor Blue
    Write-Host " 6) ALL Blog   Dev+AU+COM+BlogAdmin+BlogAPI" -ForegroundColor Yellow
    Write-Host " 7) ALL        Everything (incl. Dialer & Candidates)" -ForegroundColor Yellow
    Write-Host " 8) Dialer     twilliodialer.infogenx.com" -ForegroundColor Cyan
    Write-Host " 9) Candidates candidates.infogenx.com" -ForegroundColor Magenta
    Write-Host " 0) Exit" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    $choice = Read-Host "Select [0-9]"
    switch ($choice) {
        "1" { $selected = @("Dev") }
        "2" { $selected = @("Au") }
        "3" { $selected = @("Com") }
        "4" { $selected = @("BlogAdmin") }
        "5" { $selected = @("BlogApi") }
        "6" { $selected = @("Dev","Au","Com","BlogAdmin","BlogApi") }
        "7" { $selected = @("Dev","Au","Com","BlogAdmin","BlogApi","Dialer","Candidates") }
        "8" { $selected = @("Dialer") }
        "9" { $selected = @("Candidates") }
        "0" { exit 0 }
        default { Write-Host "Invalid." -ForegroundColor Red; exit 1 }
    }
}

# ── Deploy ────────────────────────────────────────────────────
$failures = @()

foreach ($envKey in $selected) {
    $env = $environments[$envKey]

    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Magenta
    Write-Host "  Deploying: $($env.Label)" -ForegroundColor Magenta
    Write-Host "----------------------------------------" -ForegroundColor Magenta

    $ok = if ($envKey -eq "Candidates") {
        & "$baseDir\infogenx-candidates-onboarding\scripts\deploy_candidates.ps1"
        ($LASTEXITCODE -eq 0)
    } elseif ($env.Type -eq "Api") { 
        Deploy-Api $env 
    } elseif ($env.Type -eq "Django") { 
        Deploy-Django $env 
    } else { 
        Deploy-Frontend $env 
    }

    if ($ok) {
        Write-Host "SUCCESS: $($env.Label)" -ForegroundColor Green
    } else {
        Write-Host "FAILED : $($env.Label)" -ForegroundColor Red
        $failures += $env.Label
    }
}

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($failures.Count -eq 0) {
    Write-Host "  All deployments completed!" -ForegroundColor Green
} else {
    Write-Host "  $($failures.Count) failure(s):" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
Write-Host "========================================" -ForegroundColor Cyan
