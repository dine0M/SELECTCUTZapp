import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const output = join(root, 'hosting-package');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, 'www'), output, { recursive: true });
await cp(join(root, 'backend', 'api'), join(output, 'api'), { recursive: true });
await mkdir(join(output, 'api', 'uploads'), { recursive: true });
await cp(join(root, 'backend', 'db.php'), join(output, 'db.php'));
await cp(join(root, 'deployment', '.htaccess'), join(output, '.htaccess'));

console.log('Hosting package created at hosting-package/');
console.log('Update hosting-package/db.php with the live database credentials before upload.');
