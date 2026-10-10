async function main() {
  try {
    const res = await fetch('http://localhost:3001/api/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How do airplanes fly through the air?' }),
    });
    console.log('HTTP Classify status:', res.status);
    const json = await res.json();
    console.log('HTTP Classify payload:', JSON.stringify(json));
  } catch (e: any) {
    console.error('Fetch error:', e.message);
  }
}

main();
