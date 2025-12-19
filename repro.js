
// ESM script
async function check() {
    try {
        const res = await fetch('http://localhost:3001/api/kpi?limit=10000&excludeGranularity=raw');
        const json = await res.json();
        if (!json.ok) {
            console.log('Error response:', json);
            return;
        }
        const items = json.items || [];
        console.log(`Fetched ${items.length} items`);
        const dates = new Set(items.map(i => i.date));
        console.log('Unique dates:', Array.from(dates).sort());

        // Check granularity of first few
        if (items.length > 0) {
            console.log('Sample item:', items[0]);
        }
    } catch (e) {
        console.error(e);
    }
}

check();
