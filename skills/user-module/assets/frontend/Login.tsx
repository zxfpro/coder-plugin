import * as React from 'react';
import { useAuth } from './auth/AuthContext';

interface ILoginState {
  username: string;
  password: string;
  message?: string;
}

export default function Login(): JSX.Element {
  const { login } = useAuth();

  const [state, setState] = React.useState<ILoginState>({
    username: '',
    password: '',
    message: '',
  });

  const handleLogin = async () => {
    const { username, password } = state;
    try {
      await login(username, password);
      setState(s => ({ ...s, message: '' }));
    } catch {
      setState(s => ({ ...s, message: '账号或者密码不正确' }));
    }
  };

  const handleForget = () => {
    (window as any).__goForgot__?.();
  };

  const handleBack = () => {
    (window as any).__goEntry__?.();
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>邮箱登录</h2>

        <input
          style={styles.input}
          type="text"
          placeholder="邮箱 / 用户名"
          value={state.username}
          onChange={e => setState(s => ({ ...s, username: e.target.value }))}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="密码"
          value={state.password}
          onChange={e => setState(s => ({ ...s, password: e.target.value }))}
        />

        <button style={styles.loginBtn} onClick={handleLogin}>登录</button>

        {state.message && (
          <div style={styles.message}>{state.message}</div>
        )}

        <div style={styles.actions}>
          <span style={styles.link} onClick={() => (window as any).__goRegister__?.()}>注册</span>
          <span style={styles.link} onClick={handleForget}>忘记密码?</span>
        </div>

        <button style={styles.backBtn} onClick={handleBack}>返回</button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#1e1e1e',
  },
  box: {
    width: 320,
    padding: 24,
    background: '#2a2a2a',
    borderRadius: 8,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 12,
    borderRadius: 4,
    border: '1px solid #444',
    outline: 'none',
  },
  loginBtn: {
    width: '100%',
    padding: '10px 0',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  message: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  link: {
    color: '#4ea1ff',
    cursor: 'pointer',
    fontSize: 12,
  },
  backBtn: {
    width: '100%',
    padding: '8px 0',
    marginTop: 12,
    background: 'transparent',
    color: '#888',
    border: '1px solid #444',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  },
};