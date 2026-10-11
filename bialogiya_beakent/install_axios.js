const cp = require('child_process');
const r = cp.spawnSync('npm', ['install', 'axios'], {
  cwd: 'c:/Users/abdul/OneDrive/Desktop/Abdora-ai-main/bialogiya_beakent',
  stdio: 'pipe',
  shell: true
});
console.log(r.stdout.toString());
console.error(r.stderr.toString());
process.exit(r.status || 0);
