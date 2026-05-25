const fs = require('fs');
const path = require('path');

// 要修复的文件路径
const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Index.tsx');

// 读取文件内容
fs.readFile(filePath, 'utf8', (err, content) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }

  // 修复Unicode转义序列
  const fixedContent = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // 写入修复后的内容
  fs.writeFile(filePath, fixedContent, 'utf8', (err) => {
    if (err) {
      console.error('写入文件失败:', err);
      return;
    }
    console.log('修复成功！已将Unicode转义序列转换为正常中文字符');
  });
});
