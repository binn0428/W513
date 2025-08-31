#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import http.server
import socketserver
import json
import urllib.parse
import os
import pandas as pd
from io import BytesIO
import openpyxl
from openpyxl import load_workbook

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/update-tel-data':
            self.handle_update_tel_data()
        elif self.path == '/update-dispatch-data':
            self.handle_update_dispatch_data()
        else:
            self.send_error(404, "Not Found")
    
    def handle_update_tel_data(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # 讀取現有的Excel檔案
            excel_path = './tel/電話資料.xlsx'
            if os.path.exists(excel_path):
                df = pd.read_excel(excel_path)
                
                # 更新指定索引的資料
                index = data['index']
                updated_data = data['data']
                
                if 0 <= index < len(df):
                    for field, value in updated_data.items():
                        if field in df.columns:
                            df.at[index, field] = value
                    
                    # 保存更新後的Excel檔案
                    df.to_excel(excel_path, index=False)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    response = {'status': 'success', 'message': '電話資料已成功更新'}
                    self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_error(400, "Invalid index")
            else:
                self.send_error(404, "Excel file not found")
                
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def handle_update_dispatch_data(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # 讀取現有的Excel檔案
            excel_path = './tel/調度資料.xlsx'
            if os.path.exists(excel_path):
                df = pd.read_excel(excel_path)
                
                # 更新指定索引的資料
                index = data['index']
                updated_data = data['data']
                
                if 0 <= index < len(df):
                    for field, value in updated_data.items():
                        if field in df.columns:
                            df.at[index, field] = value
                    
                    # 保存更新後的Excel檔案
                    df.to_excel(excel_path, index=False)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    response = {'status': 'success', 'message': '調度資料已成功更新'}
                    self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_error(400, "Invalid index")
            else:
                self.send_error(404, "Excel file not found")
                
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        httpd.serve_forever()