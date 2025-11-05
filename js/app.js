// 全局变量
let uploadedImages = [];
let apiKey = localStorage.getItem('volcanoApiKey') || '';

// DOM元素
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const selectFilesBtn = document.getElementById('select-files-btn');
const previewContainer = document.getElementById('preview-container');
const imagePreviewGrid = document.getElementById('image-preview-grid');
const imageCount = document.getElementById('image-count');
const addMoreBtn = document.getElementById('add-more-btn');
const analyzeBtn = document.getElementById('analyze-btn');
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');
const loadingSection = document.getElementById('loading-section');
const restartBtn = document.getElementById('restart-btn');
const shareBtn = document.getElementById('share-btn');
const saveApiKeyBtn = document.getElementById('save-api-key');
const apiKeyInput = document.getElementById('api-key');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查API密钥
    if (!apiKey) {
        showApiConfigModal();
    }
    
    // 设置事件监听器
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 拖放区域事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    // 按钮点击事件
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    addMoreBtn.addEventListener('click', () => fileInput.click());
    analyzeBtn.addEventListener('click', startAnalysis);
    restartBtn.addEventListener('click', resetApp);
    shareBtn.addEventListener('click', shareResults);
    saveApiKeyBtn.addEventListener('click', saveApiKey);
}

// 阻止默认行为
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 高亮拖放区域
function highlight() {
    dropArea.classList.add('highlight');
}

// 取消高亮拖放区域
function unhighlight() {
    dropArea.classList.remove('highlight');
}

// 处理拖放
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('请选择图片文件');
        return;
    }
    
    // 添加到已上传图片数组
    imageFiles.forEach(file => {
        // 检查是否已存在相同文件
        const exists = uploadedImages.some(img => 
            img.name === file.name && 
            img.size === file.size && 
            img.lastModified === file.lastModified
        );
        
        if (!exists) {
            uploadedImages.push(file);
        }
    });
    
    // 更新预览
    updateImagePreview();
}

// 更新图片预览
function updateImagePreview() {
    // 清空预览区域
    imagePreviewGrid.innerHTML = '';
    
    // 更新图片计数
    imageCount.textContent = uploadedImages.length;
    
    // 显示预览容器
    if (uploadedImages.length > 0) {
        previewContainer.classList.remove('d-none');
    } else {
        previewContainer.classList.add('d-none');
    }
    
    // 为每张图片创建预览
    uploadedImages.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = '预览图片';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', () => deleteImage(index));
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(deleteBtn);
            imagePreviewGrid.appendChild(previewDiv);
        };
        
        reader.readAsDataURL(file);
    });
    
    // 更新分析按钮状态
    updateAnalyzeButtonState();
}

// 删除图片
function deleteImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

// 更新分析按钮状态
function updateAnalyzeButtonState() {
    if (uploadedImages.length >= 5 && uploadedImages.length <= 20 && apiKey) {
        analyzeBtn.disabled = false;
    } else {
        analyzeBtn.disabled = true;
    }
}

