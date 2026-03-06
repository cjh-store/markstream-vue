export default {
  branches: ['main'],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      // 支持 emoji 前缀的 commit 格式，如 "🐛 fix(parser): xxx"
      parserOpts: {
        headerPattern: /^(?:.*\s)?(\w+)(?:\(([^)]*)\))?!?:\s(.*)$/,
        headerCorrespondence: ['type', 'scope', 'subject'],
      },
      releaseRules: [
        { type: 'feat', release: 'minor' },
        { type: 'fix', release: 'patch' },
        { type: 'perf', release: 'patch' },
        { type: 'revert', release: 'patch' },
        { type: 'refactor', release: 'patch' },
      ],
    }],
    ['@semantic-release/release-notes-generator', {
      parserOpts: {
        headerPattern: /^(?:.*\s)?(\w+)(?:\(([^)]*)\))?!?:\s(.*)$/,
        headerCorrespondence: ['type', 'scope', 'subject'],
      },
    }],
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
    }],
    ['@semantic-release/npm', {
      npmPublish: false,
    }],
    ['@semantic-release/exec', {
      publishCmd: 'pnpm publish --no-git-checks --access public',
    }],
    '@semantic-release/github',
    ['@semantic-release/git', {
      assets: ['package.json', 'CHANGELOG.md'],
      message: 'chore(release): ${nextRelease.version} [skip ci]',
    }],
  ],
}
