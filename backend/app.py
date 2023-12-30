from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
from bson import ObjectId
from litellm import completion
from time import sleep
from sklearn.neighbors import NearestNeighbors
import tensorflow_hub as hubå
import numpy as np
import tensorflow as tf

import os
# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
config_file_path = os.path.join(script_dir, "pybliometrics.cfg")
os.environ['PYB_CONFIG_FILE'] = config_file_path

from pybliometrics.scopus import ScopusSearch, AbstractRetrieval
from pybliometrics.scopus.utils import config

import jwt
import bcrypt
import re
import urllib.request
import pandas as pd
import math
import shutil
import joblib
import urllib
import openai
import fitz

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load environment variables from .env file
load_dotenv()
app.config['SECRET_KEY'] = os.environ.get("BACKEND_TOKEN_SECRET_KEY", "")  # Replace with a strong, random secret key

#Admin info
app.config['UPLOAD_FOLDER'] = 'public/reference/'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB limit

# MongoDB configuration
mongo_username = os.environ.get("MONGO_USERNAME", 'root')
mongo_password = os.environ.get("MONGO_PASSWORD", 'example')
mongo_host = os.environ.get("MONGO_HOST", 'mongo')
mongo_port = os.environ.get("MONGO_PORT", 27017)
mongo_dbname = os.environ.get("MONGO_DBNAME", 'mydatabase')

# Construct the MongoDB connection URI with authentication
mongo_uri = f'mongodb://{mongo_username}:{mongo_password}@{mongo_host}:{mongo_port}'
mongo = MongoClient(mongo_uri)[mongo_dbname]
users_collection = mongo['tr_user']
projects_collection = mongo['tr_project']
members_collection = mongo['tr_member']
objective_collection = mongo['tr_objective']
question_collection = mongo['tr_question']
keyword_collection = mongo['tr_keyword']
sub_question_collection = mongo['tr_sub_question']
sub_response_collection = mongo['tr_sub_response']
qlty_question_collection = mongo['tr_qlty_question']
qlty_response_collection = mongo['tr_qlty_response']
main_message_collection = mongo['tr_main_message']
references_collection = mongo['tr_reference']
reference_chat_collection = mongo['tr_reference_chat']

#Open AI config
openai.api_key = os.environ.get("OPENAI_API_KEY", "")
hours_threshold = 12

#Load language model
model_embedding = tf.saved_model.load("model/")

# Your routes and other configurations go here
@app.before_request
def check_token():
    # Middleware function to check token and extract username
    if (request.endpoint not in ['login']) and ('static_reference' not in request.path):
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token.split(' ')[1]
            try:
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                username = payload['username']
                password = payload['password']
                role = payload['role']

                user = users_collection.find_one({'username': username, 'role': role, 'active': True})
                if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                    request.username = username  # Attach username to the request
                    request.role = role  # Attach username to the request
                else:
                    return jsonify({'message': 'Invalid credentials', 'error': 'token'})
            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Token has expired', 'error': 'token'})
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Invalid token', 'error': 'token'})
        else:
            return jsonify({'message': 'Missing or invalid token', 'error': 'token'})

def generate_token(user):
    payload = {
        'username': user['username'],
        'role': user['role'],
        'password': user['password'],
        'exp': datetime.utcnow() + timedelta(hours=24)  # Token expiration time
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token

@app.route('/login', methods=['POST'])
def login():
    # No token check for login
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({'username': username, 'active': True})
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        user['password'] = password
        token = generate_token(user)
        projects = get_all_projects(username)
        return jsonify({
            'token': token,
            'username': user['username'],
            'role': user['role'],
            'projects': projects
        })
    
    return jsonify({'message': 'Invalid account', 'error': 'login'})

@app.route('/add_user', methods=['POST'])
def add_user():
    if (request.role == 'admin'):
        # No token check for registration
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        # In a real application, you would hash and salt the password before storing it.
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        existing_user = users_collection.find_one({'username': username})

        if existing_user:
            return jsonify({'message': 'Username already exists', 'error': 'Duplicate username'})
        else:
            user = {
                'username': username,
                'password': hashed_password,
                'role': 'user',
                'active': True
            }
            users_collection.insert_one(user)

            # Query all users:
            users = get_all_users()
            return jsonify({'message': 'Add new user successfully', 'users': users})
    else:
        return jsonify({'message': 'Invalid credentials', 'error': 'permission'})

@app.route('/admin_change_password', methods=['POST'])
def admin_change_password():
    data = request.get_json()
    user_id = data.get('user_id')
    new_password = data.get('new_password')

    existing_user = users_collection.find_one({'_id': ObjectId(user_id)})

    if (existing_user):
        if (request.role == 'admin' or request.username == existing_user['username']):
            # In a real application, you would hash and salt the password before storing it.
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'password': hashed_password}}
            )

            # Query all users:
            users = get_all_users()
            return jsonify({'message': 'Update password successfully', 'users': users})
        else:
            return jsonify({'message': 'No permission to update', 'error': 'permission'})
    else:
        return jsonify({'message': 'User does not exist', 'error': 'user'})

@app.route('/user_change_password', methods=['POST'])
def user_change_password():
    data = request.get_json()
    username = request.username
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')

    existing_user = users_collection.find_one({'username': username, 'active': True})

    if existing_user and bcrypt.checkpw(old_password.encode('utf-8'), existing_user['password'].encode('utf-8')):
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_collection.update_one(
            {'username': username},
            {'$set': {'password': hashed_password}}
        )
        
        existing_user['password'] = new_password
        token = generate_token(existing_user)

        return jsonify({
            'token': token,
            'username': existing_user['username'],
            'role': existing_user['role'],
            'message': 'Update password successfully'
        })
    
    return jsonify({'message': 'Invalid account', 'error': 'password'})

@app.route('/change_status_user', methods=['POST'])
def change_status_user():
    data = request.get_json()
    user_id = data.get('user_id')
    new_status = data.get('new_status')

    existing_user = users_collection.find_one({'_id': ObjectId(user_id)})

    if (existing_user):
        if (request.role == 'admin' or request.username == existing_user['username']):
            # In a real application, you would hash and salt the password before storing it.
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'active': new_status}}
            )

            projects_collection.update_many(
                {'pro_owner': existing_user['username']},
                {'$set': {'pro_status': new_status}}
            )

            # Query all users:
            users = get_all_users()
            return jsonify({'message': 'Update status successfully', 'users': users})
        else:
            return jsonify({'message': 'No permission to update', 'error': 'permission'})
    else:
        return jsonify({'message': 'User does not exist', 'error': 'user'})

@app.route('/api/endpoint', methods=['GET'])
def get_data():
    user = users_collection.find_one({'username': "hi"})
    if user:
        # Replace this with your actual data retrieval logic
        data = {"message": "Founde"}
    else:
        data = {"message": "Je sais pas"}
    return jsonify(data)

@app.route('/get_users', methods=['GET'])
def get_users():
    if (request.role == 'admin'):
        users = get_all_users()
        return jsonify({'users': users})
    else:
        return jsonify({'message': 'Invalid credentials', 'error': 'permission'})

@app.route('/get_projects', methods=['GET'])
def get_projects():
    projects = get_all_projects(request.username)
    return jsonify({'projects': projects})

def get_all_users():
    # Query all users:
    users = list(users_collection.find({ 'role': { '$ne': 'admin' }}))
    users = [{
            'id': str(user['_id']),
            'username': user['username'],
            'role': user['role'],
            'password': user['password'],
            'active': user['active']
        } for user in users]
    
    return users

