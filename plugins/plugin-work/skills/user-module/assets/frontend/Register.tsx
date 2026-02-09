import * as React from 'react';
import { apiFetch } from './api/client';

interface IRegisterProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function Register(props: IRegisterProps) {
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [sending, setSending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [error, setError] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'verify' | 'success'>('email');
  const [redirectCountdown, setRedirectCountdown] = React.useState(3);

  // 验证码倒计时
  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // 注册成功后跳转登录倒计时
  React.useEffect(() => {
    if (step !== 'success') return;
    if (redirectCountdown <= 0) {
      props.onSuccess();
      return;
    }
    const t = setInterval(() => setRedirectCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, redirectCountdown]);

  const sendCode = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('邮箱格式不正确');
      return;
    }

    if (sending) return;
    try {
      setError('');
      setSending(true);
      await apiFetch('/auth/register/email/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStep('verify');
      setCountdown(60);
    } catch (e: any) {
      console.log('Send code error:', e);

      // 处理后端返回的错误信息
      let errorMessage = '发送验证码失败';

      if (e?.detail) {
        if (typeof e.detail === 'string') {
          errorMessage = e.detail;
        } else if (e.detail.detail) {
          errorMessage = e.detail.detail;
        }
      } else if (e?.message) {
        errorMessage = e.message;
      }

      // 根据错误信息显示对应提示
      if (errorMessage.includes('exist') || errorMessage.includes('already')) {
        setError('该邮箱已注册，请直接登录');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const register = async () => {
    if (!code) {
      setError('请输入验证码');
      return;
    }
    if (!password || !confirmPassword) {
      setError('请输入密码');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    try {
      setError('');
      await apiFetch('/auth/register_with_code', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
      });
      setStep('success');
      setRedirectCountdown(3);
    } catch (e: any) {
      console.log('Registration error:', e);

      // 处理后端返回的错误信息
      // FastAPI 返回格式: { detail: "error message" }
      let errorMessage = '注册失败，请重试';

      if (e?.detail) {
        // detail 可能是字符串或对象
        if (typeof e.detail === 'string') {
          errorMessage = e.detail;
        } else if (e.detail.detail) {
          errorMessage = e.detail.detail;
        }
      } else if (e?.message) {
        errorMessage = e.message;
      }

      // 根据错误信息显示对应提示
      if (errorMessage.includes('invalid') || errorMessage.includes('expired') || errorMessage.includes('code')) {
        setError('验证码不正确或已过期');
      } else if (errorMessage.includes('exist')) {
        setError('用户已存在');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>注册账号</h2>

        {step === 'email' && (
          <>
            <input
              style={styles.input}
              placeholder="邮箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button style={styles.primaryBtn} onClick={sendCode} disabled={sending}>
              {sending ? '发送中...' : '发送验证码'}
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <input style={styles.input} value={email} disabled />
            <div style={styles.codeRow}>
              <input
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="验证码"
                value={code}
                onChange={e => setCode(e.target.value)}
              />
              <button
                style={styles.codeBtn}
                disabled={countdown > 0}
                onClick={sendCode}
              >
                {countdown > 0 ? `${countdown}s` : '重发'}
              </button>
            </div>
            <input
              style={styles.input}
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <button style={styles.primaryBtn} onClick={register}>注册</button>
          </>
        )}

        {step === 'success' && (
          <div style={styles.successBox}>
            <div style={styles.successText}>✅ 注册成功</div>
            <div style={styles.countdownText}>即将跳转到登录页（{redirectCountdown}s）</div>
          </div>
        )}

        {error && step !== 'success' && <div style={styles.message}>{error}</div>}

        {step !== 'success' && (
          <button style={styles.linkBtn} onClick={props.onBack}>返回登录</button>
        )}
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
    width: 340,
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
  primaryBtn: {
    width: '100%',
    padding: '10px 0',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    marginBottom: 8,
  },
  linkBtn: {
    width: '100%',
    padding: '8px 0',
    background: 'transparent',
    color: '#4ea1ff',
    border: 'none',
    cursor: 'pointer',
  },
  message: {
    marginTop: 8,
    color: 'red',
    textAlign: 'center',
    fontSize: 12,
  },
  codeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  codeBtn: {
    padding: '0 12px',
    background: '#555',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
  },
  successBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    background: '#f0fff4',
    textAlign: 'center',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    marginBottom: 4,
  },
  countdownText: {
    color: '#555',
    fontSize: 12,
  },
};