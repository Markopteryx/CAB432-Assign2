import http from 'k6/http';
import { sleep } from 'k6';
  
const binFile = open('fast_cube.blend', 'b');

export let options = {
    duration : '1m',
    vus : 500,
};
  
export default function () {
    const data = {
      file: http.file(binFile, 'fast_cube.blend'),
    };
  
    const res = http.post('http://n8039062-load-balancer-580147612.ap-southeast-2.elb.amazonaws.com:8000/uploadBlends', data);
    sleep(3);
  }

// k6 run backendTesting.js