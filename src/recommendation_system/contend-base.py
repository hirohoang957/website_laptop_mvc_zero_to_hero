import mysql.connector
from mysql.connector import Error
import pandas as pd
from flask import Flask, jsonify, request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

def create_connect():
    config = {
        "host": "127.0.0.1",
        "user": "root",
        "password": "12345",
        "database": "websitelaptop"
    }
    try:
        connect = mysql.connector.connect(**config)
        print(f"Connect to Mysql success.")
        return connect
    except Error as err:
        print(f"Error when connect Mysql: {err}")
        return None

def close_connect(connect):
    if connect:
        connect.close()
        print("Connection is closed.")

def get_products(connect):
    try:
        query = "SELECT * FROM products WHERE quantity > 0 AND status = 1"
        df_products = pd.read_sql(query, connect)
        print("Get products data success.")
        return(df_products)
    except Error as err:
        print(f"Error when get products: {err}")
        return pd.DataFrame()

def combine_features(row):
    features = ["name"  ]
    return " ".join(
        [str(row[feature]).lower() for feature in features if feature in row and pd.notnull(row[feature])]
    )
    

@app.route('/api/product-recommendation', methods=['GET'])
def get_product_recommendation():
    connect = create_connect()
    if connect:
        df_products = get_products(connect)
        # df_products = df_products[["id", "name", "shortDesc", "priceCurr"]]
        df_products["combineFeatures"] = df_products.apply(combine_features, axis=1)
        tfidf = TfidfVectorizer()
        tfidf_matrix = tfidf.fit_transform(df_products["combineFeatures"])
        cosine_sim = cosine_similarity(tfidf_matrix)
        cosine_sim_dense = pd.DataFrame(cosine_sim, index=df_products['id'], columns=df_products['id'])

        id = request.args.get('id')
        if not id or not id.isdigit():
            return jsonify({"Error":"Invalid or missing id parameter"}), 400
        id = int(id)
        top_k = 5
        result = cosine_sim_dense.loc[id].sort_values(ascending=False)
        result = result.to_frame('score').reset_index()
        result = result[result['id'] != id]
        result = result[:top_k]
        print(result)
        result = result['id'].to_list()

        close_connect(connect)
        return jsonify({"products":result})
    return jsonify({"Error":"Unable connect to database"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)