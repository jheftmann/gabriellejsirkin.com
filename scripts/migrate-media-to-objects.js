#!/usr/bin/env node
'use strict';

// Converts legacy bare-string media items to object form so the CMS can
// save caption/bts properties on each item.
//
//   media:
//     - 01_foo.jpg                →     - file: 01_foo.jpg
//     - 02_bar.jpg                        caption: ""
//                                         bts: false
//                                       - file: 02_bar.jpg
//                                         caption: ""
//                                         bts: false

const fs   = require('fs');
const path = require('path');

const dir = 'content/projects';
const slugs = fs.readdirSync(dir)
  .filter(d => !d.startsWith('_') && fs.statSync(path.join(dir, d)).isDirectory())
  .filter(d => fs.existsSync(path.join(dir, d, 'index.md')));

let updated = 0;
for (const slug of slugs) {
  const mdPath = path.join(dir, slug, 'index.md');
  const text = fs.readFileSync(mdPath, 'utf8');

  // Find media: block — everything from "media:" until the next top-level key or end of frontmatter
  const m = text.match(/^(media:\s*\n)((?:[ \t]+.*\n?)+)/m);
  if (!m) continue;

  const blockHeader = m[1];
  const blockBody   = m[2];

  // Quick check: any line that's "- value" (not "- file:")
  const hasBareStrings = /^[ \t]+-[ \t]+(?!file:|caption:|bts:|\{)\S/m.test(blockBody);
  if (!hasBareStrings) continue;

  // Transform bare-string items into object items
  const indent = (blockBody.match(/^([ \t]+)-/m) || ['', '  '])[1];
  const itemIndent = indent + '  ';

  const newBody = blockBody.replace(
    /^([ \t]+)-[ \t]+(?!file:|caption:|bts:|\{)(.+)$/gm,
    (_line, lineIndent, val) => {
      let v = val.trim();
      if ((v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return `${lineIndent}- file: ${v}\n${lineIndent}  caption: ""\n${lineIndent}  bts: false`;
    }
  );

  if (newBody === blockBody) continue;

  fs.writeFileSync(mdPath, text.replace(blockBody, newBody));
  console.log(`  migrated: ${slug}`);
  updated++;
}

console.log(`\nDone — ${updated} / ${slugs.length} projects updated.`);