def get_all_projects(username):
    # Query all users:
    # Perform the aggregation pipeline
    pipeline = [
        {
            '$match': {
                'username': username,
                'status': { '$nin': ['deleted', 'quit', 'reject'] }
            }
        },
        {
            '$lookup': {
                'from': 'tr_project',
                'localField': 'pro_id',
                'foreignField': '_id',
                'as': 'project_info'
            }
        },
        {
            '$unwind': '$project_info'
        },
        {
            '$project': {
                'pro_id': { '$toString': '$pro_id' },  # Include the pro_id from members_collection
                'pro_name': '$project_info.pro_name',
                'pro_owner': '$project_info.pro_owner',
                'pro_status': '$project_info.pro_status',
                'pro_created_at': '$project_info.pro_created_at',
                'mem_added_by': '$added_by',
                'mem_updated_by': '$updated_by',
                'mem_added_by': '$added_by',
                'mem_role': '$role',
                'mem_status': '$status',
                'mem_updated_at': '$updated_at',
                'mem_id': { '$toString': '$_id' },
                '_id': 0
            }
        }
    ]

    projects = list(members_collection.aggregate(pipeline))
    return projects

@app.route('/add_project', methods=['POST'])
def add_project():
    # No token check for registration
    data = request.get_json()
    username = request.username
    pro_name = data.get('pro_name')
    pro_role = 'owner'

    project_data = {
        'pro_name': pro_name,
        'pro_owner': username,
        'pro_status': True,
        'pro_created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
    }
    project_id = projects_collection.insert_one(project_data).inserted_id

    # Step 2: Add to members_collection
    member_data = {
        'pro_id': project_id,
        'username': username,
        'status': 'active',
        'role': pro_role,
        'added_by': username,
        'updated_by': username,
        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
    }

    # Insert the member document
    members_collection.insert_one(member_data)

    # Query all users:
    projects = get_all_projects(username)
    return jsonify({'message': 'Add new project successfully', 'projects': projects})

@app.route('/get_members', methods=['GET'])
def get_members():
    pro_id = request.args.get('pro_id')
    username = request.username
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        pipeline = [
            {
                '$match': {
                    'pro_id': ObjectId(pro_id),
                    'status': { '$nin': ['deleted', 'quit', 'reject'] }
                }
            },
            {
                '$lookup': {
                    'from': 'tr_user',
                    'localField': 'username',
                    'foreignField': 'username',
                    'as': 'user'
                }
            },
            {
                '$unwind': '$user'
            },
            {
                '$match': {
                    'user.active': True
                }
            },
            {
                '$project': {
                    'mem_username': '$username',
                    'mem_added_by': '$added_by',
                    'mem_updated_by': '$updated_by',
                    'mem_role': '$role',
                    'mem_status': '$status',
                    'mem_updated_at': '$updated_at',
                    'mem_id': { '$toString': '$_id' },
                    '_id': 0
                }
            }
        ]

        members = list(members_collection.aggregate(pipeline))
        

        excluded_statuses = ['active', 'waiting']
        pipeline = [
            {
                '$match': {
                    'active': True,
                    'role': {'$ne': 'admin'}
                }
            },
            {
                '$lookup': {
                    'from': 'tr_member',
                    'localField': 'username',
                    'foreignField': 'username',
                    'as': 'member'
                }
            },
            {
                '$match': {
                    '$or': [
                        {'member': {'$eq': []}},  # No matching member found
                        {
                            'member': {
                                '$not': {
                                    '$elemMatch': {
                                        'pro_id': ObjectId(pro_id),
                                        'status': {'$in': excluded_statuses}
                                    }
                                }
                            }
                        }
                    ]
                }
            },
            {
                '$project': {
                    '_id': 0,  # Exclude _id field if not needed
                    'username': 1,  # Include other fields as needed
                }
            }
        ]

        users = list(users_collection.aggregate(pipeline))
        return jsonify({'members': members, 'users': users})
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

@app.route('/change_status_project', methods=['POST'])
def change_status_project():
    data = request.get_json()
    username = request.username
    pro_id = data.get('pro_id')
    new_status = data.get('new_status')

    existing_proj = projects_collection.find_one({'_id': ObjectId(pro_id)})

    if (existing_proj):
        if (existing_proj['pro_owner'] == username):
            # In a real application, you would hash and salt the password before storing it.
            projects_collection.update_one(
                {'_id': ObjectId(pro_id)},
                {'$set': {'pro_status': new_status}}
            )

            # Query all users:
            projects = get_all_projects(request.username)
            return jsonify({'message': 'Update project status successfully', 'projects': projects})
        else:
            return jsonify({'message': 'No permission to update', 'error': 'permission'})
    else:
        return jsonify({'message': 'Project does not exist', 'error': 'project'})

@app.route('/add_member', methods=['POST'])
def add_member():
    pro_id = request.get_json().get('pro_id')
    new_username = request.get_json().get('new_username')

    username = request.username
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_invitation = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': new_username})

    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    if (existing_member):
        if (existing_invitation):
            if (existing_invitation['status'] == 'active'):
                return jsonify({'message': 'Member exists in the project', 'error': 'project'})
            elif (existing_invitation['status'] == 'waiting'):
                return jsonify({'message': "You've sent an invitation to member", 'error': 'project'}) 
            else:
                # Insert the member document
                members_collection.update_one({
                    'username': new_username,
                    'pro_id': ObjectId(pro_id)
                }, {
                    '$set': {
                        'status': 'waiting',
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                    }
                })

                return jsonify({'message': "Resend an invitation"})
        else:
            # Step 2: Add to members_collection
            member_data = {
                'pro_id': ObjectId(pro_id),
                'username': new_username,
                'status': 'waiting',
                'role': 'researcher',
                'added_by': username,
                'updated_by': username,
                'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
            }

            # Insert the member document
            members_collection.insert_one(member_data)
            return jsonify({'message': "Sent an invitation"})
    else:
        return jsonify({'message': 'You do not have permissions to add new member', 'error': 'project'})

@app.route('/delete_member', methods=['POST'])
def delete_member():
    pro_id = request.get_json().get('pro_id')
    delete_username = request.get_json().get('username')

    username = request.username
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_invitation = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': delete_username})

    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    if (existing_member):
        if (existing_invitation):
            if (existing_invitation['status'] in ['active', 'waiting']):
                # Insert the member document
                members_collection.update_one({
                    'username': delete_username,
                    'pro_id': ObjectId(pro_id)
                }, {
                    '$set': {
                        'status': 'deleted',
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                    }
                })
                return jsonify({'message': "Delete user successfully"})
            else:
                return jsonify({'message': 'User does not exist in the project', 'error': 'project'})
        else:
            return jsonify({'message': 'User does not exist in the project', 'error': 'project'})
    else:
        return jsonify({'message': 'You do not have permissions to add new member', 'error': 'project'})

@app.route('/change_status_member', methods=['POST'])
def change_status_member():
    pro_id = request.get_json().get('pro_id')
    status = request.get_json().get('status')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username})

    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    if (existing_member):
        # Insert the member document
        members_collection.update_one({
            'username': username,
            'pro_id': ObjectId(pro_id)
        }, {
            '$set': {
                'status': status,
                'updated_by': username,
                'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
            }
        })

        return jsonify({'message': "Change status successfully"})
    else:
        return jsonify({'message': "User does not exist for this project", "error": "project"})

def convert_id2_str(obj, fields=['_id'], is_array=True):
    if is_array:
        for item in obj:
            for field in fields:
                item[field] = str(item[field])
    else:
        for field in fields:
            obj[field] = str(obj[field])

    return obj

