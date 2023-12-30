// backend/mongo-init-scripts/init-db.js

// Connect to the 'mydatabase' database
var db = db.getSiblingDB('mydatabase');

// Create a 'mycollection' collection
db.createCollection('tr_user');
db.createCollection('tr_project');
db.createCollection('tr_member');
db.createCollection('tr_objective');
db.createCollection('tr_question');
db.createCollection('tr_keyword');
db.createCollection('tr_sub_question');
db.createCollection('tr_qlty_question');
db.createCollection('tr_main_message');
db.createCollection('tr_reference');
db.createCollection('tr_qlty_response');
db.createCollection('tr_sub_response');
db.createCollection('tr_reference_chat');

db['tr_user'].insert({ 
    'username': 'admin',
    'password': '$2b$12$vZztufcI9SvUoTagoDhcEOqMLU4g73QQC8hzboYHEhStrbBQDcST6',
    'role': 'admin',
    'active': true
 });
