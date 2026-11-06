import Anthropic from '@anthropic-ai/sdk';

// Node.js runtime: the Anthropic SDK imports @opentelemetry/api, which the Edge runtime cannot bundle.
export const config = { maxDuration: 60 };

// Kept in step with src/data.ts — just what Claude needs to know about each stop.
const STOPS: Record<string, { place: string; stay: string; dates: string }> = {
  paris: { place: 'Paris, staying at Maisons-Laffitte (RER A into central Paris)', stay: 'Sandaya Paris Maisons-Laffitte campsite', dates: '30 June–3 July 2027' },
  disney: { place: 'Disneyland Paris area (Marne-la-Vallée / Val d’Europe)', stay: 'Les Villages Nature Paris', dates: '3–7 July 2027' },
  beauval: { place: 'Saint-Aignan, Loir-et-Cher, beside ZooParc de Beauval', stay: 'Les Pagodes de Beauval hotel', dates: '7–8 July 2027' },
  loire: { place: 'Mesland, Loire Valley, between Blois and Amboise', stay: 'Yelloh! Village Parc du Val de Loire campsite', dates: '8–11 July 2027' },
  lacanau: { place: 'Lacanau-Océan, Gironde, on the Atlantic coast', stay: 'Yelloh! Village Les Grands Pins campsite', dates: '11–18 July 2027 (14 July is Bastille Day)' },
  rochelle: { place: 'La Rochelle, near the train station and old port', stay: 'Ibis Styles La Rochelle Centre Gare', dates: '18–19 July 2027' },
  granville: { place: 'Granville, Normandy, on the cliff by the old walled town', stay: 'Mercure Granville Le Grand Large', dates: '19–20 July 2027' },
};

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response('ANTHROPIC_API_KEY is not set on this Vercel project', { status: 500 });

  let body: { stop?: unknown; type?: unknown; distance?: unknown };
  try { body = await request.json() as typeof body; } catch { return new Response('Invalid JSON', { status: 400 }); }

  const stop = STOPS[String(body.stop ?? '')];
  const type = String(body.type ?? '').slice(0, 80).trim();
  const distance = String(body.distance ?? '').slice(0, 40).trim();
  if (!stop || !type || !distance) return new Response('Missing fields', { status: 400 });

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: 'claude-sonnet-5',
    // Sonnet 5 thinks by default; a tight cap let thinking consume the whole budget and
    // end the stream with no text. Low effort keeps replies quick for a simple list.
    max_tokens: 8000,
    output_config: { effort: 'low' },
    system: `You are a friendly local guide helping an Irish family of five on a summer road trip in France: two parents and three kids aged 9, 11 and 13. They have a car.
Give specific, real places with their actual names. Prefer places that are open in July and good for that age range.
Reply with a numbered list of 5 ideas. For each: the name in **bold**, then one or two short sentences on why it suits this family and any practical tip (booking, best time, rough price).
No introduction or sign-off. Plain British/Irish English.`,
    messages: [{
      role: 'user',
      content: `We're staying at ${stop.stay} in ${stop.place}, ${stop.dates}. Suggest ${type} within ${distance}.`,
    }],
  });

  const enc = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        let sent = 0;
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            sent += event.delta.text.length;
            controller.enqueue(enc.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (!sent) console.error('suggest: no text returned', { stop_reason: final.stop_reason, usage: final.usage });
        controller.close();
      } catch (err) {
        console.error('suggest: stream failed', err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
