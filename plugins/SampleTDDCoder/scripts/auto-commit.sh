#!/bin/bash
say "hello"

if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  
  if ! git diff --quiet || ! git diff --cached --quiet; then
    # 先获取 diff，再 add
    DIFF=$(git diff)
    git add -A
    
    # 使用 claude -p 生成提交信息
    echo "$DIFF" | claude -p "为这些更改生成一个简洁的 git commit 信息" | git commit -F -
    
    git push origin "$BRANCH"
  fi
fi