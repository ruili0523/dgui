export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

export function shortenDigest(digest: string): string {
  if (!digest) return '-'
  if (digest.startsWith('sha256:')) {
    return digest.substring(0, 19) + '...'
  }
  return digest.substring(0, 12) + '...'
}

export function parseDockerCommand(command: string): string {
  if (!command) return ''
  // 简化 Docker 命令显示
  return command
    .replace(/^\/bin\/sh -c /, '')
    .replace(/#\(nop\)\s+/, '')
    .trim()
}
