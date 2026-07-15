import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
    const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;
    const BEEHIIV_API_URL = process.env.BEEHIIV_API_URL || 'https://api.beehiiv.com';

    if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
      return NextResponse.json(
        { error: 'Newsletter is not configured yet.' },
        { status: 503 }
      );
    }

    const response = await fetch(
      `${BEEHIIV_API_URL}/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 409) {
        return NextResponse.json(
          { error: "You're already subscribed." },
          { status: 409 }
        );
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to subscribe');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
