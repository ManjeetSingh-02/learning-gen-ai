function getPreferredTools() {
  return {
    vscode: {
      use: 'coding',
      tool: 'vscode ide',
    },
    postman: {
      use: 'api testing',
      tool: 'postman app',
    },
    git: {
      use: 'version control',
      tool: 'git cli',
    },
    github: {
      use: 'version control',
      tool: 'github web app',
      },
    docker: {
      use: 'containerization',
      tool: 'docker desktop app/cli',
    },
  };
}
