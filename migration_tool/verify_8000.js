const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uelrewmkmderacsqqkpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LOi6vuzP3h-T14-43ujocQ_gjJpsToT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function check() {
    console.log('Checking for extension 8000...');
    try {
        const { data, error } = await supabase
            .from('phones')
            .select('*')
            .eq('extension', '8000');
            
        if (error) {
            console.error('Error:', error);
        } else {
            console.log(`Found ${data.length} records for extension 8000:`);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

check().then(() => console.log('Done.'));
