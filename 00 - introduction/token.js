import { get_encoding } from 'tiktoken';

const encoderForGPT2 = get_encoding('gpt2');
const stringToEncode = 'Good day for you!';

const encodedStr = encoderForGPT2.encode(stringToEncode);
console.log(encodedStr);
console.log(new TextEncoder().encode(stringToEncode));

const decodedStr = encoderForGPT2.decode(encodedStr);
console.log(decodedStr);
console.log(new TextDecoder().decode(decodedStr));
