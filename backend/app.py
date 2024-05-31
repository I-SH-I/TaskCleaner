import os
from flask import Flask, request
from flask_restful import Api, Resource
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import generate_password_hash, check_password_hash

# Flaskインスタンス作成。__name__は、このモジュール名の参照
app = Flask(__name__)
# フロントエンドからのリクエストを受け取るため、クロスオリジンリソース共有を設定
CORS(app)
# APIオブジェクトを作成
api = Api(app)
# データベース設定
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
db = SQLAlchemy(app)
auth = HTTPBasicAuth()

# 環境変数からユーザーとパスワードを取得
basic_auth_username = os.environ.get('BASIC_AUTH_ID')
basic_auth_password = os.environ.get('BASIC_AUTH_PASS')

if not basic_auth_username or not basic_auth_password:
    raise ValueError("BASIC_AUTH_ID and BASIC_AUTH_PASS must be set in the environment variables")

users = {
    basic_auth_username: generate_password_hash(basic_auth_password)
}

@auth.verify_password
def verify_password(username, password):
    if username in users and check_password_hash(users.get(username), password):
        return username

# データベースモデルを定義
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200), nullable=False)

# アプリケーションコンテクスト内で、定義されたデータベース列を作成
with app.app_context():
    db.create_all()

# タスクをデータベースに追加するためのメソッドを持つ
class TaskResource(Resource):
    @auth.login_required
    def get(self):
        tasks = Task.query.all()
        return [{'id': task.id, 'title': task.title, 'description': task.description} for task in tasks], 200

    @auth.login_required
    def post(self):
        data = request.get_json()  # クライアントから送信されたJSONデータを取得
        new_task = Task(title=data['title'], description=data['description'])  # 新しいタスクを作成
        db.session.add(new_task)  # 新しいタスクをデータベースセッションに追加
        db.session.commit()  # データベースにコミット
        return {'id': new_task.id, 'title': new_task.title, 'description': new_task.description}, 201  # 新しく作成されたタスクを返す

    @auth.login_required
    def put(self):
        data = request.get_json()
        task = Task.query.get(data['id'])
        if task is None:
            return {'message': 'Task not found'}, 404
        task.title = data['title']
        task.description = data['description']
        db.session.commit()
        return {'id': task.id, 'title': task.title, 'description': task.description}, 200

    @auth.login_required
    def delete(self):
        data = request.get_json()
        task = Task.query.get(data['id'])
        if task is None:
            return {'message': 'Task not found'}, 404
        db.session.delete(task)
        db.session.commit()
        return {'message': 'Task deleted'}, 200

# リソースクラスをエンドポイントにマッピングする。このエンドポイントに対するHTTPリクエストがTaskResourceクラスのメソッドで処理される
api.add_resource(TaskResource, '/tasks')

# Flaskアプリケーション実行
if __name__ == '__main__':
    app.run(debug=True)
