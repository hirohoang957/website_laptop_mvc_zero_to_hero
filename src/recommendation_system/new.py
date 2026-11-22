import mysql.connector
from mysql.connector import Error
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request

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

def get_products(connect):
    try:
        query = "SELECT id, priceCurr FROM products WHERE quantity > 0 AND status = 1"
        return pd.read_sql(query, connect)
    except Error as err:
        print(f"Error when get products: {err}")
        return pd.DataFrame()

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
        df_products = get_products(connect)
        if df_products.empty or product_id not in df_products['id'].values:
            return jsonify({"products": []})

        target_price = df_products.loc[df_products['id'] == product_id, 'priceCurr'].values[0]

        df_others = df_products[df_products['id'] != product_id].copy()

        df_others['price_diff'] = np.abs(df_others['priceCurr'] - target_price)

        top_k = 5
        result = df_others.sort_values(by='price_diff', ascending=True).head(top_k)['id'].tolist()

        return jsonify({"products": result})
    finally:
        close_connect(connect)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)