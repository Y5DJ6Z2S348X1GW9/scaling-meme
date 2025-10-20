// 文件处理模块

class FileHandler {
    constructor() {
        this.files = new Map();
        this.supportedArchiveFormats = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'cab', 'arj', 'lzh', 'ace', 'z', 'tar.gz', 'tar.bz2'];
        this.supportedVideoFormats = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mpg', 'mpeg', 'm4v', '3gp', '3g2', 'rm', 'rmvb', 'asf', 'vob', 'ogv', 'f4v', 'f4p', 'f4a', 'f4b'];
        this.supportedImageFormats = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'];
        this.maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB
    }

    // 添加文件
    addFile(file) {
        const fileId = Utils.generateUniqueId();
        const fileInfo = {
            id: fileId,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            extension: Utils.getFileExtension(file.name),
            addedAt: new Date(),
            status: 'pending',
            progress: 0,
            disguisedFile: null
        };

        // 验证文件
        const validation = this.validateFile(file);
        if (!validation.valid) {
            fileInfo.status = 'error';
            fileInfo.error = validation.error;
        }

        this.files.set(fileId, fileInfo);
        return fileInfo;
    }

    // 移除文件
    removeFile(fileId) {
        return this.files.delete(fileId);
    }

    // 清空所有文件
    clearFiles() {
        this.files.clear();
    }

    // 获取文件信息
    getFile(fileId) {
        return this.files.get(fileId);
    }

    // 获取所有文件
    getAllFiles() {
        return Array.from(this.files.values());
    }

    // 验证文件
    validateFile(file) {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `文件大小超过限制（最大 ${Utils.formatFileSize(this.maxFileSize)}）`
            };
        }

        // 检查文件类型
        const extension = Utils.getFileExtension(file.name);
        const isArchive = this.supportedArchiveFormats.includes(extension);
        const isVideo = this.supportedVideoFormats.includes(extension);

        if (!isArchive && !isVideo) {
            return {
                valid: false,
                error: '不支持的文件格式，请选择压缩包或视频文件'
            };
        }

        return { valid: true };
    }

    // 获取文件类型
    getFileCategory(filename) {
        const extension = Utils.getFileExtension(filename);
        
        if (this.supportedArchiveFormats.includes(extension)) {
            return 'archive';
        } else if (this.supportedVideoFormats.includes(extension)) {
            return 'video';
        } else if (this.supportedImageFormats.includes(extension)) {
            return 'image';
        }
        
        return 'unknown';
    }

    // 获取文件图标类名
    getFileIconClass(filename) {
        const extension = Utils.getFileExtension(filename);
        const category = this.getFileCategory(filename);
        
        if (category === 'archive') {
            if (['zip', 'rar', '7z'].includes(extension)) {
                return `file-icon-${extension}`;
            }
            return 'file-icon-zip';
        } else if (category === 'video') {
            if (['mp4', 'avi', 'mkv'].includes(extension)) {
                return `file-icon-${extension}`;
            }
            return 'file-icon-video';
        } else if (category === 'image') {
            return 'file-icon-image';
        }
        
        return 'file-icon-unknown';
    }

    // 批量添加文件
    addFiles(files) {
        const results = [];
        for (const file of files) {
            results.push(this.addFile(file));
        }
        return results;
    }

    // 更新文件状态
    updateFileStatus(fileId, status, progress = null, error = null) {
        const fileInfo = this.files.get(fileId);
        if (fileInfo) {
            fileInfo.status = status;
            if (progress !== null) {
                fileInfo.progress = progress;
            }
            if (error !== null) {
                fileInfo.error = error;
            }
            this.files.set(fileId, fileInfo);
        }
    }

    // 保存伪装后的文件
    saveDisguisedFile(fileId, disguisedBlob, disguisedName) {
        const fileInfo = this.files.get(fileId);
        if (fileInfo) {
            fileInfo.disguisedFile = {
                blob: disguisedBlob,
                name: disguisedName,
                size: disguisedBlob.size
            };
            fileInfo.status = 'completed';
            fileInfo.progress = 100;
            this.files.set(fileId, fileInfo);
        }
    }

    // 获取待处理文件
    getPendingFiles() {
        return Array.from(this.files.values()).filter(file => file.status === 'pending');
    }

    // 获取已完成文件
    getCompletedFiles() {
        return Array.from(this.files.values()).filter(file => file.status === 'completed');
    }

    // 检查是否有正在处理的文件
    hasProcessingFiles() {
        return Array.from(this.files.values()).some(file => file.status === 'processing');
    }

    // 获取文件统计信息
    getStatistics() {
        const files = Array.from(this.files.values());
        return {
            total: files.length,
            pending: files.filter(f => f.status === 'pending').length,
            processing: files.filter(f => f.status === 'processing').length,
            completed: files.filter(f => f.status === 'completed').length,
            error: files.filter(f => f.status === 'error').length,
            totalSize: files.reduce((sum, f) => sum + f.size, 0)
        };
    }

    // 导出文件列表信息
    exportFileList() {
        const files = Array.from(this.files.values());
        return files.map(file => ({
            name: file.name,
            size: Utils.formatFileSize(file.size),
            type: file.extension,
            status: file.status,
            addedAt: Utils.formatDate(file.addedAt),
            disguisedName: file.disguisedFile ? file.disguisedFile.name : null
        }));
    }
}

// 创建全局文件处理器实例
window.fileHandler = new FileHandler();
