
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key (Ensure .env.local is loaded)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listChannels() {
    console.log("Fetching channels...");
    const { data, error } = await supabase
        .from('channels')
        .select('id, name, slug, community_id');

    if (error) {
        console.error("Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Channels found:", data.length);
        console.table(data);
    }
}

listChannels();
