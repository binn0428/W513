
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://uelrewmkmderacsqqkpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LOi6vuzP3h-T14-43ujocQ_gjJpsToT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function resetAndUploadPhones() {
    console.log('-----------------------------------');
    console.log('Starting Full Reset of Phone Data...');
    
    // 1. DELETE ALL DATA
    console.log('Step 1: Deleting ALL existing records from "phones" table...');
    
    // Fetch IDs first to avoid timeout or broad filter issues
    let allIds = [];
    let from = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('phones')
            .select('id')
            .range(from, from + limit - 1);
            
        if (error) {
            console.error('[ERROR] Fetching IDs failed:', error);
            break;
        }
        if (!data || data.length === 0) break;
        
        allIds = allIds.concat(data.map(d => d.id));
        if (data.length < limit) break;
        from += limit;
    }
    
    console.log(`Found ${allIds.length} records to delete.`);
    
    // Delete in batches
    if (allIds.length > 0) {
        const DELETE_BATCH = 100;
        for (let i = 0; i < allIds.length; i += DELETE_BATCH) {
            const batchIds = allIds.slice(i, i + DELETE_BATCH);
            const { error } = await supabase
                .from('phones')
                .delete()
                .in('id', batchIds);
                
            if (error) {
                console.error(`[ERROR] Deleting batch ${i}:`, error.message);
            } else {
                process.stdout.write('x');
            }
        }
        console.log('\n[SUCCESS] Deletion routine finished.');
    } else {
        console.log('[INFO] Table is already empty.');
    }

    // Verify it's empty
    const { count: finalCount } = await supabase
        .from('phones')
        .select('*', { count: 'exact', head: true });
        
    console.log(`[VERIFY] Current record count in DB: ${finalCount}`);
    
    if (finalCount > 0) {
        console.warn('[WARNING] Table is not empty! Please run "fix_permissions.sql" in Supabase to allow DELETE operations.');
        return;
    }

    // 2. READ EXCEL
    console.log('Step 2: Reading Excel file...');
    const filePath = path.join(PROJECT_ROOT, 'tel', '電話資料.xlsx');
    
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] File not found: ${filePath}`);
        return;
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Read ${data.length} rows from Excel.`);

    // 3. MAP DATA
    console.log('Step 3: Mapping data columns...');
    let records = data.map(row => ({
        extension: String(row['號碼'] || row['分機號碼'] || '').trim(),
        unit: String(row['單位'] || row['使用單位'] || '').trim(),
        line_group_id: String(row['線組編號'] || '').trim(),
        g450_port: String(row['遠端機櫃UG-50編號'] || '').trim(),
        type: String(row['數位'] || '').trim(),
        sub_count: String(row['副機數量'] || '').trim(),
        did_number: String(row['DID'] || '').trim(),
        location: String(row['裝機位置'] || '').trim(),
        lens: String(row['LENS'] || '').trim(),
        mdf_port: String(row['機房端子編號'] || '').trim(),
        call_class: String(row['通話等級'] || '').trim(),
        note: String(row['備註'] || '').trim()
    }));

    // Filter empty extensions
    const originalCount = records.length;
    records = records.filter(r => r.extension !== '');
    console.log(`[INFO] Filtered out ${originalCount - records.length} records with empty extension. Final count: ${records.length}`);

    // 4. UPLOAD
    console.log('Step 4: Uploading to Supabase...');
    const BATCH_SIZE = 100;
    let successCount = 0;
    
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('phones').insert(batch);
        
        if (error) {
            console.error(`[ERROR] Inserting batch ${i/BATCH_SIZE + 1}:`, error.message);
        } else {
            successCount += batch.length;
            process.stdout.write('.'); // Progress indicator
        }
    }
    
    console.log('\n-----------------------------------');
    console.log(`[DONE] Successfully uploaded ${successCount} records.`);
}

resetAndUploadPhones();
