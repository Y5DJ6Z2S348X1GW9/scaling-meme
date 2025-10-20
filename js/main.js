// 主程序入口

document.addEventListener('DOMContentLoaded', function() {
    // 检查浏览器兼容性
    const compatibility = Utils.checkBrowserCompatibility();
    if (!compatibility.compatible) {
        alert(`您的浏览器不支持以下功能：${compatibility.missing.join(', ')}\n请使用现代浏览器访问。`);
        return;
    }

    // 初始化应用
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 显示加载状态
    Utils.showLoading(true, '正在初始化...');

    try {
        // 初始化各个模块（模块已在各自文件中自动初始化）
        
        // 加载用户偏好设置
        loadUserPreferences();

        // 初始化事件监听器
        initializeEventListeners();

        // 预加载资源
        preloadResources();

        // 检查URL参数
        handleURLParameters();

        // 显示欢迎信息
        showWelcomeMessage();

        Utils.showLoading(false);
        
    } catch (error) {
        console.error('应用初始化失败:', error);
        Utils.showLoading(false);
        Utils.showToast('应用初始化失败，请刷新页面重试', 'error');
    }
}

// 加载用户偏好设置
function loadUserPreferences() {
    // 加载主题
    const savedTheme = Utils.storage.get('theme');
    if (savedTheme && savedTheme !== 'auto') {
        document.body.classList.add(`${savedTheme}-theme`);
    }

    // 加载其他设置
    const preferences = Utils.storage.get('preferences', {
        outputFormat: 'jpg',
        disguiseImage: 'default',
        autoDownload: true,
        showNotifications: true
    });

    // 应用设置
    if (preferences.outputFormat) {
        const formatSelect = document.getElementById('outputFormat');
        if (formatSelect) formatSelect.value = preferences.outputFormat;
    }

    if (preferences.disguiseImage) {
        const imageSelect = document.getElementById('disguiseImageSelect');
        if (imageSelect) imageSelect.value = preferences.disguiseImage;
    }

    return preferences;
}

// 保存用户偏好设置
function saveUserPreferences() {
    const preferences = {
        outputFormat: document.getElementById('outputFormat').value,
        disguiseImage: document.getElementById('disguiseImageSelect').value,
        autoDownload: true,
        showNotifications: true,
        lastUsed: Date.now()
    };

    Utils.storage.set('preferences', preferences);
}

// 初始化事件监听器
function initializeEventListeners() {
    // 保存设置变更
    document.getElementById('outputFormat').addEventListener('change', saveUserPreferences);
    document.getElementById('disguiseImageSelect').addEventListener('change', saveUserPreferences);

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // 窗口大小变化
    window.addEventListener('resize', Utils.debounce(handleWindowResize, 300));

    // 页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 在线/离线状态
    window.addEventListener('online', () => Utils.showToast('已连接到网络', 'success'));
    window.addEventListener('offline', () => Utils.showToast('网络连接已断开', 'warning'));

    // 监听主题变化
    document.addEventListener('themechange', (e) => {
        console.log('主题已变更:', e.detail);
    });
}

// 键盘快捷键处理
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + O: 打开文件
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        document.getElementById('fileInput').click();
    }

    // Ctrl/Cmd + S: 开始处理
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const processBtn = document.getElementById('processBtn');
        if (processBtn && !processBtn.disabled) {
            processBtn.click();
        }
    }

    // Ctrl/Cmd + D: 清空文件列表
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) clearBtn.click();
    }

    // ESC: 关闭弹窗或取消操作
    if (e.key === 'Escape') {
        // 隐藏主题选择器
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector && themeSelector.style.display !== 'none') {
            themeSelector.style.display = 'none';
        }
    }

    // F1: 显示帮助
    if (e.key === 'F1') {
        e.preventDefault();
        window.uiController.switchPage('help');
    }
}

// 预加载资源
async function preloadResources() {
    const imagesToPreload = [
        'images/logo.png',
        'images/upload-icon.png',
        'images/batch-icon.png',
        'images/theme-icon.png',
        'images/preset-default.jpg',
        'images/preset-nature.jpg',
        'images/preset-abstract.jpg'
    ];

    // 预加载图片
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    // 预加载主题资源
    if (window.themeController) {
        window.themeController.preloadThemeAssets();
    }
}

// 处理URL参数
function handleURLParameters() {
    const params = new URLSearchParams(window.location.search);
    
    // 处理页面参数
    const page = params.get('page');
    if (page && window.uiController) {
        window.uiController.switchPage(page);
    }

    // 处理主题参数
    const theme = params.get('theme');
    if (theme && window.themeController) {
        window.themeController.applyTheme(theme);
    }

    // 处理调试模式
    if (params.get('debug') === 'true') {
        window.DEBUG_MODE = true;
        console.log('调试模式已启用');
    }
}

// 处理窗口大小变化
function handleWindowResize() {
    // 更新UI布局
    const width = window.innerWidth;
    
    if (width < 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
}

// 处理页面可见性变化
function handleVisibilityChange() {
    if (document.hidden) {
        // 页面不可见时暂停某些操作
        console.log('页面已隐藏');
    } else {
        // 页面可见时恢复操作
        console.log('页面已显示');
    }
}

// 显示欢迎信息
function showWelcomeMessage() {
    const lastVisit = Utils.storage.get('lastVisit');
    const now = Date.now();
    
    if (!lastVisit) {
        // 首次访问
        Utils.showToast('欢迎使用文件伪装大师！', 'info', 5000);
        
        // 显示新手引导
        setTimeout(() => {
            if (confirm('是否需要查看使用指南？')) {
                window.uiController.switchPage('help');
            }
        }, 1000);
    } else if (now - lastVisit > 7 * 24 * 60 * 60 * 1000) {
        // 超过7天未访问
        Utils.showToast('欢迎回来！', 'info');
    }
    
    Utils.storage.set('lastVisit', now);
}

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
    
    if (window.DEBUG_MODE) {
        Utils.showToast(`错误: ${event.error.message}`, 'error', 5000);
    }
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
    
    if (window.DEBUG_MODE) {
        Utils.showToast(`Promise错误: ${event.reason}`, 'error', 5000);
    }
});

// 页面卸载前保存状态
window.addEventListener('beforeunload', function(event) {
    // 保存用户偏好
    saveUserPreferences();
    
    // 如果有正在处理的文件，提示用户
    if (window.fileHandler && window.fileHandler.hasProcessingFiles()) {
        event.preventDefault();
        event.returnValue = '有文件正在处理中，确定要离开吗？';
    }
});

// 导出全局API
window.FileDisguiseApp = {
    version: '1.0.0',
    
    // 文件处理
    addFile: (file) => window.fileHandler.addFile(file),
    processFiles: () => window.uiController.processFiles(),
    clearFiles: () => window.uiController.clearFileList(),
    
    // 主题控制
    setTheme: (theme) => window.themeController.applyTheme(theme),
    toggleTheme: () => window.themeController.toggleTheme(),
    
    // 页面导航
    switchPage: (page) => window.uiController.switchPage(page),
    
    // 工具函数
    utils: Utils,
    
    // 调试功能
    debug: {
        getState: () => ({
            files: window.fileHandler.getAllFiles(),
            theme: window.themeController.currentTheme,
            preferences: Utils.storage.get('preferences'),
            history: window.historyManager.getHistory()
        }),
        
        reset: () => {
            if (confirm('确定要重置所有数据吗？')) {
                Utils.storage.clear();
                location.reload();
            }
        }
    }
};

console.log('文件伪装大师已就绪！版本:', window.FileDisguiseApp.version);
