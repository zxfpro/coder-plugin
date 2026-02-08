#!/bin/bash
input=$(cat)
# 从 cwd 提取项目名称
project_name=$(echo "$input" | jq -r '.cwd | split("/") | last')


curl -X POST "https://open.feishu.cn/open-apis/bot/v2/hook/7e02b778-c167-40ea-ace9-b5305dee50c8" \
    -H "Content-Type: application/json" \
    -d '{"msg_type":"text","content":{"text":"消息, $project_name 需要您的介入"}}'
