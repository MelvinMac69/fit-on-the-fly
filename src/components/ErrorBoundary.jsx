import React, { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Log to console for external monitoring
    console.error('[Fit-On-The-Fly] Render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state

      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0D0D0F',
          color: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '24px', maxWidth: '360px' }}>
            The app encountered an error. This is usually caused by old cached data.
          </p>

          {/* Always show error details — critical for debugging */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            marginBottom: '24px',
          }}>
            <div style={{
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '11px', color: '#EF4444', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                <strong>Error:</strong> {error?.toString()}
              </div>
              {errorInfo?.componentStack && (
                <pre style={{
                  marginTop: '12px',
                  fontSize: '10px',
                  color: '#A1A1AA',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#F97316',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#EF4444',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Clear All Data & Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
