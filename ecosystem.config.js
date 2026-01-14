module.exports = {
  apps: [{
    name: 'ostour',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: '/home/ostour/birding',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ostour/logs/err.log',
    out_file: '/home/ostour/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
