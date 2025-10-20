// 文件伪装引擎 - 核心功能模块

class DisguiseEngine {
    constructor() {
        // 图片文件的结束标记
        this.imageMarkers = {
            jpg: new Uint8Array([0xFF, 0xD9]), // JPEG结束标记
            png: new Uint8Array([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]), // PNG IEND标记
            bmp: null, // BMP文件大小在文件头中定义
            gif: new Uint8Array([0x00, 0x3B]) // GIF结束标记
        };

        // 自定义分隔标记，用于在伪装文件中标记原始数据的开始
        this.customSeparator = new Uint8Array([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8
        ]);

        // 元数据标记
        this.metadataMarker = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
    }

    // 伪装文件主函数
    async disguiseFile(originalFile, coverImageBlob, outputFormat = 'jpg') {
        try {
            // 读取原始文件和封面图片
            const [originalData, coverData] = await Promise.all([
                Utils.readFileAsArrayBuffer(originalFile),
                Utils.readFileAsArrayBuffer(coverImageBlob)
            ]);

            // 创建元数据
            const metadata = this.createMetadata(originalFile);
            
            // 根据输出格式处理
            let disguisedData;
            switch (outputFormat) {
                case 'jpg':
                case 'jpeg':
                    disguisedData = await this.disguiseAsJPEG(originalData, coverData, metadata);
                    break;
                case 'png':
                    disguisedData = await this.disguiseAsPNG(originalData, coverData, metadata);
                    break;
                case 'bmp':
                    disguisedData = await this.disguiseAsBMP(originalData, coverData, metadata);
                    break;
                default:
                    throw new Error('不支持的输出格式');
            }

            // 创建伪装后的文件
            const disguisedBlob = new Blob([disguisedData], { type: `image/${outputFormat}` });
            const disguisedName = this.generateDisguisedFileName(originalFile.name, outputFormat);

            return {
                blob: disguisedBlob,
                name: disguisedName,
                originalName: originalFile.name,
                originalSize: originalFile.size,
                disguisedSize: disguisedBlob.size
            };

        } catch (error) {
            console.error('文件伪装失败:', error);
            throw error;
        }
    }

    // 伪装为JPEG格式（核心算法：原始文件在前，图片在后）
    async disguiseAsJPEG(originalData, coverData, metadata) {
        const coverArray = new Uint8Array(coverData);
        const originalArray = new Uint8Array(originalData);
        
        // 重要提示：此方法生成的文件，改回原扩展名后可直接使用
        // 压缩包/视频软件会读取文件开头的有效数据
        // 图片查看器可能无法显示（这是伪装的代价）
        
        const totalSize = originalArray.length + 
                         this.customSeparator.length +
                         metadata.length +
                         coverArray.length;

        const disguisedArray = new Uint8Array(totalSize);
        let offset = 0;

        // 1. 写入完整的原始文件数据（保持在开头，确保改名后可用）
        disguisedArray.set(originalArray, offset);
        offset += originalArray.length;

        // 2. 写入分隔符和元数据（用于识别）
        disguisedArray.set(this.customSeparator, offset);
        offset += this.customSeparator.length;
        disguisedArray.set(metadata, offset);
        offset += metadata.length;

        // 3. 写入图片数据（追加在后面）
        disguisedArray.set(coverArray, offset);

        return disguisedArray;
    }

    // 伪装为PNG格式（核心算法：原始文件在前）
    async disguiseAsPNG(originalData, coverData, metadata) {
        const coverArray = new Uint8Array(coverData);
        const originalArray = new Uint8Array(originalData);
        
        // 与JPEG相同策略：原始文件在前，确保改名后可用
        const totalSize = originalArray.length + 
                         this.customSeparator.length +
                         metadata.length +
                         coverArray.length;

        const disguisedArray = new Uint8Array(totalSize);
        let offset = 0;

        disguisedArray.set(originalArray, offset);
        offset += originalArray.length;
        disguisedArray.set(this.customSeparator, offset);
        offset += this.customSeparator.length;
        disguisedArray.set(metadata, offset);
        offset += metadata.length;
        disguisedArray.set(coverArray, offset);

        return disguisedArray;
    }

    // 伪装为BMP格式（核心算法：原始文件在前）
    async disguiseAsBMP(originalData, coverData, metadata) {
        const coverArray = new Uint8Array(coverData);
        const originalArray = new Uint8Array(originalData);
        
        // 与JPEG相同策略：原始文件在前，确保改名后可用
        const totalSize = originalArray.length + 
                         this.customSeparator.length +
                         metadata.length +
                         coverArray.length;

        const disguisedArray = new Uint8Array(totalSize);
        let offset = 0;

        disguisedArray.set(originalArray, offset);
        offset += originalArray.length;
        disguisedArray.set(this.customSeparator, offset);
        offset += this.customSeparator.length;
        disguisedArray.set(metadata, offset);
        offset += metadata.length;
        disguisedArray.set(coverArray, offset);

        return disguisedArray;
    }

    // 查找JPEG结束标记
    findJPEGEndMarker(data) {
        for (let i = data.length - 2; i >= 0; i--) {
            if (data[i] === 0xFF && data[i + 1] === 0xD9) {
                return i;
            }
        }
        return -1;
    }

