import bcrypt from 'bcryptjs'
import supabase from '../supabase.js'

export function registerAuthRoutes(app) {
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' })
      }

      const { data: user, error } = await supabase
        .from('record_users')
        .select('id, email, display_name, role, password_hash, is_active')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (error || !user) return res.status(401).json({ error: 'Invalid credentials' })
      if (!user.is_active) return res.status(403).json({ error: 'Account disabled' })

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

      await supabase
        .from('record_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      const { password_hash, ...safeUser } = user
      res.json({ user: safeUser })
    } catch (err) {
      console.error('Login error:', err)
      res.status(500).json({ error: 'Server error' })
    }
  })
}
