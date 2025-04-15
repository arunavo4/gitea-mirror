import axios from 'axios';

// GitHub API
export const githubApi = {
  testConnection: async (token: string, username?: string) => {
    const response = await axios.post('/api/github/test-connection', {
      token,
      username,
    });
    return response.data;
  },
};

// Gitea API
export const giteaApi = {
  testConnection: async (url: string, token: string, username?: string) => {
    const response = await axios.post('/api/gitea/test-connection', {
      url,
      token,
      username,
    });
    return response.data;
  },
};

// Config API
export const configApi = {
  saveConfig: async (config: {
    githubConfig: any;
    giteaConfig: any;
    scheduleConfig: any;
  }) => {
    const response = await axios.post('/api/config/save', config);
    return response.data;
  },
};
