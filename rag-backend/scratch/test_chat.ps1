
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZkYTdkODYyZjFkNTNmMzkzZjhiMzciLCJyb2xlIjoidXNlciIsImlhdCI6MTc1MjY2NjQ2NywiZXhwIjoxNzUyNjcwMDY3fQ.y4G9o7Ym4E7o3_Hn6f_2mG-v_H_O_f_X_H_O_f_X_H_O" # Truncated for script readability, I'll use the full one in the command
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    query = "Hello, what is this chatbot about?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/rag/chat" -Method Post -Headers $headers -Body $body
