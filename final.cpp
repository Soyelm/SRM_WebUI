#include <iostream>
#include <sys/types.h>
#include <sys/stat.h>
#include <filesystem>
#include <fcntl.h>
#include <random>
#include <unistd.h>
#include <iomanip>
#include <sstream>
#include <chrono>
#include <thread>

int main() {

  std::random_device rd;
  std::mt19937 gen(rd());
  std::uniform_real_distribution<float> dis(0.0, 1.0);

  const std::string send_pipe = "/tmp/cpp2py";
  const std::string recv_pipe = "/tmp/py2cpp";
  if (std::filesystem::exists(send_pipe))
    std::filesystem::remove(send_pipe);
  int res = mkfifo(send_pipe.c_str(), 0666);
  std::cout << res << "\n";
  if (res < 0) {
    std::cerr << "make";
  }

  int send_fifo = open(send_pipe.c_str(), O_RDWR);
  if (send_fifo < 0) std::cerr << "open fatal";

  int recv_fifo = open(recv_pipe.c_str(), O_RDWR | O_NONBLOCK);


  while (true) {
    float a = dis(gen) * 10000, b = dis(gen) * 10000;
    std::string a_str = std::to_string(a);
    if (a_str.length() > 6)  a_str = a_str.substr(0, 6);
    std::string b_str = std::to_string(b);
    if (b_str.length() > 6)  b_str = b_str.substr(0, 6);
    auto start = std::chrono::steady_clock::now();

    std::string s = a_str + " " + b_str + "#";

    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    auto end = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count() / 1000.0;

    write(send_fifo, s.c_str(), s.length());

    char buf[1024];
    int len = read(recv_fifo, buf, 1024);
    if (len <= 0) continue;

    std::string received_data(buf, len);
    std::istringstream ss(received_data);
    std::string motor_name, setpoint_name, param_name, param_value; 
    ss >> motor_name >> setpoint_name >> param_name >> param_value;
    std::cout << motor_name << " " << setpoint_name << " " << param_name << " " << param_value << "\n";
  }

  close(send_fifo);
  close(recv_fifo);
  return 0;
}