def get_project_info_object(pro_id):
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})

    if active_project is None:
        return None  # or raise an exception or handle it as needed

    objectives = list(objective_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
    objectives = convert_id2_str(objectives, ['_id', 'pro_id'])

    questions = list(question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
    questions = convert_id2_str(questions, ['_id', 'pro_id'])

    keywords = list(keyword_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
    keywords = convert_id2_str(keywords, ['_id', 'pro_id'])

    qlty_questions = list(qlty_question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
    qlty_questions = convert_id2_str(qlty_questions, ['_id', 'pro_id'])

    sub_questions = []
    for question in questions:
        question_id = question['_id']
        results = list(sub_question_collection.find({'question_id': ObjectId(question_id), 'deleted': False}))
        results = convert_id2_str(results, ['_id', 'question_id'])
        sub_questions.extend(results)

    pro_info = {
        'topic': active_project.get('topic', ''),
        'description': active_project.get('description', ''),
        'title': active_project.get('title', ''),
        'objectives': objectives,
        'questions': questions,
        'subQuestions': sub_questions,
        'keywords': keywords,
        'qltyQuestions': qlty_questions
    }

    return pro_info

@app.route('/get_project_info', methods=['GET'])
def get_project_info():
    pro_id = request.args.get('pro_id')
    username = request.username
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        pro_info = get_project_info_object(pro_id)
        chat_messages = existing_member.get('messages', [])
        synthesis_messages = existing_member.get('synthesis_messages', [])

        return jsonify({
            'message': 'You got it', 
            'data': {
                'chatMessages': chat_messages,
                'synthesisMessages': synthesis_messages,
                'researchInfo': pro_info
            }})
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

@app.route('/change_project_info', methods=['POST'])
def change_project_info():
    pro_id = request.get_json().get('pro_id')
    field = request.get_json().get('field')
    new_value = request.get_json().get('new_value')
    change_type = request.get_json().get('change_type')
    parent_id = request.get_json().get('parent_id')
    is_info = request.get_json().get('is_info')
    username = request.username

    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        if (field in ['topic', 'description', 'title']):
            if (existing_member['role'] != 'user'):
                projects_collection.update_one({
                    '_id': ObjectId(pro_id)
                }, {
                    '$set': {
                        field: new_value
                    }
                })

                pro_info = get_project_info_object(pro_id)
                return jsonify({'message': 'Update successfully', 'success': True, 'researchInfo': pro_info})
            else:
                return jsonify({'message': 'You do not have permissions to update this field', 'error': 'project'})
            
        else:
            collection = None
            if (field == 'objective'):
                collection = objective_collection
            elif (field == 'keyword'):
                collection = keyword_collection
            elif (field == 'question'):
                collection = question_collection
            elif (field == 'subQuestion'):
                collection = sub_question_collection
            elif (field == 'qltyQuestion'):
                collection = qlty_question_collection
            else:
                return jsonify({'message': 'The updated field does not exist', 'error': 'project'})
            
            if (change_type == 'add'):
                if (field == 'subQuestion'):
                    is_question_exist = check_record_exist(question_collection, {'_id': ObjectId(parent_id), 'deleted': False})
                    if is_question_exist:
                        new_item = collection.insert_one({
                            'value': new_value,
                            'created_by': username,
                            'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                            'updated_by': username,
                            'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                            'question_id': ObjectId(parent_id),
                            'deleted': False
                        }).inserted_id

                        pro_info = get_project_info_object(pro_id)
                        return ({'message': 'Update sucessfully', '_id': str(new_item), 'success': True, 'researchInfo': pro_info})
                    else:
                        return ({'message': 'The research question does not exist', 'error': 'project'})
                else:
                    new_item = collection.insert_one({
                        'pro_id': ObjectId(pro_id),
                        'value': new_value,
                        'created_by': username, 
                        'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                        'deleted': False
                    }).inserted_id

                    pro_info = get_project_info_object(pro_id)
                    return ({'message': 'Update sucessfully', '_id': str(new_item), 'success': True, 'researchInfo': pro_info})
            else:
                edited_id = new_value['_id']
                edited_value = new_value['value']

                is_item_exist = False
                if (field == 'subQuestion'):
                    edited_parent_id = new_value['question_id']
                    is_question_exist = check_record_exist(question_collection, {'_id': ObjectId(edited_parent_id), 'deleted': False})
                    if is_question_exist:
                        is_item_exist = check_record_exist(collection, {'_id': ObjectId(edited_id), 'question_id': ObjectId(edited_parent_id), 'deleted': False})
                    else:
                        return ({'message': 'The research question does not exist', 'error': 'project'})
                else:
                    is_item_exist = check_record_exist(collection, {'_id': ObjectId(edited_id), 'deleted': False})

                if (is_item_exist):
                    is_permitted = False

                    if (existing_member['role'] == 'owner'):
                        is_permitted = True
                    else:
                        is_permitted = check_record_exist(collection, {'_id': ObjectId(edited_id), 'created_by': username})

                    if is_permitted:
                        if (change_type == 'remove'):
                            collection.update_one({
                                '_id': ObjectId(edited_id)
                            }, {
                                '$set': {
                                    'deleted': True,
                                    'updated_by': username,
                                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                                }
                            })

                            if (field == 'question'):
                                sub_question_collection.update_one({
                                'question_id': ObjectId(edited_id)
                            }, {
                                '$set': {
                                    'deleted': True,
                                    'updated_by': username,
                                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                                }
                            })
                        else:
                            collection.update_one({
                                '_id': ObjectId(edited_id)
                            }, {
                                '$set': {
                                    'value': edited_value,
                                    'updated_by': username,
                                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                                }
                            })

                        return ({'message': 'Update successfully', 'success': True})
                    else:
                        return ({'message': 'You do not have permissions to update this item', 'error': 'message'})
                else:
                    return ({'message': 'The updated item does not exist', 'error': 'project'})
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})
    
def check_record_exist(collection, query):
    is_exist = collection.find_one(query)
    if (is_exist):
        return True
    else:
        return False

def find_bot_response(sent_messages):
    completions = completion(
            model="gpt-3.5-turbo",
            messages=sent_messages,
            max_tokens=512,
            n=1,
            stop=None,
            temperature=0.7,
            api_key=openai.api_key
        )

    bot_message = completions['choices'][0]['message']['content'].strip()

    return bot_message
    
@app.route('/send_message_step_1', methods=['POST'])
def send_message_step_1():
    pro_id = request.get_json().get('pro_id')
    message = request.get_json().get('message')
    username = request.username

    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        append_user_message = {
            "role": "user", 
            "content": message,
            }
        if 'messages' not in existing_member:
            existing_member['messages'] = []

        sent_messages = [
            {'role': item['role'], 'content': item['content']}
            for item in existing_member.get('messages', [])
            if datetime.utcnow() - datetime.strptime(item['created_at'], '%Y-%m-%d %H:%M:%S') <= timedelta(hours=hours_threshold)
        ]

        pro_info = get_project_info_object(pro_id)
        topic = pro_info.get('topic', '')
        description = pro_info.get('description', '')

        questions_content = ''
        for index, item in enumerate(pro_info.get("questions", [])):
            questions_content += f'{index + 1}. {item["value"]} and its sub-questions are: '
            sub_questions = [sub_item for sub_item in pro_info.get("subQuestions", []) if item["_id"] == sub_item["question_id"]]
            sub_questions_for_item = [f'{sub_index + 1}. {sub_item["value"]}' for sub_index, sub_item in enumerate(sub_questions)]
    
            questions_content += ', '.join(sub_questions_for_item)
            questions_content += '\n'  # Add a newline for better formatting

        objectives_content = ', '.join([f'{index + 1}. {item["value"]}' for index, item in enumerate(pro_info.get('objectives', []))])
        keywords_content = ', '.join([f'{index + 1}. {item["value"]}' for index, item in enumerate(pro_info.get('keywords', []))])
        qlty_questions_content = ', '.join([f'{index + 1}. {item["value"]}' for index, item in enumerate(pro_info.get('qltyQuestions', []))])

        content = (
            f'I have a research topic: {topic}, '
            f'research description: {description}, '
            f'research questions: {questions_content}, '
            f'objectives: {objectives_content}, '
            f'keywords: {keywords_content}, '
            f'quality assessment questions: {qlty_questions_content}'
        )

        new_message = {'role': 'user', 'content': content}

        sent_messages.append(new_message)
        sent_messages.append(append_user_message)
        bot_message = find_bot_response(sent_messages)

        if bot_message:
            append_user_message['created_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            append_bot_message = {
                "role": "assistant", 
                "content": bot_message,
                "created_at": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            }

            existing_member['messages'].append(append_user_message)
            existing_member['messages'].append(append_bot_message)
            members_collection.update_one({'username': username, 'pro_id': ObjectId(pro_id)}, {'$set': {'messages': existing_member['messages']}})

            return jsonify({
                'message': 'Send message successfully', 
                'success': True, 
                'data': {
                    'message': bot_message
                }})
        else:
            return jsonify({
                'message': 'Send message successfully', 
                'success': True, 
                'data': {
                    'message': ''
                }})
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

def load_model(path):
    loaded_model = joblib.load(path)
    return loaded_model

def find_neighbors(model, text, chunks):
    inp_emb = model_embedding([text])["outputs"]
    neighbors = model.kneighbors(inp_emb, return_distance=False)[0]

    return [chunks[i] for i in neighbors]

@app.route('/send_message_step_2', methods=['POST'])
def send_message_step_2():
    pro_id = request.get_json().get('pro_id')
    ref_id = request.get_json().get('ref_id')
    question_type = request.get_json().get('question_type')
    message = request.get_json().get('message')
    username = request.username

    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_ref = references_collection.find_one({'_id': ObjectId(ref_id), 'deleted': False})
    existing_ref_chat = reference_chat_collection.find_one({'ref_id': ObjectId(ref_id), 'username': username, 'deleted': False})

    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        if (existing_ref):
            question_field = ''
            if (question_type == '0'):
                question_field = 'qlty_messages'
            else:
                question_field = 'extract_messages'

            append_user_message = {
                "role": "user", 
                "content": message,
            }

            ref_chat = {}
            if existing_ref_chat:
                ref_chat = existing_ref_chat

            if question_field not in ref_chat:
                ref_chat[question_field] = []

            sent_messages = [
                {'role': item['role'], 'content': item['content']}
                for item in ref_chat[question_field]
                if datetime.utcnow() - datetime.strptime(item['created_at'], '%Y-%m-%d %H:%M:%S') <= timedelta(hours=hours_threshold)
            ]

            if ('pdf' in existing_ref):
                new_message = create_prompt_question(existing_ref, message)
                sent_messages.append(new_message)
            else:
                sent_messages.append(append_user_message)

            bot_message = find_bot_response(sent_messages)
            if bot_message:
                append_user_message['created_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                append_bot_message = {
                    "role": "assistant", 
                    "content": bot_message,
                    "created_at": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                }

                ref_chat[question_field].append(append_user_message)
                ref_chat[question_field].append(append_bot_message)

                if (existing_ref_chat):
                    reference_chat_collection.update_one({
                        'username': username, 
                        'ref_id': ObjectId(ref_id)}, 
                        {
                            '$set': {
                                **{question_field: ref_chat[question_field]}
                            }
                        }
                    )
                else:
                    reference_chat_collection.insert_one({
                        'ref_id': ObjectId(ref_id),
                        'username': username,
                        'deleted': False,
                        **{question_field: ref_chat[question_field]}
                    })
                    
                return jsonify({
                    'message': 'Send message successfully', 
                    'success': True, 
                    'data': {
                        'message': bot_message
                    }})
            else:
                return jsonify({
                    'message': 'Send message successfully', 
                    'success': True, 
                    'data': {
                        'message': ''
                    }})
        else:
            return jsonify({'message': 'This reference does not exist', 'error': 'reference'})
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

@app.route('/add_reference', methods=['POST'])
def add_reference():
    pro_id = request.get_json().get('pro_id')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    
    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    if (existing_member):
        reference_data = {
            'pro_id': ObjectId(pro_id),
            'title': request.get_json().get('title', ''),
            'source_title': request.get_json().get('sourceTitle', ''),
            'year': request.get_json().get('year', datetime.utcnow().strftime('%Y')),
            'authors': request.get_json().get('authors', ''),
            'keywords': request.get_json().get('keywords', ''),
            'abstract': request.get_json().get('abstract', ''),
            'link': request.get_json().get('link', ''),
            'status': ['unscreen'],
            'deleted': False,
            'created_by': username,
            'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),  # Add the pro_created_at field with the current date
            'updated_by': username,
            'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
        }

        references_collection.insert_one(reference_data)
        return jsonify({'message': "Add new reference successfully", 'success': True})
    else:
        return jsonify({'message': 'You do not have permissions to add new member', 'error': 'project'})

@app.route('/update_reference', methods=['POST'])
def update_reference():
    pro_id = request.get_json().get('pro_id')
    ref_id = request.get_json().get('referenceId')
    update_type = request.get_json().get('update_type')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_ref = references_collection.find_one({'pro_id': ObjectId(pro_id), '_id': ObjectId(ref_id), 'deleted': False})
    
    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    
    if (existing_member):
        if (existing_ref):
            if (update_type == 'edit'):
                references_collection.update_one({
                    '_id': ObjectId(ref_id)
                }, {
                    '$set': {
                        'title': request.get_json().get('title', ''),
                        'source_title': request.get_json().get('sourceTitle', ''),
                        'year': request.get_json().get('year', datetime.utcnow().strftime('%Y')),
                        'authors': request.get_json().get('authors', ''),
                        'keywords': request.get_json().get('keywords', ''),
                        'link': request.get_json().get('link', ''),
                        'abstract': request.get_json().get('abstract', ''),
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
                    }
                })
            elif (update_type == 'update_status'):
                new_status = request.get_json().get('new_status')

                status = []
                if (new_status == 'selected'):
                    status = ['screened', 'selected']
                elif (new_status == 'unselected'):
                    status = ['screened']
                else:
                    status = [new_status]

                references_collection.update_one({
                    '_id': ObjectId(ref_id)
                }, {
                    '$set': {
                        'status': status,
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
                    }
                })
            else:
                references_collection.update_one({
                    '_id': ObjectId(ref_id)
                }, {
                    '$set': {
                        'deleted': True,
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
                    }
                })
            return jsonify({'message': 'Update successfully', 'success': True})
        else:
            return jsonify({'message': 'The reference is not valid', 'error': 'reference'})
    else:
        return jsonify({'message': 'You do not have permissions to edit reference', 'error': 'project'})

@app.route('/get_references', methods=['GET'])
def get_references():
    pro_id = request.args.get('pro_id')
    username = request.username
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        qlty_questions = list(qlty_question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
        qlty_questions = convert_id2_str(qlty_questions, ['_id', 'pro_id'])

        #Research questions
        questions = list(question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
        questions = convert_id2_str(questions, ['_id', 'pro_id'])

        sub_questions = []
        for question in questions:
            question_id = question['_id']
            results = list(sub_question_collection.find({'question_id': ObjectId(question_id), 'deleted': False}))
            results = convert_id2_str(results, ['_id', 'question_id'])
            sub_questions.extend(results)

        status = request.args.get('status', '')

        if status:
            references = list(references_collection.find({'pro_id': ObjectId(pro_id), 'status': {'$in': [status]}, 'deleted': False}))
        else: 
            references = list(references_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
        
        references = convert_id2_str(references, ['_id', 'pro_id'])

        for ref in references:
            ref['num_qlty_questions'] = len(qlty_questions)
            ref['num_qlty_responses'] = 0
            ref['num_sub_questions'] = len(sub_questions)
            ref['num_sub_responses'] = 0

            for question in qlty_questions:
                response = qlty_response_collection.find_one({'question_id': ObjectId(question['_id']), 'ref_id': ObjectId(ref['_id']), 'deleted': False})
                if response:
                    ref['num_qlty_responses'] += 1

            for question in sub_questions:
                response = sub_response_collection.find_one({'question_id': ObjectId(question['_id']), 'ref_id': ObjectId(ref['_id']), 'deleted': False})
                if response:
                    ref['num_sub_responses'] += 1

        return jsonify({
            'message': 'You got it', 
            'references': references
            })
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

@app.route('/get_practical_screen_info', methods=['GET'])
def get_practical_screen_info():
    pro_id = request.args.get('pro_id')
    username = request.username
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):

        keywords = [{'label': item['value'], 'value': item['value']} for item in list(keyword_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))]
        references = query_filtered_references(pro_id)

        return jsonify({
            'message': 'You got it', 
            'keywords': keywords,
            'references': references
            })
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

@app.route('/get_reference_info', methods=['GET'])
def get_reference_info():
    pro_id = request.args.get('pro_id')
    ref_id = request.args.get('ref_id')
    username = request.username
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_ref_chat = reference_chat_collection.find_one({'ref_id': ObjectId(ref_id), 'username': username, 'deleted': False})

    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        reference = references_collection.find_one({'_id': ObjectId(ref_id), 'pro_id': ObjectId(pro_id), 'deleted': False})
        if (reference):
            reference = convert_id2_str(reference, ['_id', 'pro_id'], False)
            #Quality assessment questions
            qlty_questions = list(qlty_question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
            qlty_questions = convert_id2_str(qlty_questions, ['_id', 'pro_id'])

            #Research questions
            questions = list(question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
            questions = convert_id2_str(questions, ['_id', 'pro_id'])

            sub_questions = []
            reference['response_sub_questions'] = {}
            for question in questions:
                question_id = question['_id']
                reference['response_sub_questions'][question_id] = {
                    'value': question['value'],
                    'sub_questions': {}
                }

                results = list(sub_question_collection.find({'question_id': ObjectId(question_id), 'deleted': False}))
                results = convert_id2_str(results, ['_id', 'question_id'])

                for result in results:
                    sub_id = result['_id']
                    sub_value = result['value']

                    reference['response_sub_questions'][question_id]['sub_questions'][sub_id] = {
                        'value': sub_value,
                        'response': '',
                        'responded_by': ''
                    }

                    response = sub_response_collection.find_one({'question_id': ObjectId(sub_id), 'ref_id': ObjectId(reference['_id']), 'deleted': False})
                    if (response):
                        reference['response_sub_questions'][question_id]['sub_questions'][sub_id]['response'] = response['value']
                        reference['response_sub_questions'][question_id]['sub_questions'][sub_id]['responded_by'] = response['updated_by']

                sub_questions.extend(results)

            reference['response_qlty_questions'] = []
            for question in qlty_questions:
                response_question = {
                    'question_id': question['_id'],
                    'question': question['value'],
                    'response': '',
                    'responded_by': ''
                }

                response = qlty_response_collection.find_one({'question_id': ObjectId(question['_id']), 'ref_id': ObjectId(reference['_id']), 'deleted': False})
                if response:
                    response_question['response'] = response['value']
                    response_question['responded_by'] = response['updated_by']
                
                reference['response_qlty_questions'].append(response_question)
           
            qlty_messages = []
            extract_messages = []

            if existing_ref_chat:
                qlty_messages = existing_ref_chat.get('qlty_messages', [])
                extract_messages = existing_ref_chat.get('extract_messages', [])

            return jsonify({
                'message': 'You got it', 
                'reference_info': reference,
                'qlty_messages': qlty_messages,
                'extract_messages': extract_messages
                })
        else:
            return jsonify({
                'message': 'The reference does not exist',
                'error': 'reference'
            })
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})

@app.route('/upload_references', methods=['POST'])
def upload_references():
    pro_id = request.get_json().get('pro_id')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    
    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    if (existing_member):
        csv_data = request.get_json().get('csv_data')

        for data in csv_data:
            reference_data = {
                'pro_id': ObjectId(pro_id),
                'title': data.get('Title', ''),
                'source_title': data.get('Source title', ''),
                'year': data.get('Year', datetime.utcnow().strftime('%Y')),
                'authors': data.get('Authors', ''),
                'keywords': data.get('Keywords', ''),
                'abstract': data.get('Abstract', ''),
                'link': data.get('Link', ''),
                'status': ['unscreen'],
                'deleted': False,
                'created_by': username,
                'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),  # Add the pro_created_at field with the current date
                'updated_by': username,
                'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')  # Add the pro_created_at field with the current date
            }

            references_collection.insert_one(reference_data)

        return jsonify({'message': "Import references successfully", 'success': True})
    else:
        return jsonify({'message': 'You do not have permissions to upload this reference file', 'error': 'project'})

def search_scopus(query_string, min_year, max_year, page_num):
    query_string = f'{query_string}AND(PUBYEAR AFT {str(min_year)})AND(PUBYEAR BEF {str(max_year)})'
    s = ScopusSearch(query_string, verbose=True, subscriber=True, api_key='7d12e95f3420d0477af9b60aad399f99')
    df = pd.DataFrame(pd.DataFrame(s.results))
    abstract_infos = []
    for index, row in df.iterrows():
        info = {
                'Source title': row['publicationName'],
                'Title': row['title'],
                'Authors': row['author_names'],
                'Abstract': row['description'],
                'Keywords': row['authkeywords'],
                'Year': re.search(r'\b\d{4}\b', row['coverDate']).group() if re.search(r'\b\d{4}\b', row['coverDate']) else None       
        }

        # try:
        #     ab = AbstractRetrieval(identifier=row['eid'], view='FULL')
        #     authors = pd.DataFrame(ab.authors)
        #     info['Authors'] = ','.join(map(str, [author['indexed_name'] for idx, author in authors.iterrows()]))
    
        # except Exception as e:
        #     next
        
        abstract_infos.append(info)
    return {
        'data': abstract_infos,
        'totalResults': s.get_results_size(),
        'totalPages': 1
    }

def search_pubmed(query_string, min_year, max_year, page_num):
    query_string = query_string.replace(' ', '+')
    base_url = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
    db = f'db=pubmed'
    # esearch settings
    search_eutil = 'esearch.fcgi?'
    search_term = f'&term=({query_string}AND({str(min_year)}:{str(max_year)}[dp]))'
    search_usehistory = '&usehistory=y'
    search_rettype = '&rettype=json'
    
    search_url = base_url+search_eutil+db+search_term+search_usehistory+search_rettype
    f = urllib.request.urlopen (search_url)
    search_data = f.read().decode('utf-8')
    total_abstract_count = int(re.findall("<Count>(\d+?)</Count>",search_data)[0])

    # efetch settings
    fetch_eutil = 'efetch.fcgi?'
    retmax = 500
    total_pages = math.ceil(total_abstract_count/retmax)
    fetch_retmode = "&retmode=text"

    # obtain webenv and querykey settings from the esearch results
    fetch_webenv = "&WebEnv=" + re.findall("<WebEnv>(\S+)<\/WebEnv>", search_data)[0]
    fetch_querykey = "&query_key=" + re.findall("<QueryKey>(\d+?)</QueryKey>",search_data)[0]


    fetch_retstart = "&retstart=" + str((page_num-1)*retmax)
    fetch_retmax = "&retmax=" + str(retmax)
    fetch_rettype = "&rettype=abstract"
    # create the efetch url
    fetch_url = base_url+fetch_eutil+db+fetch_querykey+fetch_webenv+fetch_retstart+fetch_retmax+fetch_retmode+fetch_rettype
    # open the efetch url
    f = urllib.request.urlopen (fetch_url)
    fetch_data = f.read().decode('utf-8')
    # split the data into individual abstracts
    abstracts = fetch_data.split("\n\n\n")
    
    abstract_infos = []
    for abstract in abstracts:
        info = abstract.split("\n\n")
        if (len(info) > 5):
            abstract_infos.append({
                'Source title': info[0],
                'Title': info[1],
                'Authors': info[2],
                'Abstract': info[4],
                'Year': re.search(r'\b\d{4}\b', info[0]).group() if re.search(r'\b\d{4}\b', info[0]) else None       
            })
    
    return {
        'data': abstract_infos,
        'totalResults': total_abstract_count,
        'totalPages': total_pages
    }

@app.route('/find_references', methods=['POST'])
def find_references():
    try:
        query_string = request.get_json().get('query_string')
        database = request.get_json().get('database')
        min_year = int(request.get_json().get('min_year'))
        max_year = int(request.get_json().get('max_year'))
        page_num = int(request.get_json().get('page_number')) or 1
        results = {
            'totalPages': 0,
            'data': [],
            'totalResults': 0
        }
        
        if (database == 'pubmed'):
            results = search_pubmed(query_string, min_year, max_year, page_num)
        else:
            results = search_scopus(query_string, min_year, max_year, page_num)
        

        return jsonify({
            'totalPages': results['totalPages'] or 0,
            'data': results['data'] or [],
            'totalResults': results['totalResults'] or 0,
            'pageNumber': page_num
        })
    except Exception as e:
        return jsonify({'error': 'reference', 'message': str(e)})

def query_filtered_references(pro_id, query_filter=[]):
    # Check if a document with the same user_id exists
    valid_filter_words = {}
    invalid_filter_words = {}
    query = {
        "pro_id": ObjectId(pro_id),
        'deleted': False
    }

    if (query_filter):
        query['$and'] = []

    for idx, criteria in enumerate(query_filter):
        logical_operator = criteria['logicalOperator']
        inex_operator = criteria['inexOperator']
        key = criteria['key']
        condition = criteria['condition']
        value = criteria['value']

        subquery = {}

        if key == 'year':
            if condition == '=':
                subquery[key] = {'$eq': int(value)}
            elif condition == '>':
                subquery[key] = {'$gt': int(value)} 
            elif condition == '<':
                subquery[key] = {'$lt': int(value)} 
            elif condition == '>=':
                subquery[key] = {'$gte': int(value)} 
            else:
                subquery[key] = {'$lte': int(value)} 

        else:
            columns = str.split(key, ',')
            subqueries_1 = []
            for element in value:
                subqueries_2 = []
                for column in columns:
                    if inex_operator == 'INCLUDE':
                        if not column in valid_filter_words:
                            valid_filter_words[column] = []

                        if not element in valid_filter_words[column]:
                            valid_filter_words[column].append(element['value'])
                    else:
                        if not column in invalid_filter_words:
                            invalid_filter_words[column] = []

                        if not element in invalid_filter_words[column]:
                            invalid_filter_words[column].append(element['value'])

                    subqueries_2.append({
                        column: {"$regex": element['value']},
                    })

                subqueries_1.append({'$or': subqueries_2})    
            if condition == 'includes all':
                subquery['$and'] = subqueries_1
            else:
                subquery['$or'] = subqueries_1

        subquery_nest = {}
        if inex_operator == 'EXCLUDE':
            subquery_nest = {'$nor': [subquery]}
        else:
            subquery_nest = subquery

        if logical_operator == 'AND':
            query['$and'].append(subquery_nest)
        elif logical_operator == 'OR':
            query['$and'].append({'$or': [subquery_nest]})

    valid_document = list(references_collection.find(query, {"pro_id": 0, "link": 0}))
    valid_ids = [doc["_id"] for doc in valid_document]

    # Define the query for invalid documents
    invalid_query = {
        "pro_id": ObjectId(pro_id), 
         "_id": {"$nin": valid_ids},
        'deleted': False
    }

    # Retrieve invalid documents
    invalid_document = list(references_collection.find(invalid_query, {"pro_id": 0, "link": 0}))

    for doc in valid_document:
        doc["_id"] = str(doc["_id"])

    for doc in invalid_document:
        doc["_id"] = str(doc["_id"])

    return {
        'validDocument': valid_document,
        'validFilterWords': valid_filter_words,
        'invalidDocument': invalid_document,
        'invalidFilterWords': invalid_filter_words
    }
        
@app.route('/filter_references', methods=['POST'])
def filter_references():
    pro_id = request.get_json().get('pro_id')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    
    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    if (existing_member):
        query_filter = request.get_json().get('query_filter')
        references = query_filtered_references(pro_id, query_filter)
        return jsonify({
            'message': "Import references successfully", 
            'references': references
        })
    else:
        return jsonify({'message': 'You do not have permissions to upload this reference file', 'error': 'project'})

def allowed_file(extension, filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == extension

def preprocess(text):
    text = text.replace('\n', ' ')
    text = re.sub('\s+', ' ', text)
    return text

def pdf_to_text(path, start_page=1, end_page=None):
    doc = fitz.open(path)
    total_pages = doc.page_count

    if end_page is None:
        end_page = total_pages

    text_list = []

    for i in range(start_page - 1, end_page):
        text = doc.load_page(i).get_text("text")
        text = preprocess(text)
        text_list.append(text)

    doc.close()
    return text_list

def text_to_chunks(texts, word_length=150, start_page=1):
    text_toks = [t.split(' ') for t in texts]
    chunks = []

    for idx, words in enumerate(text_toks):
        for i in range(0, len(words), word_length):
            chunk = words[i : i + word_length]
            if (
                (i + word_length) > len(words)
                and (len(chunk) < word_length)
                and (len(text_toks) != (idx + 1))
            ):
                text_toks[idx + 1] = chunk + text_toks[idx + 1]
                continue
            chunk = ' '.join(chunk).strip()
            chunk = f'[Page no. {idx+start_page}]' + ' ' + '"' + chunk + '"'
            chunks.append(chunk)
    return chunks

@app.route('/upload_pdf_file', methods=['POST'])
def upload_pdf_file():
    pro_id = request.args.get('pro_id')
    ref_id = request.args.get('ref_id')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_ref = references_collection.find_one({'pro_id': ObjectId(pro_id), '_id': ObjectId(ref_id), 'deleted': False})
    
    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    
    if (existing_member):
        if (existing_ref):
            if 'file' not in request.files:
                return jsonify({'message': 'No file found in request', 'error': 'upload_file'})

            file = request.files['file']

            if file.filename == '':
                return jsonify({'message': 'No selected file', 'error': 'upload_file'})

            if file and allowed_file('pdf', file.filename):
                if file.content_length > app.config['MAX_CONTENT_LENGTH']:
                    return jsonify({'error': 'File size exceeds the limit (2MB)'}), 400

                # Combine original filename with reference_id for a new filename
                filename = f"{ref_id}.pdf"

                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)

                recommender = SemanticSearch(ref_id)
                texts = pdf_to_text(filepath)
                chunks = text_to_chunks(texts)
                recommender.fit(chunks)
                modelpath = recommender.save_model()

                # Store info in document_collection
                store_pdf_info(username, ref_id, filepath, file.filename, chunks, modelpath)
                return jsonify({'message': 'File uploaded successfully', 'originalName': file.filename}), 200


            return jsonify({
                'message': 'Upload successfully', 
                'success': True,
                'originalName': 'Hello'})
        else:
            return jsonify({'message': 'The reference is not valid', 'error': 'reference'})
    else:
        return jsonify({'message': 'You do not have permissions to edit reference', 'error': 'project'})

def store_pdf_info(username, ref_id, filepath, original_filename, chunks, modelpath):
    # Implement your logic to store document info in the database
    # Replace this with your actual database interaction code

    pdf_info = {
        'modelpath': modelpath,
        'filepath': filepath,
        'originalName': original_filename,
        'chunks': chunks,
        'created_by': username,
        'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
    }

    references_collection.update_one(
        {'_id': ObjectId(ref_id)},
        {'$set': {'pdf': pdf_info}}
    )  

@app.route('/public/static_reference/<reference_id>.pdf')
def serve_pdf(reference_id):
    # Serve the PDF file
    return send_from_directory(app.config['UPLOAD_FOLDER'], f"{reference_id}.pdf")

class SemanticSearch:
    def __init__(self, reference_id):
        self.fitted = False
        self.reference_id = reference_id

    def fit(self, data, batch=1000, n_neighbors=8):
        self.data = data
        self.embeddings = self.get_text_embedding(data, batch=batch)
        n_neighbors = min(n_neighbors, len(self.embeddings))
        self.nn = NearestNeighbors(n_neighbors=n_neighbors)
        self.nn.fit(self.embeddings)
        self.fitted = True

    def get_text_embedding(self, texts, batch=1000):
        embeddings = []
        for i in range(0, len(texts), batch):
            text_batch = texts[i: (i + batch)]
            emb_batch = model_embedding(text_batch)["outputs"]
            embeddings.append(emb_batch)
        embeddings = np.vstack(embeddings)
        return embeddings

    def save_model(self):
        if self.fitted:
            model_name = f"{self.reference_id}.pkl"
            model_path = os.path.join('public', 'model', model_name)
            joblib.dump(self.nn, model_path)

            return model_path
        else:
            print("Model has not been fitted yet. Fit the model before saving.")
            return

@app.route('/update_qlty_response', methods=['POST'])
def update_qlty_response():
    pro_id = request.get_json().get('pro_id')
    ref_id = request.get_json().get('ref_id')
    question_id = request.get_json().get('question_id')
    new_response = request.get_json().get('new_response')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_ref = references_collection.find_one({'pro_id': ObjectId(pro_id), '_id': ObjectId(ref_id), 'deleted': False})
    existing_response = qlty_response_collection.find_one({'ref_id': ObjectId(ref_id), 'question_id': ObjectId(question_id), 'deleted': False})

    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    
    if (existing_member):
        if (existing_ref):
            if existing_response:
                qlty_response_collection.update_one({
                    'ref_id': ObjectId(ref_id), 
                    'question_id': ObjectId(question_id)
                }, {
                    '$set': {
                        'value': new_response,
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                    }
                })
            else:
                qlty_response_collection.insert_one({
                    'ref_id': ObjectId(ref_id), 
                    'question_id': ObjectId(question_id),
                    'value': new_response,
                    'updated_by': username,
                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                    'deleted': False
                })

            return jsonify({
                'message': 'Update successfully', 
                'success': True,})
        else:
            return jsonify({'message': 'The reference is not valid', 'error': 'reference'})
    else:
        return jsonify({'message': 'You do not have permissions to edit reference', 'error': 'project'})

@app.route('/update_sub_response', methods=['POST'])
def update_sub_response():
    pro_id = request.get_json().get('pro_id')
    ref_id = request.get_json().get('ref_id')
    question_id = request.get_json().get('question_id')
    new_response = request.get_json().get('new_response')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_ref = references_collection.find_one({'pro_id': ObjectId(pro_id), '_id': ObjectId(ref_id), 'deleted': False})
    existing_response = sub_response_collection.find_one({'ref_id': ObjectId(ref_id), 'question_id': ObjectId(question_id), 'deleted': False})

    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    
    if (existing_member):
        if (existing_ref):
            if existing_response:
                sub_response_collection.update_one({
                    'ref_id': ObjectId(ref_id), 
                    'question_id': ObjectId(question_id)
                }, {
                    '$set': {
                        'value': new_response,
                        'updated_by': username,
                        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                    }
                })
            else:
                sub_response_collection.insert_one({
                    'ref_id': ObjectId(ref_id), 
                    'question_id': ObjectId(question_id),
                    'value': new_response,
                    'updated_by': username,
                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                    'deleted': False
                })

            return jsonify({
                'message': 'Update successfully', 
                'success': True,})
        else:
            return jsonify({'message': 'The reference is not valid', 'error': 'reference'})
    else:
        return jsonify({'message': 'You do not have permissions to edit reference', 'error': 'project'})


def create_prompt_question(existing_ref, message):
    chunks = existing_ref['pdf']['chunks']
    modelpath = existing_ref['pdf']['modelpath']

    loaded_model = load_model(modelpath)
    topn_chunks = find_neighbors(loaded_model, message, chunks)
    prompt = ""
    prompt += 'search results:\n\n'
    for c in topn_chunks:
        prompt += c + '\n\n'

    prompt += (
        "Instructions: Compose a comprehensive reply to the query using the search results given. "
        "Cite each reference using [ Page Number] notation (every result has this number at the beginning). "
        "Citation should be done at the end of each sentence. If the search results mention multiple subjects "
        "with the same name, create separate answers for each. Only include information found in the results and "
        "don't add any additional information. Make sure the answer is correct and don't output false content. "
        "Only answer what is asked. The "
        "answer should be short and concise. Answer step-by-step. \n\n"
    )

    prompt += f"Query: {message}\nAnswer:"
    new_message = {'role': 'user', 'content': prompt}

    return new_message
    
@app.route('/auto_answer', methods=['POST'])
def auto_answer():
    pro_id = request.get_json().get('pro_id')
    ref_id = request.get_json().get('ref_id')
    type = request.get_json().get('type')
    question_id = request.get_json().get('question_id')
    username = request.username

    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    existing_ref = references_collection.find_one({'pro_id': ObjectId(pro_id), '_id': ObjectId(ref_id), 'deleted': False})

    if (active_project is False):
        return jsonify({'message': 'The project is deactivated', 'error': 'project'})
    
    if (existing_member):
        if (existing_ref and 'pdf' in existing_ref):
            if (type == 'qlty'):
                #Quality assessment questions
                qlty_questions = list(qlty_question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
                qlty_questions = convert_id2_str(qlty_questions, ['_id', 'pro_id'])

                for question in qlty_questions:
                    question_text = question['value']
                    id = question['_id']

                    new_prompt = create_prompt_question(existing_ref, question_text)
                    bot_message = find_bot_response([new_prompt])

                    if bot_message:
                        existing_response = qlty_response_collection.find_one({'ref_id': ObjectId(ref_id), 'question_id': ObjectId(id), 'deleted': False})
                        if existing_response:
                            qlty_response_collection.update_one({
                                'ref_id': ObjectId(ref_id), 
                                'question_id': ObjectId(id)
                            }, {
                                '$set': {
                                    'value': bot_message,
                                    'updated_by': username,
                                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                                }
                            })
                        else:
                            qlty_response_collection.insert_one({
                                'ref_id': ObjectId(ref_id), 
                                'question_id': ObjectId(id),
                                'value': bot_message,
                                'updated_by': username,
                                'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                                'deleted': False
                            })

            else:
                #Research questions
                sub_questions = list(sub_question_collection.find({'question_id': ObjectId(question_id), 'deleted': False}))
                for question in sub_questions:
                    question_text = question['value']
                    id = question['_id']

                    new_prompt = create_prompt_question(existing_ref, question_text)
                    bot_message = find_bot_response([new_prompt])

                    if bot_message:
                        existing_response = sub_response_collection.find_one({'ref_id': ObjectId(ref_id), 'question_id': id, 'deleted': False})
                        if existing_response:
                            sub_response_collection.update_one({
                                'ref_id': ObjectId(ref_id), 
                                'question_id': id
                            }, {
                                '$set': {
                                    'value': bot_message,
                                    'updated_by': username,
                                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
                                }
                            })
                        else:
                            sub_response_collection.insert_one({
                                'ref_id': ObjectId(ref_id), 
                                'question_id': id,
                                'value': bot_message,
                                'updated_by': username,
                                'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M'),
                                'deleted': False
                            })

            return jsonify({
                'message': 'Update successfully', 
                'success': True,})
        else:
            return jsonify({'message': 'The reference is not valid', 'error': 'reference'})
    else:
        return jsonify({'message': 'You do not have permissions to edit reference', 'error': 'project'})

@app.route("/export_excel", methods=['POST'])
def export_excel():
    pro_id = request.get_json().get('pro_id')
    sub_question_id = request.get_json().get('sub_question_id')
    question_id = request.get_json().get('question_id')
    username = request.username

    references = list(references_collection.find({'pro_id': ObjectId(pro_id), 'status': {'$in': ['selected']}, 'deleted': False}))
    references = convert_id2_str(references, ['_id', 'pro_id'])

    questions = list(question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
    questions = convert_id2_str(questions, ['_id', 'pro_id'])

    sub_questions = []
    for question in questions:
        results = list(sub_question_collection.find({'question_id': ObjectId(question['_id']), 'deleted': False}))
        results = convert_id2_str(results, ['_id', 'question_id'])
        sub_questions.extend(results)

    df = {}
    references = [ref for ref in references]
    df['ID'] = [idx for idx, row in enumerate(references)]
    df['Title'] = [row['title'] for row in references]

  
    for idx, question in enumerate(questions):
        if question['_id'] == question_id or question_id == '':
            count = 0
            for sub_idx, sub_question in enumerate(sub_questions):
                if sub_question['question_id'] == question['_id']:
                    count += 1
                    if sub_question['_id'] == sub_question_id or sub_question_id == '':
                        question_value = sub_question['value']
                        column_name = f'{str(idx+1)}.{str(count)}.{question_value}'
                        df[column_name] = []

                        for row in references:
                            response = sub_response_collection.find_one({'ref_id': ObjectId(row['_id']), 'question_id': ObjectId(sub_question['_id']), 'deleted': False})
                            if response:
                                df[column_name].append(response['value'])
                            else:
                                df[column_name].append('')

    pandas_df = pd.DataFrame(df)
    # Create an Excel writer
    with pd.ExcelWriter('output.xlsx', engine='xlsxwriter') as writer:
        # Write the DataFrame to an Excel sheet
        pandas_df.to_excel(writer, sheet_name='Sheet1', index=False)

    return send_file("output.xlsx", as_attachment=True)

@app.route("/write_text", methods=['POST'])
def write_text():
    pro_id = request.get_json().get('pro_id')
    message = request.get_json().get('message')
    username = request.username

    existing_member = members_collection.find_one({'pro_id': ObjectId(pro_id), 'username': username, 'status': 'active'})
    active_project = projects_collection.find_one({'_id': ObjectId(pro_id), 'pro_status': True})
 
    if (active_project is False):
        return jsonify({'message': 'The project is deactive', 'error': 'project'})
    if (existing_member):
        append_user_message = {
            "role": "user", 
            "content": message,
        }

        if 'synthesis_messages' not in existing_member:
            existing_member['synthesis_messages'] = []

        sent_messages = [
            {'role': item['role'], 'content': item['content']}
            for item in existing_member.get('synthesis_messages', [])
            if datetime.utcnow() - datetime.strptime(item['created_at'], '%Y-%m-%d %H:%M:%S') <= timedelta(hours=hours_threshold)
        ]

        references = list(references_collection.find({'pro_id': ObjectId(pro_id), 'status': {'$in': ['selected']}, 'deleted': False}))
        references = convert_id2_str(references, ['_id', 'pro_id'])

        questions = list(question_collection.find({'pro_id': ObjectId(pro_id), 'deleted': False}))
        questions = convert_id2_str(questions, ['_id', 'pro_id'])

        sub_questions = []
        for question in questions:
            results = list(sub_question_collection.find({'question_id': ObjectId(question['_id']), 'deleted': False}))
            results = convert_id2_str(results, ['_id', 'question_id'])
            sub_questions.extend(results)

        df = {}
        references = [ref for ref in references]
        df['ID'] = [idx for idx, row in enumerate(references)]
        df['Title'] = [row['title'] for row in references]
        df['Authors'] = [row['authors'] for row in references]
    
        for idx, question in enumerate(questions):
                count = 0
                for sub_idx, sub_question in enumerate(sub_questions):
                    if sub_question['question_id'] == question['_id']:
                        count += 1
                        question_value = sub_question['value']
                        column_name = f'{str(idx+1)}.{str(count)}.{question_value}'
                        df[column_name] = []

                        for row in references:
                            response = sub_response_collection.find_one({'ref_id': ObjectId(row['_id']), 'question_id': ObjectId(sub_question['_id']), 'deleted': False})
                            if response:
                                df[column_name].append(response['value'])
                            else:
                                df[column_name].append('')

        pandas_df = pd.DataFrame(df)
        df = pandas_df.to_csv(index=False).strip('\n').split('\n')
        df_text = '\r\n'.join(df)  # <= this is the string that you can use with md5
        prompt = f"""Based on our dataFrame with research paper data. DataFrame structure: [ID, title, Authors, sub_research_questions - answers]"""
        prompt += df_text

        new_message = {'role': 'user', 'content': prompt}

        sent_messages.append(new_message)
        sent_messages.append(append_user_message)

        bot_message = find_bot_response(sent_messages)

        if bot_message:
            append_user_message['created_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            append_bot_message = {
                "role": "assistant", 
                "content": bot_message,
                "created_at": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            }

            existing_member['synthesis_messages'].append(append_user_message)
            existing_member['synthesis_messages'].append(append_bot_message)
            members_collection.update_one({'username': username, 'pro_id': ObjectId(pro_id)}, {'$set': {'synthesis_messages': existing_member['synthesis_messages']}})

            return jsonify({
                'message': 'Send message successfully', 
                'success': True, 
                'data': {
                    'message': bot_message
                }})
        else:
            return jsonify({
                'message': 'Send message successfully', 
                'success': True, 
                'data': {
                    'message': ''
                }})
    else:
        return jsonify({'message': 'You do not exist in this project', 'error': 'project'})
      
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

