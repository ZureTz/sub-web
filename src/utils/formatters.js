/**
 * 格式化错误消息
 * @param {Error|string} error - 错误对象或字符串
 * @returns {string} 格式化后的错误消息
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "操作失败，请重试";
};

/**
 * 清理版本信息格式
 * 兼容两种后端响应：
 *  1. 旧版纯文本，例如 "subconverter v0.x.x backend\n"
 *  2. 新版 HTML 页面（SubConverter-Extended），从中提取项目名与版本号
 * @param {string} version - 原始版本信息
 * @returns {string} 清理后的版本信息
 */
export const formatVersion = (version) => {
  if (typeof version !== "string" || !version) return "";

  // 新版后端返回 HTML，尝试从中解析项目名与版本号
  if (/<\s*html|<\s*div|<\s*h1/i.test(version)) {
    const stripTags = (s) => s.replace(/<[^>]+>/g, "").trim();

    const titleMatch = version.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    // 在 "Version" 标签后查找形如 v1.0.20 的版本号
    let ver = "";
    const versionBlock = version.match(
      /Version[\s\S]*?<div[^>]*class=["'][^"']*info-value[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );
    if (versionBlock) {
      ver = stripTags(versionBlock[1]);
    } else {
      const semverMatch = version.match(/v\d+\.\d+\.\d+/);
      if (semverMatch) ver = semverMatch[0];
    }

    return [title, ver].filter(Boolean).join(" ");
  }

  // 旧版纯文本
  let cleaned = version.replace(/backend\n$/gm, "");
  cleaned = cleaned.replace("subconverter", "");
  return cleaned.trim();
};

/**
 * 处理订阅链接（去除换行符）
 * @param {string} url - 原始订阅链接
 * @returns {string} 处理后的订阅链接
 */
export const processSubUrl = (url) => {
  return url.replace(/(\n|\r|\n\r)/g, "|");
};
