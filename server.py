from flask import Flask, render_template
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)  # Bật CORS
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/sender')
def sender():
    return render_template('sender.html')

@app.route('/receiver')
def receiver():
    return render_template('receiver.html')

@socketio.on('send_file')
def handle_send_file(data):
    print(f"📤 Received file: {data['fileName']} (Type: {data.get('fileType', 'unknown')})")
    socketio.emit('receive_file', data)  # Broadcast to all clients

if __name__ == '__main__':
    print("=========================================")
    print("🚀 Server is running!")
    print("👉 Sender:    http://localhost:5000/sender")
    print("👉 Receiver:   http://localhost:5000/receiver")
    print("=========================================")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)