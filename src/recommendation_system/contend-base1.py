import mysql.connector
from mysql.connector import Error
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import hstack, csr_matrix

app = Flask(__name__)

def create_connect():
    config = {
        "host": "127.0.0.1",
        "user": "root",
        "password": "12345",
        "database": "websitelaptop"
    }
    try:
        return mysql.connector.connect(**config)
    except Error as err:
        print(f"Error when connect Mysql: {err}")
        return None

def close_connect(connect):
    if connect and connect.is_connected():
        connect.close()

@app.route('/api/product-recommendation', methods=['GET'])
def get_product_recommendation():
    product_id = request.args.get('id')
    if not product_id or not product_id.isdigit():
        return jsonify({"Error": "Invalid or missing id parameter"}), 400
    product_id = int(product_id)

    connect = create_connect()
    if not connect:
        return jsonify({"Error": "Unable connect to database"}), 500

    try:
        query = """
            SELECT id, name, shortDesc, cpuType, ram, gpuType, 
                   screenSize, resolution, weight, priceCurr, categoryId 
            FROM products 
            WHERE quantity > 0 AND status = 1
        """
        df = pd.read_sql(query, connect)

        if df.empty or product_id not in df['id'].values:
            return jsonify({"products": []})

        target = df[df['id'] == product_id].iloc[0]

        # 1. Lọc ứng viên cùng danh mục nhu cầu (categoryId)
        df_cand = df[df['categoryId'] == target['categoryId']].copy()
        if len(df_cand) < 6:
            df_cand = df.copy()
        df_cand = df_cand.reset_index(drop=True)

        target_idx = df_cand.index[df_cand['id'] == product_id][0]
        target_price = float(target['priceCurr'])

        # 2. TÍNH ĐIỂM GIÁ (CHIẾM 50% TỔNG ĐIỂM)
        # Công thức: 1 - |Giá_A - Giá_B| / max(Giá_A, Giá_B) -> Giá bằng nhau = 1.0, lệch càng nhiều càng giảm
        prices = df_cand['priceCurr'].astype(float).values
        max_prices = np.maximum(prices, target_price)
        price_sim = 1.0 - (np.abs(prices - target_price) / np.where(max_prices == 0, 1, max_prices))

        # 3. TÍNH ĐIỂM CẤU HÌNH & MÔ TẢ (CHIẾM 50% TỔNG ĐIỂM)
        # 3a. Văn bản (Tên + Mô tả ngắn + Độ phân giải)
        text_data = (
            df_cand['name'].fillna('') + ' ' + 
            df_cand['shortDesc'].fillna('') + ' ' + 
            df_cand['resolution'].fillna('')
        )
        tfidf_mat = TfidfVectorizer(max_features=300).fit_transform(text_data) * 0.40

        # 3b. Thông số số (RAM, Kích thước màn hình, Cân nặng)
        num_df = pd.DataFrame({
            'ram': df_cand['ram'].astype(float),
            'screenSize': df_cand['screenSize'].astype(float),
            'weight': df_cand['weight'].astype(float)
        })
        num_mat = csr_matrix(MinMaxScaler().fit_transform(num_df) * 0.30)

        # 3c. Phần cứng phân loại (Loại GPU, Dòng CPU)
        cat_mat = OneHotEncoder(handle_unknown='ignore').fit_transform(
            df_cand[['gpuType', 'cpuType']].fillna('Unknown')
        ) * 0.30

        spec_combined = hstack([tfidf_mat, num_mat, cat_mat])
        spec_sim = cosine_similarity(spec_combined)[target_idx]

        # 4. TỔNG HỢP ĐIỂM: 50% GIÁ + 50% CẤU HÌNH
        final_scores = 0.50 * price_sim + 0.50 * spec_sim

        # Sắp xếp giảm dần, loại bỏ chính sản phẩm đang xem và lấy top 5
        df_cand['score'] = final_scores
        result_df = df_cand[df_cand['id'] != product_id].sort_values(by='score', ascending=False).head(5)
        print(result_df)

        result_ids = result_df['id'].tolist()
        return jsonify({"products": result_ids})
    finally:
        close_connect(connect)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)