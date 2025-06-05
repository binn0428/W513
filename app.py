from flask import Flask, request, jsonify, send_file
from database import Database
import os
from datetime import datetime

app = Flask(__name__)
db = Database()

@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    table_name = data.get('table')
    search_term = data.get('term')
    
    if not table_name or not search_term:
        return jsonify({'error': '缺少必要參數'}), 400
        
    results = db.search_data(table_name, search_term)
    return jsonify({'results': results})

@app.route('/api/update', methods=['POST'])
def update():
    data = request.json
    table_name = data.get('table')
    record_id = data.get('id')
    field = data.get('field')
    value = data.get('value')
    
    if not all([table_name, record_id, field, value]):
        return jsonify({'error': '缺少必要參數'}), 400
        
    success, message = db.update_data(table_name, record_id, field, value)
    return jsonify({'success': success, 'message': message})

@app.route('/api/export', methods=['GET'])
def export():
    table_name = request.args.get('table')
    if not table_name:
        return jsonify({'error': '缺少必要參數'}), 400
        
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_path = f'backup_{table_name}_{timestamp}.xlsx'
    
    success, message = db.export_to_excel(table_name, output_path)
    if success:
        return send_file(output_path, as_attachment=True)
    else:
        return jsonify({'error': message}), 500

@app.route('/api/import', methods=['POST'])
def import_data():
    if 'file' not in request.files:
        return jsonify({'error': '沒有上傳文件'}), 400
        
    file = request.files['file']
    table_name = request.form.get('table')
    
    if not table_name:
        return jsonify({'error': '缺少必要參數'}), 400
        
    # 保存上傳的文件
    file_path = f'temp_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    file.save(file_path)
    
    # 導入數據
    success, message = db.import_excel_data(file_path, table_name)
    
    # 刪除臨時文件
    os.remove(file_path)
    
    return jsonify({'success': success, 'message': message})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 