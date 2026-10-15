import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom (used by Jest in react-scripts) doesn't provide these.
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
