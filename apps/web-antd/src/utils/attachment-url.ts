/** 从上传接口响应中提取持久化访问地址 */
export function extractUploadUrl(result: unknown): string {
  if (!result) {
    return '';
  }
  if (typeof result === 'string') {
    return result;
  }
  if (typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (typeof obj.url === 'string') {
      return obj.url;
    }
    if (typeof obj.data === 'string') {
      return obj.data;
    }
  }
  return '';
}

/** 从上传接口响应中提取存储路径 */
export function extractUploadPath(result: unknown): string {
  if (result && typeof result === 'object') {
    const path = (result as Record<string, unknown>).path;
    if (typeof path === 'string') {
      return path;
    }
  }
  return '';
}

interface AttachmentUrlSource {
  filePath?: string;
  fileUrl?: string;
}

/** 提取 infra 文件接口的同源访问路径 */
function extractInfraFilePath(url: string): string | null {
  const index = url.indexOf('/admin-api/infra/file/');
  if (index === -1) {
    return null;
  }
  return url.slice(index);
}

/** 预览/下载时优先使用上传时保存的 fileUrl */
export function resolveAttachmentAccessUrl(
  attachment: AttachmentUrlSource,
): string {
  const candidates = [attachment.fileUrl, attachment.filePath].filter(
    Boolean,
  ) as string[];

  for (const raw of candidates) {
    if (raw.startsWith('blob:')) {
      continue;
    }

    const infraPath = extractInfraFilePath(raw);
    if (infraPath) {
      return `${window.location.origin}${infraPath}`;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    if (raw.startsWith('/')) {
      return `${window.location.origin}${raw}`;
    }
    return raw;
  }
  return '';
}

/** 是否为无效的 blob 临时地址 */
export function isBlobAttachmentUrl(url?: string): boolean {
  return !!url && url.startsWith('blob:');
}

/** 下载附件：fetch 为 blob 后触发浏览器保存 */
export async function downloadAttachmentFile(
  attachment: AttachmentUrlSource & { fileName: string },
): Promise<void> {
  const url = resolveAttachmentAccessUrl(attachment);
  if (!url) {
    throw new Error('INVALID_URL');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = attachment.fileName || 'download';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
}
