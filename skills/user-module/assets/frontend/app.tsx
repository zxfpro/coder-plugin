import * as React from 'react'; // 引入 React 库，使用函数组件和 Hook
import Login from './Login'; // 引入登录页面组件
import Register from './Register'; // 引入注册页面组件
import ForgotPassword from './ForgotPassword'; // 引入忘记密码页面组件
import Editor from './Editor'; // 引入主编辑器（登录后显示的核心界面）
import { AuthProvider, useAuth } from './auth/AuthContext'; // 引入认证上下文：Provider 和获取认证状态的 Hook

interface IAppProps {} // （未使用）App 组件的 props 类型定义，当前为空
interface IAppState { // （未使用）App 组件的 state 类型定义
  loggedIn: boolean; // 是否已登录
  page: 'login' | 'register'; // 当前页面类型（旧设计，已被下面的 page state 替代）
}

import Entry from './Entry'; // 引入入口页组件（选择邮箱登录 / 其他方式）

function AppInner() { // 内部 App 组件：负责根据状态决定渲染哪个页面
  const { isAuthenticated } = useAuth(); // 从认证上下文中获取"是否已登录"状态
  const [page, setPage] = React.useState<'entry' | 'login' | 'register' | 'forgot'>('entry'); // 本地状态：控制当前显示的页面，默认是入口页

  // 暴露给 Login 用于跳转注册 / 忘记密码页（PS 插件环境下不引入路由）
  (window as any).__goRegister__ = () => setPage('register'); // 在全局 window 上挂方法：切换到注册页
  (window as any).__goForgot__ = () => setPage('forgot'); // 在全局 window 上挂方法：切换到忘记密码页
  (window as any).__goEntry__ = () => setPage('entry'); // 在全局 window 上挂方法：返回入口页

  if (isAuthenticated) { // 如果已经通过认证（已登录）
    return <Editor />; // 直接渲染编辑器，不再显示登录/注册相关页面
  }

  if (page === 'entry') { // 如果当前页面是入口页
    return (
      <Entry // 渲染入口组件
        onEmailLogin={() => setPage('login')} // 点击"邮箱登录"时，切换到登录页
        onPhoneLogin={() => alert('手机登录暂未开放')} // 点击"手机登录"时，弹出提示（功能未实现）
      />
    ); // 返回入口页 JSX
  }

  if (page === 'register') { // 如果当前页面是注册页
    return <Register onSuccess={() => setPage('login')} onBack={() => setPage('entry')} />; // 注册成功跳转登录页，返回跳转入口页
  }

  if (page === 'forgot') { // 如果当前页面是忘记密码页
    return <ForgotPassword onBack={() => setPage('entry')} />; // 返回时跳转回入口页
  }

  return <Login />; // 兜底情况：默认渲染登录页
}

export default function App() { // 对外导出的根 App 组件
  return (
    <AuthProvider> {/* 使用认证上下文 Provider 包裹整个应用 */}
      <AppInner /> {/* 实际页面渲染逻辑在 AppInner 中 */}
    </AuthProvider>
  ); // 返回 JSX
}
