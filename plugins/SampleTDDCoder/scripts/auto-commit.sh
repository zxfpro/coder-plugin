#!/bin/bash

# 检测是否在 worktree 中
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  
  # 检查是否有更改
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git add -A
    git commit -m "Auto commit by Claude on branch: $BRANCH"
    git push origin "$BRANCH"
  fi
fi
