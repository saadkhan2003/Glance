import { cpSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const standalone=path.resolve('.next/standalone');
if(!existsSync(path.join(standalone,'server.js'))) throw new Error('Run npm run build first.');
const context=mkdtempSync(path.join(tmpdir(),'jev-image-'));
try {
  cpSync(standalone,context,{recursive:true});
  cpSync('.next/static',path.join(context,'.next/static'),{recursive:true});
  cpSync('public',path.join(context,'public'),{recursive:true});
  writeFileSync(path.join(context,'.dockerignore'),'.env\n.env.*\n.data\n');
  writeFileSync(path.join(context,'Dockerfile'),`FROM node:24.21.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN mkdir -p /app/.data/ai-budget && chown -R node:node /app
COPY --chown=node:node . .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
`);
  const result=spawnSync('docker',['build','-t',process.env.IMAGE_TAG || 'jev-interfaces:hackathon',context],{stdio:'inherit'});
  if(result.error) throw result.error;
  process.exitCode=result.status ?? 1;
} finally { rmSync(context,{recursive:true,force:true}); }
