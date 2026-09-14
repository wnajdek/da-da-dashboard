import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

await run(command, ['tsc', '--project', 'tsconfig.definition.json']);
await run(process.execPath, [
  'scripts/write-widget-manifest.mjs',
  'out-tsc/widget-definition/widget.definition.js',
  'public/widget-manifest.json',
]);

console.log('Widget Manifest URL: http://localhost:4201/widget-manifest.json');
const server = spawn(command, [
  'ng',
  'serve',
  '--host',
  'localhost',
  '--port',
  '4201',
  '--headers',
  'Access-Control-Allow-Origin=*',
], { stdio: 'inherit' });
server.once('exit', (code) => { process.exitCode = code ?? 1; });

function run(command, arguments_) {
  return new Promise((resolveRun, rejectRun) => {
    const process = spawn(command, arguments_, { stdio: 'inherit' });
    process.once('error', rejectRun);
    process.once('exit', (code) => code === 0 ? resolveRun() : rejectRun(new Error(`Command failed: ${command} ${arguments_.join(' ')}`)));
  });
}
