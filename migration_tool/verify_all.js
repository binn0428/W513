
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uelrewmkmderacsqqkpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LOi6vuzP3h-T14-43ujocQ_gjJpsToT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    const tables = ['phones', 'dispatch_phones'];
    
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.error(`Error checking ${table}:`, error);
        } else {
            console.log(`Table '${table}' count: ${count}`);
        }
    }
}

verify();
