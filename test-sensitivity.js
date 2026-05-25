// 测试敏感词检测功能
const content = "测试敏感词";
const contentType = "text";

// 简化处理，直接检查内容是否包含"敏感词"字符串
const isViolation = contentType === 'text' && content && content.includes('敏感词');

console.log('测试内容:', content);
console.log('是否包含敏感词:', isViolation);