// 开始分析
function startAnalysis() {
    // 检查API密钥
    if (!apiKey) {
        showApiConfigModal();
        return;
    }
    
    // 检查图片数量
    if (uploadedImages.length < 5) {
        alert('请至少上传5张图片');
        return;
    }
    
    if (uploadedImages.length > 20) {
        alert('最多只能上传20张图片');
        return;
    }
    
    // 显示加载中
    uploadSection.classList.add('d-none');
    loadingSection.classList.remove('d-none');
    
    // 准备图片数据
    const promises = uploadedImages.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => {
                // 获取base64编码的图片数据
                const base64Data = e.target.result.split(',')[1];
                resolve(base64Data);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // 处理所有图片
    Promise.all(promises)
        .then(base64Images => {
            // 调用API
            return callVolcanoAPI(base64Images);
        })
        .then(result => {
            // 处理API返回结果
            processAnalysisResult(result);
            
            // 显示结果页面
            loadingSection.classList.add('d-none');
            resultSection.classList.remove('d-none');
        })
        .catch(error => {
            console.error('分析过程中出错:', error);
            alert('分析过程中出错，请重试');
            
            // 返回上传页面
            loadingSection.classList.add('d-none');
            uploadSection.classList.remove('d-none');
        });
}

// 调用火山引擎API
async function callVolcanoAPI(base64Images) {
    // 这里是模拟API调用，实际项目中需要替换为真实的API调用
    // 由于没有实际的API密钥和接口，这里使用模拟数据
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 返回模拟数据
    return {
        personality: {
            tags: ['温柔', '理性', '好学'],
            description: '善于分享生活，对事物充满好奇，理性思考问题，文字表达能力强。'
        },
        interests: ['旅行', '美食', '科技', '艺术'],
        pursuitSuggestions: [
            '分享自己的旅行经历中的小故事',
            '评论美食照片中的亮点和特色',
            '一起探讨科技话题的新进展',
            '关注对方的艺术品味和审美偏好'
        ],
        chatTopics: [
            '旅行中的有趣趣事',
            'Pokemon的收藏',
            'AI无人驾驶的看法',
            '皮克斯电影的画面风格'
        ],
        dateSuggestions: [
            '动漫主题咖啡厅',
            '科技展览参观',
            '艺术画廊或工作室',
            '尝试新开的网红餐厅'
        ]
    };
    
    // 实际API调用代码（需要替换为实际的API端点和参数）
    /*
    try {
        const response = await fetch('https://api.volcengine.com/doubao/v1.6/thinking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                images: base64Images,
                prompt: '分析这些朋友圈图片，推测用户的性格特点、兴趣爱好，并提供社交互动建议'
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API调用出错:', error);
        throw error;
    }
    */
}

// 处理分析结果
function processAnalysisResult(result) {
    // 处理性格特质
    const personalityTags = document.getElementById('personality-tags');
    personalityTags.innerHTML = '';
    
    result.personality.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag tag-personality';
        tagElement.textContent = tag;
        personalityTags.appendChild(tagElement);
    });
    
    document.getElementById('personality-description').textContent = result.personality.description;
    
    // 处理兴趣爱好
    const interestTags = document.getElementById('interest-tags');
    interestTags.innerHTML = '';
    
    result.interests.forEach(interest => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag tag-interest';
        tagElement.textContent = interest;
        interestTags.appendChild(tagElement);
    });
    
    // 处理追求建议
    const pursuitSuggestions = document.getElementById('pursuit-suggestions');
    pursuitSuggestions.innerHTML = '';
    
    result.pursuitSuggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        pursuitSuggestions.appendChild(li);
    });
    
    // 处理聊天话题
    const chatTopics = document.getElementById('chat-topics');
    chatTopics.innerHTML = '';
    
    result.chatTopics.forEach(topic => {
        const li = document.createElement('li');
        li.textContent = topic;
        chatTopics.appendChild(li);
    });
    
    // 处理约会建议
    const dateSuggestions = document.getElementById('date-suggestions');
    dateSuggestions.innerHTML = '';
    
    result.dateSuggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        dateSuggestions.appendChild(li);
    });
}

// 重置应用
function resetApp() {
    // 清空上传的图片
    uploadedImages = [];
    
    // 重置UI
    imagePreviewGrid.innerHTML = '';
    imageCount.textContent = '0';
    previewContainer.classList.add('d-none');
    resultSection.classList.add('d-none');
    uploadSection.classList.remove('d-none');
    
    // 重置分析按钮状态
    updateAnalyzeButtonState();
}

// 分享结果
function shareResults() {
    // 这里可以实现分享功能，如生成图片或链接
    alert('分享功能开发中...');
}

// 显示API配置模态框
function showApiConfigModal() {
    const apiConfigModal = new bootstrap.Modal(document.getElementById('apiConfigModal'));
    apiKeyInput.value = apiKey;
    apiConfigModal.show();
}

// 保存API密钥
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    
    if (newApiKey) {
        apiKey = newApiKey;
        localStorage.setItem('volcanoApiKey', apiKey);
        
        // 关闭模态框
        const apiConfigModal = bootstrap.Modal.getInstance(document.getElementById('apiConfigModal'));
        apiConfigModal.hide();
        
        // 更新分析按钮状态
        updateAnalyzeButtonState();
    } else {
        alert('请输入有效的API密钥');
    }
}