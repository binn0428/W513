
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tel', '電話資料.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

console.log('Headers:', data[0]);

// Search for 8000 in the data
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
const found = rows.filter(r => {
    // Check all values in the row for '8000'
    return Object.values(r).some(val => String(val).includes('8000'));
});

console.log(`Found ${found.length} rows with '8000':`);
if (found.length > 0) {
    console.log(JSON.stringify(found[0], null, 2));
}
