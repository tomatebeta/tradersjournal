import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert trading coach and technical analyst with deep experience in price action, risk management, trading psychology, and market structure across futures, stocks, forex, and crypto.

When reviewing a trade, structure your response with these exact sections:

## Setup Quality
Rate 1-10 and evaluate the trade setup, confluence, and reasoning.

## Entry Analysis
Was the entry optimal? Timing, location, and any improvements.

## Exit Analysis
Was the exit well-timed? Did they leave money on the table or exit correctly?

## Risk Management
Assess position sizing, stop placement, and risk/reward ratio.

## Psychology & Discipline
Any emotional or psychological observations from the description or chart.

## Key Lessons
3 specific, actionable takeaways from this trade.

## Overall Grade
Give a letter grade (A+ through F) with a one-sentence justification.

Be direct, specific, and constructive. Use proper trading terminology. If a chart image is provided, reference specific price action and patterns you observe.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageBase64, tradeData, apiKey } = await req.json();

    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: 'No OpenAI API key provided. Add it in Settings → AI Integration.' },
        { status: 400 }
      );
    }

    if (!prompt && !imageBase64) {
      return NextResponse.json(
        { error: 'Provide a trade description or chart image.' },
        { status: 400 }
      );
    }

    const userContent: object[] = [];

    if (tradeData) {
      userContent.push({ type: 'text', text: `**Trade Data:**\n${tradeData}\n\n` });
    }

    if (prompt) {
      userContent.push({ type: 'text', text: `**Trader's Notes:**\n${prompt}` });
    }

    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageBase64, detail: 'high' },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1800,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message || `OpenAI error ${response.status}`;
      return NextResponse.json({ error: msg }, { status: response.status });
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const review = data.choices[0]?.message?.content ?? '';

    return NextResponse.json({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
