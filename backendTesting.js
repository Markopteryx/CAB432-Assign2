import http from 'k6/http';
import { sleep } from 'k6';
  
const binFile = open('fast_cube.blend', 'b');

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 30,
      maxVUs: 50,
    },
  },
};

export default function () {
    const data = {
      file: http.file(binFile, 'fast_cube.blend'),
    };
  
    const res = http.post('http://n8039062-load-balancer-580147612.ap-southeast-2.elb.amazonaws.com:8000/uploadBlends', data);
    sleep(3);
  }

// k6 run backendTesting.js