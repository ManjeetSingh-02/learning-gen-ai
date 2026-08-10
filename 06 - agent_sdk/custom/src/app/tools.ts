// internal-imports
import type { ITool } from '../core/types.js';

// external-imports
import axios from 'axios';
import { exec } from 'child_process';

// tool to get the current weather for a given location
export const weatherTool: ITool = {
  name: 'weather',
  desc: 'Get the current weather for a given location.',
  doc: 'weather(location: string)',
  async exec(location) {
    const response = await axios.get(`https://wttr.in/${location}?format=%C+%t`);
    return JSON.stringify({ location, weather: response.data });
  },
};

// tool to execute a command in the terminal
export const cliTool: ITool = {
  name: 'cli',
  desc: 'Execute a command in the terminal.',
  doc: 'cli(command: string)',
  async exec(command) {
    return new Promise(resolve =>
      exec(command, (error, stdout) => {
        if (error) return resolve(`Error: ${error.message}`);
        else return resolve(stdout);
      })
    );
  },
};
