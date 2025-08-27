module.exports = {
  apps: [{
    name: 'field-tracker-api',
    script: 'server.js',
    instances: 1, // Start with 1 instance for debugging
    exec_mode: 'fork', // Use fork mode instead of cluster for debugging
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 5000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
