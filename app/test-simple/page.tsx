export default function TestSimplePage() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ Hello World!</h1>
      <p style={{ fontSize: '24px', marginBottom: '10px' }}>Deployment is working!</p>
      <p style={{ fontSize: '18px', opacity: 0.9 }}>
        If you can see this page, your Next.js app is deployed correctly.
      </p>
      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
        <p style={{ fontSize: '16px', margin: '5px 0' }}>
          <strong>Time:</strong> {new Date().toLocaleString()}
        </p>
        <p style={{ fontSize: '16px', margin: '5px 0' }}>
          <strong>Environment:</strong> {process.env.NODE_ENV || 'unknown'}
        </p>
        <p style={{ fontSize: '16px', margin: '5px 0' }}>
          <strong>Vercel:</strong> {process.env.VERCEL ? 'Yes' : 'No'}
        </p>
      </div>
    </div>
  );
}
