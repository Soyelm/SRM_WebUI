import random
from flask import Flask, render_template, request, url_for, jsonify, Response
import time
import json
import ctypes
import os
import struct

app = Flask(__name__, template_folder='./templates')

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/motordata_stream')
def motordata_stream():
  def generate():
    fifo_path = '/tmp/cpp2py'
    pipe = os.open(fifo_path, os.O_RDONLY, os.O_NONBLOCK)
    while True:
      receive_data = os.read(pipe, 14);
      # if receive_data == "":
      #   continue
      receive_data = receive_data.decode().strip('#').strip()
      data_list = [float(x) for x in receive_data.split()]
      # print(data_list)
      set_data = data_list[0]
      feedback_data = data_list[1]
      timestamp = time.time()
      data = {'timestamp': timestamp, 'set_data': set_data, 'feedback_data': feedback_data}
      # print(data)
      yield f"data: {json.dumps(data)}\n\n"
      time.sleep(0.01)
  return Response(generate(), mimetype='text/event-stream')

@app.route('/motors_parameters')
def motors_parameters():
  with open('motors.json', 'r') as file:
    parameters = json.load(file)
  return parameters

@app.route('/update_parameter', methods=['POST'])
def update_parameter():
    def send_data(motor_name, setpoint_name, param_name, param_value):
      pipe_name = '/tmp/py2cpp'
      
      if not os.path.exists(pipe_name):
        print(111)
        os.mkfifo(pipe_name)

      pipe_fd = os.open(pipe_name, os.O_WRONLY, os.O_NONBLOCK)

      message = f'{motor_name} {setpoint_name} {param_name} {param_value}'
      os.write(pipe_fd, message.encode())

    data = request.get_json()  # 获取发送的 JSON 数据
    motor_name = data.get('motor_name')
    setpoint_name = data.get('setpoint_name')
    param_name = data.get('param_name')
    param_value = data.get('param_value')
    # print(motor_name, setpoint_name, param_name, param_value)
    send_data(motor_name, setpoint_name, param_name, param_value)


    return jsonify({'status': 'success'})

if __name__ == '__main__':
  app.run(host='127.0.0.1', port=9003, debug=True)  # 监听端口 9003
