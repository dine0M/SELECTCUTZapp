import { spawn } from 'node:child_process';
import { join } from 'node:path';

const ngExecutable = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== '--strictPort');
const child = spawn(ngExecutable, ['serve', ...forwardedArgs], { stdio: 'inherit', shell: process.platform === 'win32' });

child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
