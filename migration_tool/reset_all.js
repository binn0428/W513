
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

async function deleteTableData(tableName) {
    console.log(`[DELETE] Starting full delete for table: ${tableName}...`);
    
    let allIds = [];
    let from = 0;
    const limit = 1000;
    
    // Fetch IDs
    while (true) {
        const { data, error } = await supabase
            .from(tableName)
            .select('id')
            .range(from, from + limit - 1);
            
        if (error) {
            console.error(`[ERROR] Fetching IDs for ${tableName} failed:`, error);
            return false;
        }
        if (!data || data.length === 0) break;
        
        allIds = allIds.concat(data.map(d => d.id));
        if (data.length < limit) break;
        from += limit;
    }
    
    console.log(`[DELETE] Found ${allIds.length} records to delete in ${tableName}.`);
    
    // Delete in batches
    if (allIds.length > 0) {
        const DELETE_BATCH = 100;
        for (let i = 0; i < allIds.length; i += DELETE_BATCH) {
            const batchIds = allIds.slice(i, i + DELETE_BATCH);
            const { error } = await supabase
                .from(tableName)
                .delete()
                .in('id', batchIds);
            
            if (error) {
                console.error(`[ERROR] Deleting batch ${i} in ${tableName}:`, error.message);
                return false;
            } else {
                if (i % 1000 === 0) process.stdout.write('.');
            }
        }
        console.log(`\n[DELETE] Successfully cleared ${tableName}.`);
    } else {
        console.log(`[DELETE] Table ${tableName} is already empty.`);
    }
    return true;
}

async function processTable(tableName, excelFile, mapFunction) {
    console.log(`\n=== Processing ${tableName} from ${excelFile} ===`);
    
    // 1. Read Excel
    const filePath = path.join(PROJECT_ROOT, 'tel', excelFile);
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] File not found: ${filePath}`);
        return;
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`[READ] Read ${data.length} rows from Excel.`);

    // 2. Map Data
    let records = data.map(mapFunction);
    
    // 3. Filter Empty Extensions
    records = records.filter(r => r.extension && r.extension !== '');
    console.log(`[FILTER] Count after filtering empty extensions: ${records.length}`);

    // 4. Deduplicate (Keep last occurrence)
    const uniqueRecords = new Map();
    records.forEach(r => {
        uniqueRecords.set(r.extension, r);
    });
    const finalRecords = Array.from(uniqueRecords.values());
    console.log(`[DEDUPLICATE] Final unique records count: ${finalRecords.length} (Removed ${records.length - finalRecords.length} duplicates)`);

    // 5. Delete Old Data
    const deleteSuccess = await deleteTableData(tableName);
    if (!deleteSuccess) {
        console.error(`[ERROR] Aborting upload for ${tableName} due to delete failure.`);
        return;
    }

    // 6. Upload New Data
    console.log(`[UPLOAD] Uploading to ${tableName}...`);
    const BATCH_SIZE = 100;
    let successCount = 0;
    
    for (let i = 0; i < finalRecords.length; i += BATCH_SIZE) {
        const batch = finalRecords.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from(tableName).insert(batch);
        
        if (error) {
            console.error(`[ERROR] Uploading batch ${i}:`, error.message);
        } else {
            successCount += batch.length;
            if (i % 1000 === 0) process.stdout.write('.');
        }
    }
    console.log(`\n[DONE] Successfully uploaded ${successCount} records to ${tableName}.`);
}

async function main() {
    // 1. Phones
    await processTable('phones', '電話資料.xlsx', row => ({
        extension: String(row['號碼'] || row['分機號碼'] || '').trim(),
        unit: String(row['單位'] || row['使用單位'] || '').trim(),
        line_group_id: String(row['線組編號'] || '').trim(),
        g450_port: String(row['遠端機櫃UG-50編號'] || '').trim(),
        remote_mc_id: String(row['遠端機櫃 MC-ID (第幾對線)'] || '').trim(),
        type: String(row['數位'] || '').trim(),
        sub_count: String(row['副機數量'] || '').trim(),
        did_number: String(row['DID'] || '').trim(),
        location: String(row['裝機位置'] || '').trim(),
        lens: String(row['LENS'] || '').trim(),
        mdf_port: String(row['機房端子編號'] || '').trim(),
        call_class: String(row['通話等級'] || '').trim(),
        note: String(row['備註'] || '').trim()
    }));

    // 2. Dispatch Phones
    await processTable('dispatch_phones', '調度資料.xlsx', row => ({
        extension: String(row['分機號碼'] || '').trim(),
        c_terminal: String(row['C端子位置'] || '').trim(),
        lens: String(row['LENS'] || '').trim(),
        line_group_room: String(row['線組編號(機房)'] || '').trim(),
        line_group_site: String(row['線組編號(現場)'] || '').trim(),
        unit: String(row['使用單位'] || '').trim(),
        location: String(row['裝機位置'] || '').trim(),
        sub_count: String(row['副機數量'] || '').trim(),
        contact_tel: String(row['連絡電話'] || '').trim()
    }));
}

main();
