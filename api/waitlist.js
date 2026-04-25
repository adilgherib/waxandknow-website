module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = (body.email || '').trim();
  const source = body.source || 'unknown';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY' });
  }

  const html = `
    <div style="background:#F5EDD8;padding:48px 32px;font-family:Georgia,serif;max-width:520px;margin:0 auto;">
      <p style="font-size:13px;letter-spacing:0.15em;text-transform:uppercase;color:#C8822A;margin-bottom:8px;">Wax & Know</p>
      <h1 style="font-size:32px;color:#2C1A0E;margin:0 0 24px;line-height:1.2;">You're on the list.</h1>
      <p style="font-size:16px;color:#5C3A1E;line-height:1.7;margin-bottom:24px;">
        Thanks for joining the Wax & Know waitlist. We're building something for serious collectors and curious beginners alike - a vinyl companion that teaches you music history while you build your collection.
      </p>
      <p style="font-size:16px;color:#5C3A1E;line-height:1.7;margin-bottom:32px;">
        We'll reach out personally when we're ready for early access. Until then, keep digging.
      </p>
      <div style="border-top:1px solid #E0D0A8;padding-top:24px;margin-top:8px;">
        <p style="font-size:12px;color:#8B5E3C;line-height:1.6;margin:0;">
          You're receiving this because you signed up at waxandknow.com.<br/>
          <a href="mailto:hello@waxandknow.com" style="color:#C8822A;">hello@waxandknow.com</a>
        </p>
      </div>
    </div>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Wax & Know <hello@waxandknow.com>',
        to: email,
        reply_to: 'hello@waxandknow.com',
        subject: "You're on the list - Wax & Know",
        html,
        tags: [{ name: 'source', value: String(source) }]
      })
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      return res.status(502).json({ error: 'Resend request failed', details: errorText });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error' });
  }
};
