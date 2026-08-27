function getPreferredFrameworks() {
  return {
    react: {
      use: 'frontend/web',
      tool: 'vite',
    },
    expo: {
      use: 'frontend/mobile',
      tool: 'heroui-cli/expo-cli',
    },
    express: {
      use: 'backend',
      tool: 'node',
    },
  };
}
