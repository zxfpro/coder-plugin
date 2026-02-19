import { useState, useEffect } from 'react'
import { apiFetch } from "./api/client";
import './App.css'

interface LoginFormData {
  email: string
  password: string
}

interface RegisterFormData {
  email: string
  password: string
  code: string
  confirmPassword: string
}

interface ForgotPasswordData {
  email: string
}

interface ResetPasswordData {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

interface PhoneLoginData {
  phone: string
  code: string
}

interface PhoneCodeData {
  phone: string
}

interface UserProfile {
  id: string
  email?: string
  phone?: string
  points: number
  is_active: boolean
  is_superuser: boolean
}

function App() {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset' | 'phone' | 'profile'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [countdown, setCountdown] = useState(0)

  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    password: '',
    code: '',
    confirmPassword: ''
  })

  const [forgotData, setForgotData] = useState<ForgotPasswordData>({
    email: ''
  })

  const [resetData, setResetData] = useState<ResetPasswordData>({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [phoneLoginData, setPhoneLoginData] = useState<PhoneLoginData>({
    phone: '',
    code: ''
  })

  // const [phoneCodeData, setPhoneCodeData] = useState<PhoneCodeData>({
  //   phone: ''
  // })

  useEffect(() => {
    setIsMounted(true)
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Fetch user profile
      // fetchProfile()
    }
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(loginData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (loginData.password.length === 0) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    try {
      const body = new URLSearchParams({
        username: loginData.email,
        password: loginData.password,
      }).toString();

      const result = await apiFetch<{ access_token: string }>("/auth/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      setSuccess('Login successful!')
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('token_type', 'bearer')
      // fetchProfile()
      setView('profile')

    } catch (err: any) {
      console.error('Login error:', err)
      if (err.detail) {
        const errorMessage = typeof err.detail === 'string' ? err.detail : err.detail.detail || 'Login failed'
        setError(errorMessage === 'LOGIN_BAD_CREDENTIALS' ? '账号或密码错误' : errorMessage)
      } else {
        setError('Network error. Please check if backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!registerData.code) {
      setError('Please enter verification code')
      setLoading(false)
      return
    }

    try {
      const result = await apiFetch('/auth/register_with_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          code: registerData.code
        })
      })

      setSuccess('Registration successful! Please login.')
      setView('login')
      setRegisterData({
        email: '',
        password: '',
        code: '',
        confirmPassword: ''
      })

    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.detail) {
        setError(typeof err.detail === 'string' ? err.detail : err.detail.detail || 'Registration failed')
      } else {
        setError('Network error. Please check if backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendRegisterCode = async () => {
    if (!registerData.email) {
      setError('Please enter your email first')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    try {
      console.log('Sending verification code to:', registerData.email);
      const result = await apiFetch('/auth/register/email/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email }),
      });
      console.log('API response:', result);

      setSuccess('Verification code sent! Please check your email.')
      setCountdown(60)

    } catch (err: any) {
      console.error('Send code error:', err)
      if (err.detail) {
        setError(typeof err.detail === 'string' ? err.detail : err.detail.detail || 'Failed to send verification code')
      } else {
        setError('Network error. Please check if backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      await apiFetch('/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotData)
      })

      setSuccess('Password reset code sent! Please check your email.')
      setResetData(prev => ({ ...prev, email: forgotData.email }))
      setView('reset')

    } catch (err: any) {
      console.error('Forgot password error:', err)
      if (err.detail) {
        setError(typeof err.detail === 'string' ? err.detail : err.detail.detail || 'Failed to send reset code')
      } else {
        setError('Network error. Please check if backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (resetData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!resetData.code) {
      setError('Please enter verification code')
      setLoading(false)
      return
    }

    try {
      await apiFetch('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: resetData.email,
          code: resetData.code,
          new_password: resetData.newPassword
        })
      })

      setSuccess('Password reset successful! Please login.')
      setView('login')
      setResetData({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
      })

    } catch (err: any) {
      console.error('Reset password error:', err)
      if (err.detail) {
        setError(typeof err.detail === 'string' ? err.detail : err.detail.detail || 'Password reset failed')
      } else {
        setError('Network error. Please check if backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendPhoneCode = async () => {
    if (!phoneCodeData.phone) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8007/auth/phone/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(phoneCodeData)
      })

      if (response.ok) {
        setSuccess('Verification code sent!')
        setCountdown(60)
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to send verification code')
      }
    } catch (err) {
      setError('Network error. Please check if backend server is running.')
      console.error('Send phone code error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!phoneLoginData.phone) {
      setError('Please enter your phone number')
      setLoading(false)
      return
    }

    if (!phoneLoginData.code) {
      setError('Please enter verification code')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:8007/auth/phone/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(phoneLoginData)
      })

      if (response.ok) {
        setSuccess('Login successful!')
        setView('profile')
      } else {
        const data = await response.json()
        setError(data.detail || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please check if backend server is running.')
      console.error('Phone login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch('http://localhost:8007/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('token_type')
      setUser(null)
      setView('login')
    }
  }

  // const fetchProfile = async () => {
  //   const token = localStorage.getItem('token')
  //   if (!token) return

  //   try {
  //     const response = await fetch('http://localhost:8007/api/me', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     })

  //     if (response.ok) {
  //       const data = await response.json()
  //       setUser(data)
  //     }
  //   } catch (err) {
  //     console.error('Fetch profile error:', err)
  //   }
  // }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    })
  }

  const handleForgotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotData({
      ...forgotData,
      [e.target.name]: e.target.value
    })
  }

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetData({
      ...resetData,
      [e.target.name]: e.target.value
    })
  }

  const handlePhoneLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneLoginData({
      ...phoneLoginData,
      [e.target.name]: e.target.value
    })
  }

  // const handlePhoneCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setPhoneCodeData({
  //     ...phoneCodeData,
  //     [e.target.name]: e.target.value
  //   })
  // }

  return (
    <div className="app-container">
      <div className="auth-container">
        <div
          className="auth-card"
          style={{
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease'
          }}
        >
          {view === 'profile' ? (
            <>
              <h1 className="auth-title">My Profile</h1>
              <p className="auth-subtitle">Welcome to your profile</p>

              {error && (
                <div className="alert alert-error" data-testid="error-alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" data-testid="success-alert">
                  {success}
                </div>
              )}

              {user ? (
                <div className="profile-info">
                  <div className="profile-field">
                    <strong>Email:</strong> {user.email || 'Not provided'}
                  </div>
                  <div className="profile-field">
                    <strong>Phone:</strong> {user.phone || 'Not provided'}
                  </div>
                  <div className="profile-field">
                    <strong>Points:</strong> {user.points}
                  </div>
                  <div className="profile-field">
                    <strong>Status:</strong> {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ) : (
                <div className="profile-loading">Loading profile...</div>
              )}

              <button
                type="button"
                className="btn-primary"
                onClick={handleLogout}
                disabled={loading}
                style={{ marginTop: '2rem' }}
              >
                Logout
              </button>
            </>
          ) : view === 'forgot' ? (
            <>
              <h1 className="auth-title">Forgot Password</h1>
              <p className="auth-subtitle">Enter your email to receive reset instructions</p>

              {error && (
                <div className="alert alert-error" data-testid="error-alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" data-testid="success-alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={forgotData.email}
                    onChange={handleForgotChange}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    data-testid="email-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  Remember your password?
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('login')}
                    disabled={loading}
                    data-testid="switch-mode-button"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          ) : view === 'reset' ? (
            <>
              <h1 className="auth-title">Reset Password</h1>
              <p className="auth-subtitle">Enter your new password</p>

              {error && (
                <div className="alert alert-error" data-testid="error-alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" data-testid="success-alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label htmlFor="code">Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={resetData.code}
                    onChange={handleResetChange}
                    placeholder="Enter code"
                    required
                    disabled={loading}
                    data-testid="code-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                    data-testid="new-password-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    data-testid="confirm-password-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  Back to
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('login')}
                    disabled={loading}
                    data-testid="switch-mode-button"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          ) : view === 'phone' ? (
            <>
              <h1 className="auth-title">Phone Login</h1>
              <p className="auth-subtitle">Login with your phone number</p>

              {error && (
                <div className="alert alert-error" data-testid="error-alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" data-testid="success-alert">
                  {success}
                </div>
              )}

              <form onSubmit={handlePhoneLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phoneLoginData.phone}
                    onChange={handlePhoneLoginChange}
                    placeholder="Enter phone number"
                    required
                    disabled={loading}
                    data-testid="phone-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code">Verification Code</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={phoneLoginData.code}
                      onChange={handlePhoneLoginChange}
                      placeholder="Enter code"
                      required
                      disabled={loading || countdown > 0}
                      data-testid="code-input"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSendPhoneCode}
                      disabled={loading || countdown > 0 || !phoneCodeData.phone}
                      style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    >
                      {countdown > 0 ? `${countdown}s` : 'Send Code'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  Back to
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('login')}
                    disabled={loading}
                    data-testid="switch-mode-button"
                  >
                    Email Login
                  </button>
                </p>
              </div>
            </>
          ) : view === 'register' ? (
            <>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join us today and start your journey</p>

              {error && (
                <div className="alert alert-error" data-testid="error-alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" data-testid="success-alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    data-testid="email-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code">Verification Code</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={registerData.code}
                      onChange={handleRegisterChange}
                      placeholder="Enter code"
                      required
                      disabled={loading}
                      data-testid="code-input"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSendRegisterCode}
                      disabled={loading || countdown > 0 || !registerData.email}
                      style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}
                    >
                      {countdown > 0 ? `${countdown}s` : 'Send Code'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Create a password"
                    required
                    disabled={loading}
                    data-testid="password-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                    data-testid="confirm-password-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  Already have an account?
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('login')}
                    disabled={loading}
                    data-testid="switch-mode-button"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to your account to continue</p>

              {error && (
                <div className="alert alert-error" data-testid="error-alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" data-testid="success-alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    data-testid="email-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    data-testid="password-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  data-testid="submit-button"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('forgot')}
                    disabled={loading}
                    data-testid="forgot-password-button"
                  >
                    Forgot Password?
                  </button>
                </p>
                <p>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('phone')}
                    disabled={loading}
                    data-testid="phone-login-button"
                  >
                    Login with Phone
                  </button>
                </p>
                <p>
                  没有账户?
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setView('register')}
                    disabled={loading}
                    data-testid="switch-mode-button"
                  >
                    注册
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App