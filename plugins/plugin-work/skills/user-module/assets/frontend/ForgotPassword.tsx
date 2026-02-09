import * as React from 'react';
import { apiFetch } from './api/client';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword(props: ForgotPasswordProps) {
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [step, setStep] = React.useState<'email' | 'reset' | 'success'>('email');
  const [countdown, setCountdown] = React.useState(0);
  const [error, setError] = React.useState('');

  // 倒计时
  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

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

    try {
      setError('');
      await apiFetch('/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStep('reset');
      setCountdown(60);
    } catch (e: any) {
      console.log('Send code error:', e);

      // 处理后端返回的错误信息
      let errorMessage = '验证码发送失败';

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
      if (errorMessage.includes('not found') || errorMessage.includes('不存在')) {
        setError('该邮箱未注册');
      } else {
        setError(errorMessage);
      }
    }
  };

  const resetPassword = async () => {
    if (!code) {
      setError('请输入验证码');
      return;
    }
    if (!password || !confirmPassword) {
      setError('请输入新密码');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    try {
      setError('');
      await apiFetch('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ email, code, new_password: password }),
      });
      setStep('success');
    } catch (e: any) {
      console.log('Reset password error:', e);

      // 处理后端返回的错误信息
      let errorMessage = '重置失败，请重试';

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
      if (errorMessage.includes('invalid') || errorMessage.includes('expired') || errorMessage.includes('code')) {
        setError('验证码不正确或已过期');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>重置密码</h2>

        {step === 'email' && (
          <>
            <input style={styles.input} placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} />
            <button style={styles.primaryBtn} onClick={sendCode}>发送验证码</button>
          </>
        )}

        {step === 'reset' && (
          <>
            <input style={styles.input} value={email} disabled />
            <div style={styles.codeRow}>
              <input
                style={{ ...styles.input, marginBottom: 0 }}
                placeholder="验证码"
                value={code}
                onChange={e => setCode(e.target.value)}
              />
              <button style={styles.codeBtn} disabled={countdown > 0} onClick={sendCode}>
                {countdown > 0 ? `${countdown}s` : '重发'}
              </button>
            </div>
            <input style={styles.input} type="password" placeholder="新密码" value={password} onChange={e => setPassword(e.target.value)} />
            <input style={styles.input} type="password" placeholder="确认新密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <button style={styles.primaryBtn} onClick={resetPassword}>确认重置</button>
          </>
        )}

        {step === 'success' && (
          <div style={styles.successBox}>
            <div style={styles.successText}>✅ 密码重置成功</div>
            <div style={styles.link} onClick={props.onBack}>返回登录</div>
          </div>
        )}

        {error && <div style={styles.message}>{error}</div>}

        {step !== 'success' && <button style={styles.linkBtn} onClick={props.onBack}>返回登录</button>}
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
  title: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', padding: '10px 12px', marginBottom: 12, borderRadius: 4, border: '1px solid #444' },
  primaryBtn: { width: '100%', padding: '10px 0', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 8 },
  linkBtn: { width: '100%', padding: '8px 0', background: 'transparent', color: '#4ea1ff', border: 'none', cursor: 'pointer' },
  message: { marginTop: 8, color: 'red', textAlign: 'center', fontSize: 12 },
  codeRow: { display: 'flex', gap: 8, marginBottom: 12 },
  codeBtn: { padding: '0 12px', background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  successBox: { marginTop: 16, padding: 12, borderRadius: 6, background: '#f0fff4', textAlign: 'center' },
  successText: { color: '#2e7d32', fontSize: 14, marginBottom: 8 },
  link: { color: '#4ea1ff', cursor: 'pointer', fontSize: 12 },
};