const maxDataPoints = 100;
const ctx = document.getElementById('waveform').getContext('2d');
var scrollRange = document.getElementById('scrollRange');
let scrollPosition = 0;
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Set Data',
                data: [],
                borderColor: 'red',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Feedback Data',
                data: [],
                borderColor: 'blue',
                fill: false,
                tension: 0.4
            }
        ]
    },
    options: {
      maintainAspectRatio: false,
      width: 1000, 
      height: 800, 
      responsive: false,
      animation: false,
      scales: {
          x: {
              display: false
          },
          y: {
            min: 1,
            max: 10000
          }
      },
      plugins: {
          zoom: {
              pan: {
                  enabled: true,
                  mode: 'x',
                  onPan: function({chart}) {
                      scrollPosition = chart.scales['x-axis-0'].min;
                  }
              },
              limits: {
                  x: { minRange: 0.1 }
              }
          }
      }
    }
});


console.log("scrollRange.value" + scrollRange.value)
scrollRange.value = scrollRange.max;
console.log("scrollRange.max" + scrollRange.getAttribute("max"))

const historyData = []

const eventSource = new EventSource('/motordata_stream');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);

  historyData.push(data);

  scrollRange.value = scrollRange.max;
  
  chart.data.labels = historyData.slice(-maxDataPoints).map(data => data.timestamp);
  chart.data.datasets[0].data = historyData.slice(-maxDataPoints).map(data => ({ x: data.timestamp, y: data.set_data }));
  chart.data.datasets[1].data = historyData.slice(-maxDataPoints).map(data => ({ x: data.timestamp, y: data.feedback_data }));

  chart.update();
};


scrollRange.addEventListener('input', function () {
  const scrollPosition = parseInt(scrollRange.value) / 100;

  const startIndex = Math.max(0, Math.floor(scrollPosition * historyData.length) - maxDataPoints);
  const endIndex = Math.min(startIndex + maxDataPoints, historyData.length);

  const labels = historyData.slice(startIndex, endIndex).map(data => data.timestamp);
  const set_data = historyData.slice(startIndex, endIndex).map(data => ({ x: data.timestamp, y: data.set_data }));
  const feedback_data = historyData.slice(startIndex, endIndex).map(data => ({ x: data.timestamp, y: data.feedback_data }));

  chart.data.labels = labels;
  chart.data.datasets[0].data = set_data;
  chart.data.datasets[1].data = feedback_data;

  chart.update();
});
  
fetch('/motors_parameters')
    .then(response => response.json())
    .then(data => {
        const motorsContainer = document.getElementById('motors-container');

        for (const motorName in data) {
            const motorData = data[motorName];

            const motorContainer = document.createElement('div');
            motorContainer.classList.add('motor');

            const motorTitle = document.createElement('h2');
            motorTitle.textContent = motorName;
            motorContainer.appendChild(motorTitle);

            for (const setpointName in motorData) {
                const setpointData = motorData[setpointName];

                const setpointContainer = document.createElement('div');

                const setpointLabel = document.createElement('label');
                setpointLabel.innerHTML = setpointName + '<br>';
                setpointContainer.appendChild(setpointLabel);

                for (const paramName in setpointData) {
                    const paramData = setpointData[paramName];

                    const paramInput = document.createElement('input');
                    paramInput.type = 'range';
                    paramInput.id = motorName + '-' + setpointName + '-' + paramName;
                    paramInput.min = paramData.min;
                    paramInput.max = paramData.max;
                    paramInput.step = 0.01;
                    paramInput.value = paramData.initial;

                    const paramValue = document.createElement('span');
                    paramValue.id = motorName + '-' + setpointName + '-' + paramName + '-value';
                    paramValue.textContent = paramData.initial;

                    setpointContainer.appendChild(paramInput);
                    setpointContainer.appendChild(paramValue);

                    paramInput.addEventListener('input', function() {
                        paramValue.textContent = paramInput.value;
                    });

                    paramInput.addEventListener('input', function() {
                        paramValue.textContent = paramInput.value;
                        updateMotorParameter(motorName, setpointName, paramName, paramInput.value);
                    });
                }

                motorContainer.appendChild(setpointContainer);
            }

            motorsContainer.appendChild(motorContainer);
        }
    });

    function updateMotorParameter(motorName, setpointName, paramName, paramValue) {
        const xhr = new XMLHttpRequest();
        const url = '/update_parameter'; 
        const data = {
            'motor_name': motorName,
            'setpoint_name': setpointName,
            'param_name': paramName,
            'param_value': paramValue
        };
        const jsonData = JSON.stringify(data); 
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.onload = function() {
            if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                console.log('Update succeeded');
            }
            else {
                console.log('Update failed');
            }
        };
        xhr.send(jsonData); 
    }




