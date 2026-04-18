$html = Get-Content './ai/dashboard.html' -Raw -Encoding UTF8

$scriptBlock = {
    param($port)
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://+:$port/")
    $listener.Start()
    
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContextAsync().Result
            $response = $context.Response
            $path = $context.Request.Url.AbsolutePath
            
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            
            if ($path -eq "/api/kanban") {
                $data = Get-Content './ai/kanban/index.json' -Raw -Encoding UTF8 | ConvertFrom-Json
                $response.ContentType = "application/json"
                $json = ConvertTo-Json $data -Compress
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            } else {
                $response.ContentType = "text/html; charset=utf-8"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
            }
            
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
        } catch { }
    }
}

$job = Start-Job -ScriptBlock $scriptBlock -ArgumentList 8765
Start-Sleep 2
Write-Host "Dashboard: http://localhost:8765"
Write-Host "Or:        http://192.168.1.109:8765"