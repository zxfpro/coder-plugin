---
name: tdd-workflow
description: 在编写新功能、修复 Bug 或重构代码时使用此技能。强制执行测试驱动开发（TDD），要求单元 / 集成 / E2E 测试覆盖率 ≥ 80%。
---

# 测试驱动开发（TDD）工作流

该技能确保**所有代码开发都遵循 TDD 原则**，并具备**全面的测试覆盖率**。

---

## 何时启用（When to Activate）

在以下场景中必须启用：

- 编写新功能或新逻辑  
- 修复 Bug 或问题  
- 重构现有代码  
- 新增 API 接口  
- 创建新组件  

---

## 核心原则（Core Principles）

### 1. 测试先于代码（Tests BEFORE Code）
**始终先写测试**，再编写代码让测试通过。

---

### 2. 覆盖率要求（Coverage Requirements）
- 最低 **80% 覆盖率**（单元 + 集成 + E2E）  
- 所有边界情况必须覆盖  
- 错误场景必须测试  
- 边界条件必须验证  

---

### 3. 测试类型（Test Types）

#### 单元测试（Unit Tests）
- 单个函数和工具方法  
- 组件内部逻辑  
- 纯函数  
- Helper 与工具函数  

#### 集成测试（Integration Tests）
- API 接口  
- 数据库操作  
- 服务之间的交互  
- 外部 API 调用  

#### E2E 测试（Playwright）
- 关键用户路径  
- 完整业务流程  
- 浏览器自动化  
- UI 交互验证  

---

## TDD 工作流步骤（TDD Workflow Steps）

### 第 1 步：编写用户故事（Write User Journeys）

```
作为一个 [角色]，
我希望 [执行某个操作]，
从而 [获得某种价值]

示例：
作为一名用户，
我希望能够通过语义搜索查找市场，
即使没有精确关键词也能找到相关市场。
```

---

### 第 2 步：生成测试用例（Generate Test Cases）

针对每个用户故事，创建全面的测试用例：

```typescript
describe('语义搜索', () => {
  it('根据查询返回相关市场', async () => {
    // 主流程测试
  })

  it('能够优雅处理空查询', async () => {
    // 边界情况测试
  })

  it('当 Redis 不可用时回退到子串搜索', async () => {
    // 回退逻辑测试
  })

  it('按相似度得分排序结果', async () => {
    // 排序逻辑测试
  })
})
```

---

### 第 3 步：运行测试（应当失败）

```bash
npm test
# 测试应当失败 —— 因为功能尚未实现
```

---

### 第 4 步：实现代码（Implement Code）

编写**最少量**代码，使测试通过：

```typescript
// 由测试驱动实现
export async function searchMarkets(query: string) {
  // 实现逻辑
}
```

---

### 第 5 步：再次运行测试

```bash
npm test
# 所有测试现在应当通过
```

---

### 第 6 步：重构（Refactor）

在保持测试通过（green）的前提下改进代码质量：

- 消除重复  
- 改善命名  
- 优化性能  
- 提高可读性  

---

### 第 7 步：验证覆盖率（Verify Coverage）

```bash
npm run test:coverage
# 确认覆盖率 ≥ 80%
```

---

## 测试模式示例（Testing Patterns）

### 单元测试模式（Jest / Vitest）

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button 组件', () => {
  it('使用正确的文本渲染', () => {
    render(<Button>点击</Button>)
    expect(screen.getByText('点击')).toBeInTheDocument()
  })

  it('点击时调用 onClick', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>点击</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('当 disabled 为 true 时按钮不可用', () => {
    render(<Button disabled>点击</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

### API 集成测试模式

```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('成功返回市场数据', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('校验查询参数', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('优雅处理数据库错误', async () => {
    // Mock 数据库异常
  })
})
```

---

### E2E 测试模式（Playwright）

```typescript
import { test, expect } from '@playwright/test'

test('用户可以搜索并筛选市场', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/markets"]')

  await expect(page.locator('h1')).toContainText('Markets')

  await page.fill('input[placeholder="Search markets"]', 'election')
  await page.waitForTimeout(600)

  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  await page.click('button:has-text("Active")')
  await expect(results).toHaveCount(3)
})

test('用户可以创建新市场', async ({ page }) => {
  await page.goto('/creator-dashboard')

  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  await page.click('button[type="submit"]')

  await expect(page.locator('text=Market created successfully')).toBeVisible()
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

---

## 测试文件组织结构（Test File Organization）

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx      # 单元测试
│   │   └── Button.stories.tsx
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts    # 集成测试
└── e2e/
    ├── markets.spec.ts          # E2E 测试
    ├── trading.spec.ts
    └── auth.spec.ts
```

---

## 外部服务 Mock（Mocking External Services）

### Supabase Mock

```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({
            data: [{ id: 1, name: 'Test Market' }],
            error: null
          })
        )
      }))
    }))
  }
}))
```

### Redis Mock

```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() =>
    Promise.resolve([{ slug: 'test-market', similarity_score: 0.95 }])
  ),
  checkRedisHealth: jest.fn(() =>
    Promise.resolve({ connected: true })
  )
}))
```

### OpenAI Mock

```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() =>
    Promise.resolve(new Array(1536).fill(0.1))
  )
}))
```

---

## 测试覆盖率校验（Test Coverage Verification）

### 运行覆盖率报告

```bash
npm run test:coverage
```

### 覆盖率阈值配置

```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

---

## 常见测试误区（Common Testing Mistakes）

### ❌ 错误：测试实现细节
```typescript
expect(component.state.count).toBe(5)
```

### ✅ 正确：测试用户可见行为
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

---

### ❌ 错误：脆弱的选择器
```typescript
await page.click('.css-class-xyz')
```

### ✅ 正确：语义化选择器
```typescript
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

---

### ❌ 错误：测试相互依赖
```typescript
test('创建用户', () => {})
test('更新同一个用户', () => {})
```

### ✅ 正确：测试彼此独立
```typescript
test('创建用户', () => {
  const user = createTestUser()
})

test('更新用户', () => {
  const user = createTestUser()
})
```

---

## 持续测试（Continuous Testing）

### 开发时 Watch 模式
```bash
npm test -- --watch
```

### Git 提交前 Hook
```bash
npm test && npm run lint
```

### CI / CD 集成示例
```yaml
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## 最佳实践（Best Practices）

1. 始终测试先行  
2. 一个测试只验证一个行为  
3. 测试名称清晰可读  
4. 使用 Arrange–Act–Assert 结构  
5. Mock 外部依赖  
6. 覆盖边界情况  
7. 测试错误路径  
8. 保持测试快速（单元测试 < 50ms）  
9. 测试后无副作用  
10. 定期审查覆盖率报告  

---

## 成功指标（Success Metrics）

- 覆盖率 ≥ 80%  
- 所有测试通过（绿灯）  
- 无跳过 / 禁用测试  
- 单元测试执行时间 < 30 秒  
- E2E 覆盖关键用户路径  
- 测试能在上线前发现问题  

---

**请记住**：  
✅ 测试不是可选项。  
✅ 它们是支撑安全重构、快速迭代和生产稳定性的核心保障。
