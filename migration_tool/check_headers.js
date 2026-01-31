const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function checkFile(filename) {
    const filePath = path.join(PROJECT_ROOT, 'tel', filename);
    console.log(`Checking ${filename}...`);
    if (fs.existsSync(filePath)) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        if (data.length > 0) {
            console.log('Headers:', data[0]);
        } else {
            console.log('File is empty');
        }
    } else {
        console.log('File not found');
    }
}

checkFile('電話資料.xlsx');
checkFile('調度資料.xlsx');
