#!/bin/bash

# Define the input and output file paths
input_file="email-table.json"
output_file="email-table-sorted.csv"

aws dynamodb scan --table-name email-table > "$input_file"

# Use jq to sort by createdDate and output to CSV
jq -r '.Items | sort_by(.createdDate.S) | .[] | [.email.S, .createdDate.S] | @csv' "$input_file" > "$output_file"

echo "CSV file created at $output_file"
