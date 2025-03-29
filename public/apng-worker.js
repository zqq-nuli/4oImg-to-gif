// APNG Worker - 用于处理APNG生成
// 基于Canvas和ArrayBuffer处理

// 接收消息处理
self.onmessage = function (e) {
    const { frames, delays } = e.data;

    try {
        createAPNG(frames, delays)
            .then(buffer => {
                // 发送完成的buffer回主线程
                self.postMessage(
                    {
                        type: "done",
                        buffer: buffer,
                    },
                    [buffer]
                );
            })
            .catch(error => {
                self.postMessage({
                    type: "error",
                    error: error.toString(),
                });
            });
    } catch (error) {
        self.postMessage({
            type: "error",
            error: error.toString(),
        });
    }
};

// APNG创建函数
async function createAPNG(frames, delays) {
    if (frames.length === 0) {
        throw new Error("没有帧数据");
    }

    // 获取尺寸
    const width = frames[0].width;
    const height = frames[0].height;

    // 准备帧
    const preparedFrames = [];
    for (let i = 0; i < frames.length; i++) {
        const canvas = await renderFrameToImageData(frames[i]);
        preparedFrames.push({
            canvas: canvas,
            delay: delays[i],
        });
    }

    // 制作APNG二进制数据
    const buffer = await makeAPNG(preparedFrames, width, height);
    return buffer;
}

// 实际制作APNG文件数据
async function makeAPNG(frames, width, height) {
    // === 创建PNG签名 ===
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

    // === 创建IHDR区块 ===
    const IHDR = {
        width: width,
        height: height,
        depth: 8,
        colorType: 6, // 带alpha通道的真彩色
        compression: 0, // 压缩方法
        filter: 0, // 过滤方法
        interlace: 0, // 不隔行扫描
    };

    // === 创建acTL区块 ===
    const acTL = {
        numFrames: frames.length,
        numPlays: 0, // 0表示无限循环
    };

    // === 第一帧的PNG数据（获取其他必要区块） ===
    const firstFrameImagePNG = await PNGtoByteArray(frames[0].canvas);
    const firstFramePNGChunks = extractPNGChunks(firstFrameImagePNG);

    // 创建最终APNG的区块列表
    const chunks = [];

    // === 添加必要区块 ===
    // 1. 添加IHDR
    chunks.push(
        makeChunk(
            "IHDR",
            new Uint8Array([
                ...writeUint32BE(IHDR.width),
                ...writeUint32BE(IHDR.height),
                IHDR.depth,
                IHDR.colorType,
                IHDR.compression,
                IHDR.filter,
                IHDR.interlace,
            ])
        )
    );

    // 2. 添加acTL (必须在IHDR之后，第一个fcTL之前)
    chunks.push(
        makeChunk(
            "acTL",
            new Uint8Array([...writeUint32BE(acTL.numFrames), ...writeUint32BE(acTL.numPlays)])
        )
    );

    // === 处理所有帧 ===
    let sequence = 0;

    // 为第一帧添加fcTL (必须在第一个IDAT之前)
    chunks.push(makeChunk("fcTL", makeFrameControlData(sequence++, frames[0])));

    // 添加第一帧的所有IDAT区块
    const firstFrameIDATs = firstFramePNGChunks.filter(chunk => chunk.name === "IDAT");
    for (const idat of firstFrameIDATs) {
        chunks.push(makeChunk("IDAT", idat.data));
    }

    // 处理后续帧
    for (let i = 1; i < frames.length; i++) {
        // 为当前帧添加fcTL
        chunks.push(makeChunk("fcTL", makeFrameControlData(sequence++, frames[i])));

        // 从当前帧的PNG提取IDAT数据并创建fdAT
        const framePNG = await PNGtoByteArray(frames[i].canvas);
        const framePNGChunks = extractPNGChunks(framePNG);
        const frameIDATs = framePNGChunks.filter(chunk => chunk.name === "IDAT");

        for (const idat of frameIDATs) {
            // 创建fdAT: 序列号 + IDAT数据
            const fdatData = new Uint8Array(4 + idat.data.byteLength);
            // 写入序列号
            fdatData.set(writeUint32BE(sequence++), 0);
            // 写入IDAT数据
            fdatData.set(new Uint8Array(idat.data), 4);

            chunks.push(makeChunk("fdAT", fdatData));
        }
    }

    // 添加IEND区块
    chunks.push(makeChunk("IEND", new Uint8Array(0)));

    // === 组装最终的APNG数据 ===
    // 计算总长度
    let totalLength = signature.byteLength;
    for (const chunk of chunks) {
        totalLength += chunk.byteLength;
    }

    // 创建结果数组
    const result = new Uint8Array(totalLength);

    // 复制PNG签名
    result.set(signature, 0);
    let offset = signature.byteLength;

    // 复制所有区块
    for (const chunk of chunks) {
        result.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
    }

    return result.buffer;
}

