// 拖拽功能模块

class DragDropHandler {
    constructor() {
        this.dropZones = new Map();
        this.dragCounter = 0;
        this.currentDropZone = null;
        this.dragHint = null;
        this.initialize();
    }

    // 初始化拖拽功能
    initialize() {
        // 创建拖拽提示元素
        this.createDragHint();

        // 防止浏览器默认拖拽行为
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());

        // 注册默认拖拽区域
        this.registerDefaultDropZones();
    }

    // 创建拖拽提示
    createDragHint() {
        this.dragHint = document.createElement('div');
        this.dragHint.className = 'drag-hint';
        this.dragHint.textContent = '松开以上传文件';
        document.body.appendChild(this.dragHint);
    }

    // 注册默认拖拽区域
    registerDefaultDropZones() {
        // 主上传区域
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            this.registerDropZone('main-upload', uploadArea, {
                onDrop: (files) => window.uiController.handleFileSelect(files),
                acceptedTypes: [...window.fileHandler.supportedArchiveFormats, ...window.fileHandler.supportedVideoFormats],
                hintText: '拖拽压缩包或视频文件到这里'
            });
        }

        // 批量上传区域
        const batchUpload = document.getElementById('batchUpload');
        if (batchUpload) {
            this.registerDropZone('batch-upload', batchUpload, {
                onDrop: (files) => window.uiController.handleBatchSelect(files),
                acceptedTypes: [...window.fileHandler.supportedArchiveFormats, ...window.fileHandler.supportedVideoFormats],
                hintText: '拖拽多个文件进行批量处理'
            });
        }

        // 全局拖拽
        this.registerGlobalDragDrop();
    }

    // 注册拖拽区域
    registerDropZone(id, element, options = {}) {
        const dropZone = {
            id: id,
            element: element,
            options: {
                onDrop: options.onDrop || (() => {}),
                onDragEnter: options.onDragEnter || (() => {}),
                onDragLeave: options.onDragLeave || (() => {}),
                acceptedTypes: options.acceptedTypes || [],
                maxFileSize: options.maxFileSize || Infinity,
                maxFiles: options.maxFiles || Infinity,
                hintText: options.hintText || '拖拽文件到这里'
            }
        };

        this.dropZones.set(id, dropZone);

        // 绑定事件
        element.addEventListener('dragenter', (e) => this.handleDragEnter(e, dropZone));
        element.addEventListener('dragover', (e) => this.handleDragOver(e, dropZone));
        element.addEventListener('dragleave', (e) => this.handleDragLeave(e, dropZone));
        element.addEventListener('drop', (e) => this.handleDrop(e, dropZone));
    }

    // 注销拖拽区域
    unregisterDropZone(id) {
        const dropZone = this.dropZones.get(id);
        if (dropZone) {
            const element = dropZone.element;
            element.removeEventListener('dragenter', this.handleDragEnter);
            element.removeEventListener('dragover', this.handleDragOver);
            element.removeEventListener('dragleave', this.handleDragLeave);
            element.removeEventListener('drop', this.handleDrop);
            this.dropZones.delete(id);
        }
    }

    // 处理拖入事件
    handleDragEnter(e, dropZone) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter++;
        
        if (this.dragCounter === 1) {
            this.currentDropZone = dropZone;
            dropZone.element.classList.add('dragover');
            this.updateDragHint(dropZone.options.hintText);
            this.showDragHint();
            dropZone.options.onDragEnter(e);
        }
    }

    // 处理拖动悬停事件
    handleDragOver(e, dropZone) {
        e.preventDefault();
        e.stopPropagation();

        // 更新拖拽效果
        if (this.isValidDrop(e.dataTransfer, dropZone)) {
            e.dataTransfer.dropEffect = 'copy';
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    }

    // 处理拖出事件
    handleDragLeave(e, dropZone) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter--;

        if (this.dragCounter === 0) {
            dropZone.element.classList.remove('dragover');
            this.hideDragHint();
            this.currentDropZone = null;
            dropZone.options.onDragLeave(e);
        }
    }

    // 处理放置事件
    handleDrop(e, dropZone) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter = 0;
        dropZone.element.classList.remove('dragover');
        this.hideDragHint();

        const files = this.getDroppedFiles(e.dataTransfer);
        
        if (files.length > 0) {
            // 验证文件
            const validFiles = this.validateFiles(files, dropZone.options);
            
            if (validFiles.length > 0) {
                dropZone.options.onDrop(validFiles);
                this.showDropSuccess(validFiles.length);
            } else {
                this.showDropError('没有有效的文件');
            }
        }

        this.currentDropZone = null;
    }

    // 注册全局拖拽
    registerGlobalDragDrop() {
        let globalDragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            globalDragCounter++;
            if (globalDragCounter === 1 && !this.currentDropZone) {
                // 显示全局拖拽提示
                this.showGlobalDragHint();
            }
        });

        document.addEventListener('dragleave', (e) => {
            globalDragCounter--;
            if (globalDragCounter === 0 && !this.currentDropZone) {
                this.hideGlobalDragHint();
            }
        });

        document.addEventListener('drop', (e) => {
            globalDragCounter = 0;
            this.hideGlobalDragHint();

            // 如果不在任何拖拽区域内，处理全局拖拽
            if (!this.currentDropZone) {
                e.preventDefault();
                const files = this.getDroppedFiles(e.dataTransfer);
                if (files.length > 0) {
                    // 自动导航到文件伪装页面并处理文件
                    if (window.uiController) {
                        window.uiController.switchPage('disguise');
                        window.uiController.handleFileSelect(files);
                    }
                }
            }
        });
    }

    // 获取拖拽的文件
    getDroppedFiles(dataTransfer) {
        const files = [];
        
        if (dataTransfer.items) {
            // 使用DataTransferItemList接口
            for (let i = 0; i < dataTransfer.items.length; i++) {
                if (dataTransfer.items[i].kind === 'file') {
                    const file = dataTransfer.items[i].getAsFile();
                    if (file) files.push(file);
                }
            }
        } else {
            // 使用DataTransfer.files
            for (let i = 0; i < dataTransfer.files.length; i++) {
                files.push(dataTransfer.files[i]);
            }
        }

        return files;
    }

    // 验证拖拽是否有效
    isValidDrop(dataTransfer, dropZone) {
        if (!dataTransfer.types.includes('Files')) {
            return false;
        }

        // 检查文件数量限制
        const fileCount = dataTransfer.items ? dataTransfer.items.length : dataTransfer.files.length;
        if (fileCount > dropZone.options.maxFiles) {
            return false;
        }

        return true;
    }

    // 验证文件
    validateFiles(files, options) {
        return Array.from(files).filter(file => {
            // 检查文件类型
            if (options.acceptedTypes.length > 0) {
                const extension = Utils.getFileExtension(file.name);
                if (!options.acceptedTypes.includes(extension)) {
                    return false;
                }
            }

            // 检查文件大小
            if (file.size > options.maxFileSize) {
                return false;
            }

            return true;
        });
    }

    // 更新拖拽提示文本
    updateDragHint(text) {
        if (this.dragHint) {
            this.dragHint.textContent = text;
        }
    }

    // 显示拖拽提示
    showDragHint() {
        if (this.dragHint) {
            this.dragHint.classList.add('show');
        }
    }

    // 隐藏拖拽提示
    hideDragHint() {
        if (this.dragHint) {
            this.dragHint.classList.remove('show');
        }
    }

    // 显示全局拖拽提示
    showGlobalDragHint() {
        document.body.classList.add('global-dragging');
        this.updateDragHint('拖拽文件到页面任意位置');
        this.showDragHint();
    }

    // 隐藏全局拖拽提示
    hideGlobalDragHint() {
        document.body.classList.remove('global-dragging');
        this.hideDragHint();
    }

    // 显示拖拽成功提示
    showDropSuccess(fileCount) {
        Utils.showToast(`成功添加 ${fileCount} 个文件`, 'success');
        
        // 添加成功动画
        if (this.currentDropZone) {
            this.currentDropZone.element.classList.add('drop-success');
            setTimeout(() => {
                this.currentDropZone.element.classList.remove('drop-success');
            }, 500);
        }
    }

    // 显示拖拽错误提示
    showDropError(message) {
        Utils.showToast(message, 'error');
        
        // 添加错误动画
        if (this.currentDropZone) {
            this.currentDropZone.element.classList.add('drop-error');
            setTimeout(() => {
                this.currentDropZone.element.classList.remove('drop-error');
            }, 500);
        }
    }

    // 启用或禁用拖拽功能
    setEnabled(enabled) {
        this.dropZones.forEach(dropZone => {
            dropZone.element.style.pointerEvents = enabled ? 'auto' : 'none';
        });
    }

    // 添加文件类型图标映射
    getFileTypeIcon(filename) {
        const extension = Utils.getFileExtension(filename);
        const iconMap = {
            // 压缩包
            'zip': '📦',
            'rar': '📦',
            '7z': '📦',
            'tar': '📦',
            'gz': '📦',
            // 视频
            'mp4': '🎬',
            'avi': '🎬',
            'mkv': '🎬',
            'mov': '🎬',
            'wmv': '🎬',
            // 图片
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'bmp': '🖼️'
        };
        
        return iconMap[extension] || '📄';
    }

    // 创建文件预览
    createFilePreview(file) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        const icon = this.getFileTypeIcon(file.name);
        const size = Utils.formatFileSize(file.size);
        
        preview.innerHTML = `
            <span class="file-preview-icon">${icon}</span>
            <span class="file-preview-name">${file.name}</span>
            <span class="file-preview-size">${size}</span>
        `;
        
        return preview;
    }
}

// 创建全局拖拽处理器实例
window.dragDropHandler = new DragDropHandler();
