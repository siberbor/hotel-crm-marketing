$script = @"
`$html = Get-Content './ai/dashboard.html' -Raw -Encoding UTF8

`$server = {
    param(`$port)
    
    `$listener = New-Object System.Net.HttpListener
    `$listener.Prefixes.Add("http://+:8765/")
    `$listener.Start()
    
    while (`$listener.IsListening) {
        `$context = `$listener.GetContextAsync().Result
        `$response = `$context.Response
        `$path = `$context.Request.Url.AbsolutePath
        
        `$response.Headers.Add("Access-Control-Allow-Origin", "*")
        `$response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        
        if (`$path -eq "/api/kanban") {
            `$data = Get-Content './ai/kanban/index.json' -Raw -Encoding UTF8 | ConvertFrom-Json
            `$response.ContentType = "application/json"
            `$buffer = [System.Text.Encoding]::UTF8.GetBytes(`(ConvertTo-Json `$data -Compress))
        } else {
            `$response.ContentType = "text/html; charset=utf-8"
            `$buffer = [System.Text.Encoding]::UTF8.GetBytes(`$html)
        }
        
        `$response.ContentLength64 = `$buffer.Length
        `$response.OutputStream.Write(`$buffer, 0, `$buffer.Length)
        `$response.Close()
    }
}

`$job = Start-Job -ScriptBlock `$server -ArgumentList 8765
"@

$script | Out-File -FilePath ./start-dashboard.ps1 -Encoding UTF8