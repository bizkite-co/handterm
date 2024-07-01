
# Define the payload with the 'body' property
$payloadObject = @{
    body = '{ "username": "testuser", "password": "FastTrack#1", "email": "email@example.com" }'
}
# Convert the payload object to JSON
$payloadJson = $payloadObject | ConvertTo-Json
# Convert the JSON to a UTF-8 byte array
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payloadJson)
# Convert the byte array to a Base64-encoded string
$base64 = [Convert]::ToBase64String($bytes)
# Invoke the Lambda function with the Base64-encoded payload
aws lambda invoke --function-name HandTermCdkStack-SignUpFunctionCFE784C5-qDLsuBvd1ODa --payload $base64 response.json 