    // 查找PNG IEND chunk
    findPNGIENDChunk(data) {
        const iendSignature = new Uint8Array([0x49, 0x45, 0x4E, 0x44]);
        for (let i = data.length - 12; i >= 8; i--) {
            let match = true;
            for (let j = 0; j < 4; j++) {
                if (data[i + 4 + j] !== iendSignature[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;
            }
        }
        return -1;
    }

    // 创建PNG chunk
    createPNGChunk(type, data) {
        const length = data.length;
        const chunk = new Uint8Array(length + 12);
        
        // Length (4 bytes, big-endian)
        chunk[0] = (length >>> 24) & 0xFF;
        chunk[1] = (length >>> 16) & 0xFF;
        chunk[2] = (length >>> 8) & 0xFF;
        chunk[3] = length & 0xFF;
        
        // Type (4 bytes)
        for (let i = 0; i < 4; i++) {
            chunk[4 + i] = type.charCodeAt(i);
        }
        
        // Data
        chunk.set(data, 8);
        
        // CRC (4 bytes) - 简化处理，实际应该计算CRC32
        const crc = this.calculateCRC32(chunk.slice(4, 8 + length));
        chunk[8 + length] = (crc >>> 24) & 0xFF;
        chunk[9 + length] = (crc >>> 16) & 0xFF;
        chunk[10 + length] = (crc >>> 8) & 0xFF;
        chunk[11 + length] = crc & 0xFF;
        
        return chunk;
    }

    // 简化的CRC32计算
    calculateCRC32(data) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ this.crc32Table[(crc ^ data[i]) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    // CRC32查找表（初始化）
    get crc32Table() {
        if (!this._crc32Table) {
            this._crc32Table = new Uint32Array(256);
            for (let i = 0; i < 256; i++) {
                let c = i;
                for (let j = 0; j < 8; j++) {
                    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                }
                this._crc32Table[i] = c;
            }
        }
        return this._crc32Table;
    }

    // 创建元数据
    createMetadata(file) {
        const metadata = {
            originalName: file.name,
            originalSize: file.size,
            originalType: file.type,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        const metadataStr = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataStr);
        
        // 添加长度前缀（4字节）
        const result = new Uint8Array(4 + metadataBytes.length);
        const length = metadataBytes.length;
        result[0] = (length >>> 24) & 0xFF;
        result[1] = (length >>> 16) & 0xFF;
        result[2] = (length >>> 8) & 0xFF;
        result[3] = length & 0xFF;
        result.set(metadataBytes, 4);
        
        return result;
    }

    // 生成伪装后的文件名
    generateDisguisedFileName(originalName, format) {
        const baseName = Utils.getFileNameWithoutExtension(originalName);
        const originalExt = Utils.getFileExtension(originalName);
        const timestamp = Date.now().toString(36);
        // 文件名包含原始扩展名信息，方便用户改回
        return `${baseName}_disguised_${timestamp}_[改名为.${originalExt}].${format}`;
    }

    // 检测文件是否为伪装文件
    async detectDisguisedFile(file) {
        try {
            const arrayBuffer = await Utils.readFileAsArrayBuffer(file);
            const data = new Uint8Array(arrayBuffer);
            
            // 查找自定义分隔符
            for (let i = 0; i < data.length - this.customSeparator.length; i++) {
                let match = true;
                for (let j = 0; j < this.customSeparator.length; j++) {
                    if (data[i + j] !== this.customSeparator[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    // 找到分隔符，检查元数据
                    const metadataStart = i + this.customSeparator.length + this.metadataMarker.length;
                    if (metadataStart + 4 < data.length) {
                        const metadataLength = (data[metadataStart] << 24) |
                                             (data[metadataStart + 1] << 16) |
                                             (data[metadataStart + 2] << 8) |
                                             data[metadataStart + 3];
                        
                        if (metadataStart + 4 + metadataLength < data.length) {
                            const metadataBytes = data.slice(metadataStart + 4, metadataStart + 4 + metadataLength);
                            const metadataStr = new TextDecoder().decode(metadataBytes);
                            try {
                                const metadata = JSON.parse(metadataStr);
                                return {
                                    isDisguised: true,
                                    metadata: metadata,
                                    dataStart: metadataStart + 4 + metadataLength
                                };
                            } catch (e) {
                                // JSON解析失败，继续查找
                            }
                        }
                    }
                }
            }
            
            return { isDisguised: false };
        } catch (error) {
            console.error('检测伪装文件失败:', error);
            return { isDisguised: false };
        }
    }

    // 提取原始文件（恢复功能）
    async extractOriginalFile(disguisedFile) {
        const detection = await this.detectDisguisedFile(disguisedFile);
        if (!detection.isDisguised) {
            throw new Error('这不是一个伪装文件');
        }

        const arrayBuffer = await Utils.readFileAsArrayBuffer(disguisedFile);
        const data = new Uint8Array(arrayBuffer);
        
        // 提取原始数据
        const originalData = data.slice(detection.dataStart);
        const originalBlob = new Blob([originalData], { type: detection.metadata.originalType });
        
        return {
            blob: originalBlob,
            metadata: detection.metadata
        };
    }
}

// 创建全局伪装引擎实例
window.disguiseEngine = new DisguiseEngine();
