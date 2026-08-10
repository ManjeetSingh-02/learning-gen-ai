import axios from 'axios';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { exec } from 'child_process';

export const weatherTool = tool({
  name: 'weather',
  description: 'Get the current weather for a given location',
  parameters: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    const response = await axios.get(`https://wttr.in/${location}?format=%C+%t`);
    return JSON.stringify({ location, weather: response.data });
  },
});

export const cliTool = tool({
  name: 'cli',
  description: 'Execute a command in the terminal',
  parameters: z.object({ command: z.string() }),
  execute: async ({ command }) =>
    new Promise(resolve =>
      exec(command, (error, stdout) => {
        if (error) return resolve(`Error: ${error.message}`);
        else return resolve(stdout);
      })
    ),
});
