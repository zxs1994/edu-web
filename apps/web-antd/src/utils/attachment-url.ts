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

/** 支持在线预览的纯文本扩展名 */
const TEXT_PREVIEW_EXTENSIONS = new Set([
  'txt',
  'log',
  'md',
  'csv',
  'json',
  'xml',
  'properties',
  'ini',
]);

/** 是否为可在线预览的纯文本附件 */
export function isTextPreviewFile(attachment: {
  fileExtension?: string;
  fileName?: string;
}): boolean {
  const ext = (
    attachment.fileExtension ||
    attachment.fileName?.split('.').pop() ||
    ''
  ).toLowerCase();
  return TEXT_PREVIEW_EXTENSIONS.has(ext);
}

/** 解码文本内容：优先 UTF-8，必要时回退 GBK */
function decodeTextContent(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }
  const utf8Text = new TextDecoder('utf-8').decode(buffer);
  try {
    const gbkText = new TextDecoder('gbk').decode(buffer);
    if (scoreTextReadability(gbkText) > scoreTextReadability(utf8Text)) {
      return gbkText;
    }
  } catch {
    // 浏览器不支持 gbk 解码时沿用 UTF-8
  }
  return utf8Text;
}

/** 文本可读性评分：中文越多、乱码替换符越少越好 */
function scoreTextReadability(text: string): number {
  const cjkCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  return cjkCount * 2 - replacementCount * 10;
}

/** 纯文本附件预览：fetch 后按正确编码生成 blob 再打开 */
export async function previewTextAttachment(
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
  const buffer = await response.arrayBuffer();
  const text = decodeTextContent(buffer);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank');
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
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
