from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import csv
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# File to store user data
CSV_FILE = 'users.csv'

# Ensure CSV file exists with headers
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['email', 'password', 'wallet_address', 'created_at', 'last_login'])

# API endpoint for sign-up
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password or '@' not in email:
        return jsonify({'error': 'Invalid email or password'}), 400

    # Check if email already exists
    with open(CSV_FILE, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        if any(row['email'] == email for row in reader):
            return jsonify({'error': 'Email already registered'}), 400

    # Append new user to CSV
    with open(CSV_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([email, password, '', datetime.utcnow().isoformat()])

    return jsonify({'message': 'Successfully signed up!'}), 201

# API endpoint for sign-in
@app.route('/api/signin', methods=['POST'])
def signin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Invalid email or password'}), 400

    # Check credentials
    with open(CSV_FILE, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row['email'] == email and row['password'] == password:
                with open(CSV_FILE, mode='r', newline='') as read_file:
                    lines = list(csv.reader(read_file))
                lines[int(row['id']) if 'id' in row else 0] = [email, password, row['wallet_address'], row['created_at'], datetime.utcnow().isoformat()]
                with open(CSV_FILE, mode='w', newline='') as write_file:
                    writer = csv.writer(write_file)
                    writer.writerows(lines)
                return jsonify({'message': 'Successfully signed in!', 'wallet_address': row['wallet_address']}), 200
        return jsonify({'error': 'Invalid credentials'}), 401

# API endpoint for wallet connection
@app.route('/api/connect-wallet', methods=['POST'])
def connect_wallet():
    data = request.get_json()
    email = data.get('email')
    wallet_address = data.get('wallet_address')

    if not email or not wallet_address:
        return jsonify({'error': 'Invalid email or wallet address'}), 400

    # Update wallet address in CSV
    with open(CSV_FILE, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        rows = list(reader)
    for i, row in enumerate(rows):
        if row['email'] == email:
            rows[i]['wallet_address'] = wallet_address
            break
    else:
        return jsonify({'error': 'Email not found'}), 404

    with open(CSV_FILE, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['email', 'password', 'wallet_address', 'created_at', 'last_login'])
        writer.writerows([[row['email'], row['password'], row['wallet_address'], row['created_at'], row['last_login']] for row in rows])

    return jsonify({'message': 'Wallet connected!', 'wallet_address': wallet_address}), 200

# Serve wallet page
@app.route('/wallet')
def wallet_page():
    return render_template('wallet.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)