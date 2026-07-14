import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = {
  intro: '01-foundations/intro', journey: '01-foundations/journey', t1: '01-foundations/t1',
  t2: '01-foundations/t2', t3: '01-foundations/t3', t4: '01-foundations/t4',
  t9: '02-update-pipeline/t9', t13: '02-update-pipeline/t13', t12: '02-update-pipeline/t12',
  t8: '02-update-pipeline/t8', t5: '02-update-pipeline/t5', t7: '02-update-pipeline/t7',
  t6: '02-update-pipeline/t6', t10: '02-update-pipeline/t10', t11: '02-update-pipeline/t11',
  t14: '03-concurrent/t14', t15: '03-concurrent/t15', t16: '03-concurrent/t16',
  t17: '03-concurrent/t17', t18: '03-concurrent/t18', t19: '03-concurrent/t19',
  t20: '04-advanced/t20', t21: '04-advanced/t21', t22: '04-advanced/t22',
  t23: '04-advanced/t23', t24: '04-advanced/t24', t25: '04-advanced/t25',
  t26: '04-advanced/t26', t27: '04-advanced/t27', t28: '04-advanced/t28',
  ctx: '05-core-topics/ctx', ref: '05-core-topics/ref', pk: '06-source-reading/pk',
  boot: '06-source-reading/boot', obj: '06-source-reading/obj', source: '06-source-reading/source',
  main: '06-source-reading/main',
};

for (const [chapter, route] of Object.entries(routes)) {
  const filename = path.join(root, 'docs', `${route}.mdx`);
  const current = await readFile(filename, 'utf8');
  const frontmatter = current.match(/^---\n[\s\S]*?\n---/)?.[0];
  if (!frontmatter) throw new Error(`${route}.mdx 缺少 frontmatter`);
  await writeFile(filename, `${frontmatter}\n\nimport { EmbeddedChapter } from '../../theme/EmbeddedChapter';\n\n<EmbeddedChapter chapter="${chapter}" />\n`);
}

console.log(`已将 ${Object.keys(routes).length} 个 Rspress 路由切换为嵌入式章节。`);
