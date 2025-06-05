import sqlite3
import os
from datetime import datetime

class Database:
    def __init__(self):
        self.db_path = 'tel_data.db'
        self.init_database()

    def init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 創建電話資料表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tel_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tel_number TEXT,
            department TEXT,
            line_group TEXT,
            g450_port TEXT,
            tel_type TEXT,
            sub_phone_count TEXT,
            did_number TEXT,
            location TEXT,
            move_record TEXT,
            notes TEXT,
            last_updated TIMESTAMP
        )
        ''')

        # 創建調度資料表
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS dispatch_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tel_number TEXT,
            c_terminal TEXT,
            lens TEXT,
            line_group_room TEXT,
            line_group_site TEXT,
            department TEXT,
            location TEXT,
            sub_phone_count TEXT,
            contact_phone TEXT,
            last_updated TIMESTAMP
        )
        ''')

        conn.commit()
        conn.close()

    def import_excel_data(self, file_path, table_name):
        """從Excel文件導入數據到資料庫"""
        import pandas as pd
        
        try:
            df = pd.read_excel(file_path)
            conn = sqlite3.connect(self.db_path)
            
            # 清空現有數據
            cursor = conn.cursor()
            cursor.execute(f'DELETE FROM {table_name}')
            
            # 添加時間戳
            df['last_updated'] = datetime.now()
            
            # 將數據寫入資料庫
            df.to_sql(table_name, conn, if_exists='append', index=False)
            
            conn.commit()
            conn.close()
            return True, "數據導入成功"
        except Exception as e:
            return False, f"數據導入失敗: {str(e)}"

    def export_to_excel(self, table_name, output_path):
        """將資料庫數據導出到Excel文件"""
        import pandas as pd
        
        try:
            conn = sqlite3.connect(self.db_path)
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
            df.to_excel(output_path, index=False)
            conn.close()
            return True, "數據導出成功"
        except Exception as e:
            return False, f"數據導出失敗: {str(e)}"

    def search_data(self, table_name, search_term):
        """搜尋資料"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 獲取表的所有列
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 構建搜尋查詢
        search_conditions = []
        params = []
        for column in columns:
            if column != 'id' and column != 'last_updated':
                search_conditions.append(f"{column} LIKE ?")
                params.append(f"%{search_term}%")
        
        query = f"SELECT * FROM {table_name} WHERE {' OR '.join(search_conditions)}"
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # 將結果轉換為字典列表
        column_names = [description[0] for description in cursor.description]
        results_dict = [dict(zip(column_names, row)) for row in results]
        
        conn.close()
        return results_dict

    def update_data(self, table_name, record_id, field, value):
        """更新資料"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 更新指定欄位
            cursor.execute(f'''
                UPDATE {table_name}
                SET {field} = ?, last_updated = ?
                WHERE id = ?
            ''', (value, datetime.now(), record_id))
            
            conn.commit()
            conn.close()
            return True, "更新成功"
        except Exception as e:
            return False, f"更新失敗: {str(e)}"

    def get_all_data(self, table_name):
        """獲取所有資料"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT * FROM {table_name}")
        results = cursor.fetchall()
        
        # 將結果轉換為字典列表
        column_names = [description[0] for description in cursor.description]
        results_dict = [dict(zip(column_names, row)) for row in results]
        
        conn.close()
        return results_dict 