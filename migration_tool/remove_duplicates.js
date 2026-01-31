
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://uelrewmkmderacsqqkpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LOi6vuzP3h-T14-43ujocQ_gjJpsToT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function removeDuplicates(table, uniqueField) {
    console.log(`Checking for duplicates in ${table} based on ${uniqueField}...`);
    
    // 1. Fetch all records (selecting id and the unique field)
    // Note: Supabase limits rows per request (default 1000). We might need pagination if data is large.
    // For now, assuming < 10000, we can fetch in chunks or just try to fetch a large number.
    
    let allData = [];
    let from = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from(table)
            .select(`id, ${uniqueField}, updated_at`)
            .order('updated_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) {
            console.error(`Error fetching ${table}:`, error);
            return;
        }
        
        allData = allData.concat(data);
        if (data.length < limit) break;
        from += limit;
    }

    console.log(`Total records in ${table}: ${allData.length}`);

    const seen = new Set();
    const idsToDelete = [];

    for (const row of allData) {
        const value = row[uniqueField];
        if (!value) continue; // Skip empty fields

        if (seen.has(value)) {
            // Duplicate found
            idsToDelete.push(row.id);
        } else {
            seen.add(value);
        }
    }

    console.log(`Found ${idsToDelete.length} duplicates to delete.`);

    if (idsToDelete.length > 0) {
        // Delete in batches of 100 to avoid too long URLs or payload limits
        const batchSize = 100;
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const batch = idsToDelete.slice(i, i + batchSize);
            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .in('id', batch);
            
            if (deleteError) {
                console.error('Error deleting batch:', deleteError);
            } else {
                console.log(`Deleted batch ${i/batchSize + 1}`);
            }
        }
        console.log('Duplicate removal complete.');
    } else {
        console.log('No duplicates found.');
    }
}

async function main() {
    await removeDuplicates('phones', 'extension');
    await removeDuplicates('dispatch_phones', 'extension');
}

main();