// 创建帧控制数据
function makeFrameControlData(sequenceNumber, frame) {
    return new Uint8Array([
        ...writeUint32BE(sequenceNumber), // 序列号
        ...writeUint32BE(frame.canvas.width), // 宽度
        ...writeUint32BE(frame.canvas.height), // 高度
        0,
        0,
        0,
        0, // x, y 偏移 (都是0)
        ...writeUint16BE(frame.delay), // 延迟分子 (毫秒)
        ...writeUint16BE(1000), // 延迟分母 (1000 = 毫秒单位)
        0, // 处置操作 (0 = 不处置)
        0, // 混合操作 (0 = 源覆盖)
    ]);
}

// 将Canvas转换为PNG字节数组
async function PNGtoByteArray(canvas) {
    // 使用异步操作获取PNG数据
    return await convertCanvasToPNG(canvas);
}

// 提取PNG中的所有区块
function extractPNGChunks(pngData) {
    const chunks = [];
    let pos = 8; // 跳过PNG签名

    while (pos < pngData.byteLength) {
        // 读取区块长度
        const length = readUint32BE(pngData, pos);
        pos += 4;

        // 读取区块类型
        const nameBytes = pngData.slice(pos, pos + 4);
        const name = String.fromCharCode(...nameBytes);
        pos += 4;

        // 读取区块数据
        const data = pngData.slice(pos, pos + length);
        pos += length;

        // 跳过CRC
        pos += 4;

        chunks.push({
            name: name,
            data: data,
        });
    }

    return chunks;
}

// Canvas转PNG（使用OffscreenCanvas的convertToBlob）
async function convertCanvasToPNG(canvas) {
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
}

// 将帧数据渲染到Canvas
async function renderFrameToImageData(frameData) {
    const width = frameData.width;
    const height = frameData.height;

    // 创建临时Canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 创建ImageData，确保数据是Uint8ClampedArray
    let pixelData;
    if (Array.isArray(frameData.data)) {
        // 如果是普通数组，转换为Uint8ClampedArray
        pixelData = new Uint8ClampedArray(frameData.data);
    } else if (frameData.data instanceof Uint8ClampedArray) {
        // 如果已经是Uint8ClampedArray，直接使用
        pixelData = frameData.data;
    } else {
        // 其他情况，尝试转换
        pixelData = new Uint8ClampedArray(Object.values(frameData.data));
    }

    // 创建ImageData对象并绘制到canvas
    const imageData = new ImageData(pixelData, width, height);
    ctx.putImageData(imageData, 0, 0);

    return canvas;
}

// 创建PNG区块
function makeChunk(type, data) {
    // 区块结构: [长度(4)] [类型(4)] [数据(变长)] [CRC(4)]
    const typeBytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        typeBytes[i] = type.charCodeAt(i);
    }

    // 创建完整区块数组
    const chunk = new Uint8Array(data.byteLength + 12);

    // 写入长度（大端字节序）
    chunk.set(writeUint32BE(data.byteLength), 0);

    // 写入类型
    chunk.set(typeBytes, 4);

    // 写入数据
    chunk.set(data, 8);

    // 计算CRC (类型+数据)
    const crcData = new Uint8Array(typeBytes.length + data.byteLength);
    crcData.set(typeBytes, 0);
    crcData.set(data, typeBytes.length);

    const crc = calculateCRC(crcData);
    chunk.set(writeUint32BE(crc), data.byteLength + 8);

    return chunk.buffer;
}

// 大端字节序转换工具
function writeUint32BE(value) {
    return new Uint8Array([
        (value >>> 24) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 8) & 0xff,
        value & 0xff,
    ]);
}

function writeUint16BE(value) {
    return new Uint8Array([(value >>> 8) & 0xff, value & 0xff]);
}

function readUint32BE(data, offset) {
    return (
        (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
    );
}

// CRC表（用于计算CRC32校验和）
const crcTable = (() => {
    const table = new Uint32Array(256);

    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c;
    }

    return table;
})();

// 计算CRC32校验和
function calculateCRC(data) {
    let crc = 0xffffffff;

    for (let i = 0; i < data.length; i++) {
        crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }

    return crc ^ 0xffffffff;
}
