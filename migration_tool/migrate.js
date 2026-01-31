const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ==========================================
// CONFIGURATION - PLEASE UPDATE THESE VALUES
// ==========================================
// Note: If you have already updated these, please keep your values. 
// If you see placeholders, replace them with your actual URL and Key.
const SUPABASE_URL = 'https://uelrewmkmderacsqqkpk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LOi6vuzP3h-T14-43ujocQ_gjJpsToT';
// ==========================================

if (SUPABASE_URL.includes('YOUR_SUPABASE') || SUPABASE_KEY.includes('YOUR_SUPABASE')) {
    console.error('CRITICAL ERROR: Please update SUPABASE_URL and SUPABASE_KEY in migrate.js with your actual Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false
    }
});

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function migratePhones() {
    console.log('-----------------------------------');
    console.log('Migrating Phone Data (phones)...');
    const filePath = path.join(PROJECT_ROOT, 'tel', '電話資料.xlsx');
    
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] File not found: ${filePath}`);
        return;
    }

    try {
        // Clear existing data first to avoid duplicates
        const { error: deleteError } = await supabase.from('phones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
            console.warn('[WARN] Could not clear phones table:', deleteError.message);
        } else {
            console.log('[INFO] Cleared existing phone data.');
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Read ${data.length} rows from Excel.`);

        if (data.length === 0) {
            console.warn('[WARN] No data found in Excel file.');
            return;
        }

        // Map columns based on NEW headers:
        // ['號碼', '數位', 'LENS', '機房端子編號', '遠端機櫃UG-50編號', '線組編號', '單位', '裝機位置', '通話等級', '副機數量', 'DID', '備註']
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

        // Filter out records with empty extension
        const originalCount = records.length;
        records = records.filter(r => r.extension !== '');
        console.log(`[INFO] Filtered out ${originalCount - records.length} records with empty extension.`);

        // Batch insert
        const BATCH_SIZE = 100;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('phones').insert(batch);
            if (error) {
                console.error(`[ERROR] inserting batch ${i/BATCH_SIZE + 1} to Supabase:`, error.message);
            } else {
                console.log(`[SUCCESS] Inserted batch ${i/BATCH_SIZE + 1} (${batch.length} records).`);
            }
        }
        console.log(`[DONE] Finished processing ${records.length} phone records.`);
    } catch (err) {
        console.error('[EXCEPTION] in migratePhones:', err);
    }
}

async function migrateDispatch() {
    console.log('-----------------------------------');
    console.log('Migrating Dispatch Data (dispatch_phones)...');
    const filePath = path.join(PROJECT_ROOT, 'tel', '調度資料.xlsx');
    
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] File not found: ${filePath}`);
        return;
    }

    try {
        // Clear existing data
        const { error: deleteError } = await supabase.from('dispatch_phones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
             console.warn('[WARN] Could not clear dispatch_phones table:', deleteError.message);
        } else {
             console.log('[INFO] Cleared existing dispatch data.');
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Read ${data.length} rows from Excel.`);

        if (data.length === 0) {
            console.warn('[WARN] No data found in Excel file.');
            return;
        }

        let records = data.map(row => ({
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

        // Filter out records with empty extension
        const originalCount = records.length;
        records = records.filter(r => r.extension !== '');
        console.log(`[INFO] Filtered out ${originalCount - records.length} dispatch records with empty extension.`);

        const BATCH_SIZE = 100;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('dispatch_phones').insert(batch);
            if (error) {
                console.error(`[ERROR] inserting dispatch batch ${i/BATCH_SIZE + 1}:`, error.message);
            } else {
                console.log(`[SUCCESS] Inserted dispatch batch ${i/BATCH_SIZE + 1} (${batch.length} records).`);
            }
        }
        console.log(`[DONE] Finished processing ${records.length} dispatch records.`);
    } catch (err) {
        console.error('[EXCEPTION] in migrateDispatch:', err);
    }
}

async function migrateImages() {
    console.log('-----------------------------------');
    console.log('Migrating Images...');
    const groups = ['group_1', 'group_2', 'group_3', 'group_4'];
    let successCount = 0;
    let failCount = 0;
    
    for (const group of groups) {
        const groupPath = path.join(PROJECT_ROOT, group);
        if (!fs.existsSync(groupPath)) {
            console.log(`[INFO] Group folder not found: ${group}`);
            continue;
        }

        const files = glob.sync('**/*.{jpg,JPG,png,PNG}', { cwd: groupPath });
        console.log(`Found ${files.length} images in ${group}`);
        
        for (const file of files) {
            const filePath = path.join(groupPath, file);
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(file);
            const groupId = parseInt(group.replace('group_', ''));

            // Check if exists in DB to avoid duplicates
            const { data: existing } = await supabase
                .from('images')
                .select('*') // Get all fields including file_path
                .eq('filename', fileName)
                .eq('group_id', groupId)
                .maybeSingle();

            let storagePath;

            if (existing) {
                console.log(`[INFO] Overwriting existing image: ${fileName}`);
                storagePath = existing.file_path;
            } else {
                // Generate Safe Storage Path (ASCII only) to avoid "Invalid key" errors
                // Ensure extension is clean
                const ext = path.extname(file).replace(/[^a-zA-Z0-9.]/g, '');
                const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}${ext}`;
                storagePath = `${group}/${safeName}`;
            }

            // Upload to Storage (Upsert=true handles overwrite)
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/jpeg', 
                    upsert: true
                });

            if (uploadError) {
                console.error(`[ERROR] Failed to upload ${file}:`, uploadError.message);
                failCount++;
                continue;
            }

            // Insert Metadata (if new) or Update (if existing)
            // But since we are reusing the path for existing, we just need to insert if NOT existing.
            // If existing, metadata (filename, group_id) is same.
            // However, to be safe, we can upsert the DB record too if we want to update uploaded_by etc.
            // But 'uploaded_by' is not available here (migration tool).
            
            if (!existing) {
                const { error: dbError } = await supabase.from('images').insert({
                    file_path: storagePath,
                    filename: fileName, // Keep original filename for display/search
                    group_id: groupId
                });

                if (dbError) {
                    console.error(`[ERROR] Failed to insert DB record for ${file}:`, dbError.message);
                    failCount++;
                } else {
                    // console.log(`[SUCCESS] Uploaded ${file}`); 
                    successCount++;
                }
            } else {
                 successCount++;
            }
        }
    }
    console.log(`Images Migration: ${successCount} succeeded, ${failCount} failed.`);
}

async function main() {
    console.log('Starting Migration Process...');
    console.log('Please ensure you have run "supabase_fix.sql" in Supabase SQL Editor first!');
    
    await migratePhones();
    await migrateDispatch();
    await migrateImages();
    
    console.log('-----------------------------------');
    console.log('Migration Complete.');
}

main();
