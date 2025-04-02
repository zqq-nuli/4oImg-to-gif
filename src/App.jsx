import { useState, useRef, useEffect } from "react";
import "./App.css";
import GIF from "gif.js";

// 翻译字典
const translations = {
    zh: {
        title: "图像分割 GIF 生成器",
        chooseImage: "选择图片",
        byRowsCols: "按行列数切分",
        bySize: "按精灵尺寸切分",
        cols: "列数:",
        rows: "行数:",
        frameWidth: "帧宽度:",
        frameHeight: "帧高度:",
        frameDelay: "帧延迟 (ms):",
        frameSizeInfo: "每帧尺寸:",
        generateFramesInfo: "可生成:",
        frames: "帧",
        sortFrames: "排序帧顺序",
        customizeFrames: "自定义帧位置和尺寸",
        posX: "X坐标:",
        posY: "Y坐标:",
        width: "宽度:",
        height: "高度:",
        resetPos: "重置位置",
        resetSize: "重置尺寸",
        generating: "生成中...",
        generatePreview: "生成GIF预览",
        gifPreview: "GIF 预览",
        saveGif: "保存 GIF",
        saveApng: "保存 APNG",
        px: "px",
        selectionTool: "框选工具",
        dragToSelect: "在原图上拖动鼠标框选区域",
        applySelection: "应用选区",
        cancelSelection: "取消选区",
        issuesTip: "如果您觉得哪里做得不好，或者想要新功能，可以在GitHub上提交issues",
        detectGridLines: "检测框线",
        detectingGridLines: "正在检测框线...",
        gridLinesDetected: "已检测到 {count} 个精灵图",
        gridLinesThreshold: "检测阈值:",
        applyDetection: "应用检测结果",
        detectionModeGeneral: "通用检测模式",
        detectionModeWhiteBorder: "白色边框检测",
        detectionModeDescription: "检测模式:",
        expectedRows: "预期行数:",
        expectedCols: "预期列数:",
        useExpectedGrid: "使用预期行列数",
        excludeBorders: "排除边框",
        borderSize: "边框大小(像素):",
        trimEdges: "修剪边缘",
        autoTrimEdges: "自动修剪边缘",
    },
    en: {
        title: "Sprite Sheet GIF Generator",
        chooseImage: "Choose Image",
        byRowsCols: "Split by Rows & Columns",
        bySize: "Split by Sprite Size",
        cols: "Columns:",
        rows: "Rows:",
        frameWidth: "Frame Width:",
        frameHeight: "Frame Height:",
        frameDelay: "Frame Delay (ms):",
        frameSizeInfo: "Frame Size:",
        generateFramesInfo: "Can generate:",
        frames: "frames",
        sortFrames: "Sort Frame Order",
        customizeFrames: "Customize Frame Position & Size",
        posX: "X Position:",
        posY: "Y Position:",
        width: "Width:",
        height: "Height:",
        resetPos: "Reset Position",
        resetSize: "Reset Size",
        generating: "Generating...",
        generatePreview: "Generate GIF Preview",
        gifPreview: "GIF Preview",
        saveGif: "Save GIF",
        saveApng: "Save APNG",
        px: "px",
        selectionTool: "Selection Tool",
        dragToSelect: "Drag to select area on the image",
        applySelection: "Apply Selection",
        cancelSelection: "Cancel Selection",
        issuesTip: "If you find any issues or want new features, please submit issues on GitHub",
        detectGridLines: "Detect Grid Lines",
        detectingGridLines: "Detecting grid lines...",
        gridLinesDetected: "{count} sprites detected",
        gridLinesThreshold: "Detection threshold:",
        applyDetection: "Apply Detection",
        detectionModeGeneral: "General Detection Mode",
        detectionModeWhiteBorder: "White Border Detection",
        detectionModeDescription: "Detection Mode:",
        expectedRows: "Expected Rows:",
        expectedCols: "Expected Columns:",
        useExpectedGrid: "Use Expected Grid",
        excludeBorders: "Exclude Borders",
        borderSize: "Border Size(px):",
        trimEdges: "Trim Edges",
        autoTrimEdges: "Auto Trim Edges",
    },
};

function App() {
    const [, setImageFile] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [sprites, setSprites] = useState([]);
    const [cols, setCols] = useState(4);
    const [rows, setRows] = useState(4);
    const [spriteWidth, setSpriteWidth] = useState(0);
    const [spriteHeight, setSpriteHeight] = useState(0);
    const [customSize, setCustomSize] = useState(false);
    const [frameOrder, setFrameOrder] = useState([]);
    const [gifPreview, setGifPreview] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [delay, setDelay] = useState(200); // 每帧延迟时间（毫秒）
    const [language, setLanguage] = useState("zh"); // 默认语言为中文
    const [selectedFrameId, setSelectedFrameId] = useState(null); // 当前选中的帧ID
    const [frameItemsPerRow, setFrameItemsPerRow] = useState(4); // 每行显示的帧数量
    const canvasRef = useRef(null);
    const selectionCanvasRef = useRef(null); // 用于框选的画布
    const [isSelecting, setIsSelecting] = useState(false); // 是否处于框选状态
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 }); // 选择的起始位置
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 }); // 选择的结束位置
    const [showSelectionTool, setShowSelectionTool] = useState(false); // 是否显示框选工具
    const [isDetectingGridLines, setIsDetectingGridLines] = useState(false); // 是否正在检测框线
    const [detectionCanvas, setDetectionCanvas] = useState(null); // 检测结果预览画布
    const [detectedSprites, setDetectedSprites] = useState([]); // 检测到的精灵图
    const [detectionThreshold, setDetectionThreshold] = useState(150); // 检测阈值，值越大线条越明显
    const detectionCanvasRef = useRef(null); // 框线检测画布的引用
    const [detectionMode, setDetectionMode] = useState('whiteBorder'); // 检测模式：'general'或'whiteBorder'
    const [expectedRows, setExpectedRows] = useState(3); // 预期行数
    const [expectedCols, setExpectedCols] = useState(4); // 预期列数
    const [useExpectedGrid, setUseExpectedGrid] = useState(true); // 是否使用预期行列数
    const [excludeBorders, setExcludeBorders] = useState(true); // 是否排除白色边框
    const [borderSize, setBorderSize] = useState(3); // 边框大小（像素）
    const [autoTrimEdges, setAutoTrimEdges] = useState(true); // 是否自动修剪边缘

    // 获取当前语言的翻译
    const t = translations[language];

    // 切换语言
    const toggleLanguage = () => {
        setLanguage(prev => (prev === "zh" ? "en" : "zh"));
    };

    // 当用户上传图片时
    const handleImageUpload = e => {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                // 初始化精灵尺寸为自动计算的值
                setSpriteWidth(Math.floor(img.width / cols));
                setSpriteHeight(Math.floor(img.height / rows));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // 图片加载后自动分割
    useEffect(() => {
        if (!originalImage) return;
        splitImage();
    }, [originalImage, cols, rows, spriteWidth, spriteHeight, customSize]);

    // 更新每行显示的帧数量
    useEffect(() => {
        // 使用当前设置的列数作为每行显示的帧数量，确保至少有2列
        if (cols > 0) {
            setFrameItemsPerRow(Math.max(2, Math.min(cols, 8)));
        }
    }, [cols]);

    // 分割图片
    const splitImage = () => {
        if (!originalImage) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // 设置canvas尺寸
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        const ctx = canvas.getContext("2d");

        // 在canvas上绘制原始图像
        ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);

        // 根据设置选择精灵尺寸
        let finalSpriteWidth, finalSpriteHeight;
        let finalCols, finalRows;

        if (customSize) {
            // 使用用户自定义的尺寸
            finalSpriteWidth = spriteWidth;
            finalSpriteHeight = spriteHeight;
            // 计算实际的行列数
            finalCols = Math.floor(originalImage.width / spriteWidth);
            finalRows = Math.floor(originalImage.height / spriteHeight);
        } else {
            // 使用行列数计算尺寸
            finalSpriteWidth = Math.floor(originalImage.width / cols);
            finalSpriteHeight = Math.floor(originalImage.height / rows);
            finalCols = cols;
            finalRows = rows;
        }

        const newSprites = [];

        for (let y = 0; y < finalRows; y++) {
            for (let x = 0; x < finalCols; x++) {
                // 创建临时画布用于保存每个精灵
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = finalSpriteWidth;
                tempCanvas.height = finalSpriteHeight;
                const tempCtx = tempCanvas.getContext("2d");

                // 绘制当前精灵到临时画布
                tempCtx.drawImage(
                    originalImage,
                    x * finalSpriteWidth,
                    y * finalSpriteHeight,
                    finalSpriteWidth,
                    finalSpriteHeight,
                    0,
                    0,
                    finalSpriteWidth,
                    finalSpriteHeight
                );

                // 保存精灵数据
                newSprites.push({
                    id: y * finalCols + x,
                    image: tempCanvas.toDataURL(),
                    x: x * finalSpriteWidth,
                    y: y * finalSpriteHeight,
                    width: finalSpriteWidth,
                    height: finalSpriteHeight,
                    originalX: x * finalSpriteWidth,
                    originalY: y * finalSpriteHeight,
                    originalWidth: finalSpriteWidth,
                    originalHeight: finalSpriteHeight,
                });
            }
        }

        setSprites(newSprites);

        // 初始化帧顺序为正常顺序
        const initialOrder = newSprites.map(sprite => sprite.id);
        setFrameOrder(initialOrder);
        // 重置选中的帧
        setSelectedFrameId(null);
    };

    // 更新行列数
    const handleGridChange = (e, type) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            if (type === "cols") {
                setCols(value);
                if (!customSize) {
                    setSpriteWidth(Math.floor(originalImage?.width / value));
                }
            } else if (type === "rows") {
                setRows(value);
                if (!customSize) {
                    setSpriteHeight(Math.floor(originalImage?.height / value));
                }
            }
        }
    };

    // 更新精灵尺寸
    const handleSpriteSize = (e, type) => {
        const value = parseInt(e.target.value);
        if (value > 0) {
            if (type === "width") {
                setSpriteWidth(value);
                if (customSize) {
                    setCols(Math.floor(originalImage?.width / value));
                }
            } else if (type === "height") {
                setSpriteHeight(value);
                if (customSize) {
                    setRows(Math.floor(originalImage?.height / value));
                }
            }
        }
    };

    // 切换尺寸模式
    const toggleSizeMode = () => {
        setCustomSize(!customSize);
    };

    // 更新精灵位置或尺寸
    const updateSpriteProperties = (id, properties) => {
        if (!originalImage) return;

        setSprites(prevSprites => {
            const updatedSprites = prevSprites.map(sprite => {
                if (sprite.id === id) {
                    // 获取新的属性值
                    const newX = properties.x !== undefined ? parseInt(properties.x) : sprite.x;
                    const newY = properties.y !== undefined ? parseInt(properties.y) : sprite.y;
                    const newWidth =
                        properties.width !== undefined ? parseInt(properties.width) : sprite.width;
                    const newHeight =
                        properties.height !== undefined
                            ? parseInt(properties.height)
                            : sprite.height;

                    // 确保坐标和尺寸在有效范围内
                    const validX = Math.max(0, Math.min(newX, originalImage.width - 1));
                    const validY = Math.max(0, Math.min(newY, originalImage.height - 1));
                    const validWidth = Math.max(
                        5,
                        Math.min(newWidth, originalImage.width - validX)
                    );
                    const validHeight = Math.max(
                        5,
                        Math.min(newHeight, originalImage.height - validY)
                    );

                    // 创建更新后的精灵对象
                    const updatedSprite = {
                        ...sprite,
                        x: validX,
                        y: validY,
                        width: validWidth,
                        height: validHeight,
                    };

                    // 创建临时画布更新精灵图像预览
                    try {
                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = validWidth;
                        tempCanvas.height = validHeight;
                        const tempCtx = tempCanvas.getContext("2d");

                        // 从原始图像中提取新区域
                        tempCtx.drawImage(
                            originalImage,
                            validX,
                            validY,
                            validWidth,
                            validHeight,
                            0,
                            0,
                            validWidth,
                            validHeight
                        );

                        // 更新精灵图像
                        updatedSprite.image = tempCanvas.toDataURL();
                    } catch (error) {
                        console.error("更新帧图像失败:", error);
                    }

                    return updatedSprite;
                }
                return sprite;
            });

            return updatedSprites;
        });
    };

    // 重置精灵位置
    const resetSpritePosition = id => {
        const sprite = sprites.find(s => s.id === id);
        if (!sprite || !originalImage) return;

        updateSpriteProperties(id, {
            x: sprite.originalX,
            y: sprite.originalY,
        });
    };

    // 重置精灵尺寸
    const resetSpriteSize = id => {
        const sprite = sprites.find(s => s.id === id);
        if (!sprite || !originalImage) return;

        updateSpriteProperties(id, {
            width: sprite.originalWidth,
            height: sprite.originalHeight,
        });
    };

    // 生成GIF预览
    const generateGifPreview = () => {
        if (sprites.length === 0 || frameOrder.length === 0) return;

        setIsGenerating(true);

        // 找出所有帧中最大的宽度和高度
        let maxWidth = 0;
        let maxHeight = 0;
        frameOrder.forEach(id => {
            const sprite = sprites.find(s => s.id === id);
            if (sprite) {
                if (sprite.width > maxWidth) maxWidth = sprite.width;
                if (sprite.height > maxHeight) maxHeight = sprite.height;
            }
        });

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: maxWidth,
            height: maxHeight,
            workerScript: "/gif.worker.js",
        });

        // 创建离屏画布用于绘制调整后的帧
        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = maxWidth;
        frameCanvas.height = maxHeight;
        const frameCtx = frameCanvas.getContext("2d");

        // 按照用户设置的顺序添加帧
        const addFramePromises = frameOrder.map(id => {
            return new Promise(resolve => {
                const sprite = sprites.find(s => s.id === id);
                if (!sprite) {
                    resolve();
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    // 清除画布
                    frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);

                    // 从原始图像中提取自定义区域并绘制到帧画布上
                    frameCtx.drawImage(
                        originalImage,
                        sprite.x,
                        sprite.y,
                        sprite.width,
                        sprite.height,
                        0,
                        0,
                        sprite.width,
                        sprite.height
                    );

                    // 添加帧到GIF
                    gif.addFrame(frameCanvas, { delay: delay, copy: true });
                    resolve();
                };
                img.src = sprite.image;
            });
        });

        Promise.all(addFramePromises).then(() => {
            gif.on("finished", blob => {
                const url = URL.createObjectURL(blob);
                setGifPreview(url);
                setIsGenerating(false);
            });

            gif.render();
        });
    };

    // 保存GIF
    const saveGif = () => {
        if (!gifPreview) return;

        const link = document.createElement("a");
        link.href = gifPreview;
        link.download = "animated.gif";
        link.click();
    };

    // 保存APNG (更新APNG保存逻辑，支持自定义精灵位置和尺寸)
    const saveApng = () => {
        if (!gifPreview) return;

        if (sprites.length === 0 || frameOrder.length === 0) return;

        // 找出所有帧中最大的宽度和高度
        let maxWidth = 0;
        let maxHeight = 0;
        frameOrder.forEach(id => {
            const sprite = sprites.find(s => s.id === id);
            if (sprite) {
                if (sprite.width > maxWidth) maxWidth = sprite.width;
                if (sprite.height > maxHeight) maxHeight = sprite.height;
            }
        });

        // 创建离屏画布
        const canvas = document.createElement("canvas");
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext("2d");

        // 创建所有帧图像的列表，用于合成
        const frames = [];
        const delays = [];

        // 加载所有精灵图像
        const loadPromises = frameOrder.map(id => {
            return new Promise(resolve => {
                const sprite = sprites.find(s => s.id === id);
                if (!sprite) resolve(null);

                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 从原始图像中提取自定义区域并绘制
                ctx.drawImage(
                    originalImage,
                    sprite.x,
                    sprite.y,
                    sprite.width,
                    sprite.height,
                    0,
                    0,
                    sprite.width,
                    sprite.height
                );

                // 获取图像数据
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // 将ImageData转为可传输对象
                const transferableImageData = {
                    width: imageData.width,
                    height: imageData.height,
                    data: Array.from(imageData.data),
                };

                frames.push(transferableImageData);
                delays.push(delay);
                resolve();
            });
        });

        // 等待所有图像加载完成
        Promise.all(loadPromises).then(() => {
            try {
                // 创建一个Web Worker来生成APNG以避免阻塞主线程
                const worker = new Worker("/apng-worker.js");

                worker.onmessage = function (e) {
                    if (e.data.type === "done") {
                        const blob = new Blob([e.data.buffer], { type: "image/png" });
                        const url = URL.createObjectURL(blob);

                        // 下载文件
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "animated.png";
                        link.click();

                        // 清理
                        URL.revokeObjectURL(url);
                        worker.terminate();
                    } else if (e.data.type === "error") {
                        console.error("APNG生成错误:", e.data.error);
                        alert("生成APNG失败：" + e.data.error);
                    }
                };

                // 发送数据到Worker
                worker.postMessage({
                    frames: frames,
                    delays: delays,
                });
            } catch (error) {
                console.error("APNG创建失败:", error);

                // 回退方案：直接使用GIF作为PNG保存（与之前相同）
                const link = document.createElement("a");
                link.href = gifPreview;
                link.download = "animated.png";
                link.click();
            }
        });
    };

    // 调整帧顺序
    const moveFrame = (id, direction) => {
        const newOrder = [...frameOrder];
        const index = newOrder.indexOf(id);

        if (index === -1) return;

        if (direction === "up" && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === "down" && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }

        setFrameOrder(newOrder);
    };

    // 计算选择区域的属性
    const getSelectionRect = () => {
        const startX = Math.min(selectionStart.x, selectionEnd.x);
        const startY = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);

        return { x: startX, y: startY, width, height };
    };

    // 开启框选工具
    const startSelectionTool = () => {
        setShowSelectionTool(true);
        setIsSelecting(true);

        // 重置选择状态
        setSelectionStart({ x: 0, y: 0 });
        setSelectionEnd({ x: 0, y: 0 });

        // 设置选择画布的尺寸为原始图像尺寸
        if (originalImage && selectionCanvasRef.current) {
            const canvas = selectionCanvasRef.current;

            // 确保先添加canvas到DOM，然后再设置属性
            setTimeout(() => {
                // 直接设置canvas DOM宽高属性，不使用setAttribute
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;

                // 立即绘制画布，显示原始图像
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

                console.log("框选画布尺寸:", canvas.width, "x", canvas.height);
                console.log("原始图像尺寸:", originalImage.width, "x", originalImage.height);
            }, 50);
        }
    };

    // 开始框选
    const handleSelectionStart = e => {
        if (!isSelecting || !showSelectionTool) return;

        const canvas = selectionCanvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // 计算缩放比例
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // 转换鼠标坐标到canvas实际坐标系统
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);

        console.log("开始框选:", x, y);
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
    };

    // 框选过程中
    const handleSelectionMove = e => {
        if (!isSelecting || !showSelectionTool) return;

        if (e.buttons !== 1) return; // 只有按住鼠标左键时才处理

        const canvas = selectionCanvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // 计算缩放比例
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // 转换鼠标坐标到canvas实际坐标系统
        const x = Math.round(Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvas.width)));
        const y = Math.round(Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvas.height)));

        setSelectionEnd({ x, y });

        // 绘制选择框
        drawSelectionBox();
    };

    // 结束框选
    const handleSelectionEnd = e => {
        if (!isSelecting || !showSelectionTool) return;

        // 只在鼠标松开时处理，移出画布时不处理
        if (e.type === "mouseleave") return;

        const canvas = selectionCanvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // 计算缩放比例
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // 转换鼠标坐标到canvas实际坐标系统
        const x = Math.round(Math.max(0, Math.min((e.clientX - rect.left) * scaleX, canvas.width)));
        const y = Math.round(Math.max(0, Math.min((e.clientY - rect.top) * scaleY, canvas.height)));

        setSelectionEnd({ x, y });

        // 更新选择框
        drawSelectionBox();

        // 记录选择区域的信息
        const { width, height } = getSelectionRect();
        console.log("选择完成:", width, "x", height);
    };

    // 绘制选择框
    const drawSelectionBox = () => {
        const canvas = selectionCanvasRef.current;
        if (!canvas || !originalImage) return;

        const ctx = canvas.getContext("2d");

        // 保存当前上下文状态
        ctx.save();

        // 清除之前的绘制并重新绘制原始图像
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

        if (isSelecting) {
            const { x, y, width, height } = getSelectionRect();

            // 创建半透明遮罩（遮盖整个画布）
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 使用剪切路径让选区区域显示原图
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            // 清除选区区域的遮罩，重新绘制该区域的原图
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

            // 恢复上下文状态
            ctx.restore();

            // 绘制选择框边框
            ctx.strokeStyle = "rgba(0, 150, 255, 1.0)";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // 显示选择尺寸
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.fillText(`${Math.round(width)} × ${Math.round(height)}`, x + 5, y + height - 10);
        }
    };

    // 应用选择区域到当前帧
    const applySelection = e => {
        // 防止事件冒泡
        if (e) e.stopPropagation();

        console.log("应用选区状态:", {
            selectedFrameId,
            isSelecting,
            hasOriginalImage: !!originalImage
        });

        // 先检查是否有选中的帧和原始图像
        if (selectedFrameId === null || selectedFrameId === undefined || !originalImage) {
            console.error("无法应用选区：未选择帧或无原始图像");
            return;
        }

        // 获取矩形选区
        const { x, y, width, height } = getSelectionRect();
        console.log("原始选区:", { x, y, width, height });

        // 选区太小，提示用户
        if (width < 10 || height < 10) {
            alert("选择区域太小，请选择更大的区域");
            return;
        }

        // 确保坐标和尺寸是整数并在图像范围内
        const intX = Math.round(Math.max(0, Math.min(x, originalImage.width - 1)));
        const intY = Math.round(Math.max(0, Math.min(y, originalImage.height - 1)));
        const intWidth = Math.round(Math.min(width, originalImage.width - intX));
        const intHeight = Math.round(Math.min(height, originalImage.height - intY));

        console.log("处理后选区:", { x: intX, y: intY, width: intWidth, height: intHeight });

        if (intWidth <= 0 || intHeight <= 0) {
            alert("选区无效，请重新选择");
            return;
        }

        // 更新选中帧的位置和尺寸
        const updatedProps = {
            x: intX,
            y: intY,
            width: intWidth,
            height: intHeight,
        };

        // 立即创建预览
        try {
            const sprite = sprites.find(s => s.id === selectedFrameId);
            if (!sprite) throw new Error("找不到选中的帧");

            // 创建临时画布更新精灵图像预览
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = intWidth;
            tempCanvas.height = intHeight;
            const tempCtx = tempCanvas.getContext("2d");

            // 从原始图像中提取选区
            tempCtx.drawImage(
                originalImage,
                intX,
                intY,
                intWidth,
                intHeight,
                0,
                0,
                intWidth,
                intHeight
            );

            // 确认选区预览成功
            console.log("预览图像生成完成");

            // 更新精灵属性
            updateSpriteProperties(selectedFrameId, updatedProps);
            console.log("已应用选区，更新精灵属性完成");
        } catch (error) {
            console.error("应用选区时发生错误:", error);
            alert("应用选区失败，请重试");
        }

        // 重置框选工具状态
        resetSelectionTool();
    };

    // 取消选择
    const cancelSelection = e => {
        // 防止事件冒泡
        if (e) e.stopPropagation();
        resetSelectionTool();
    };

    // 重置框选工具状态
    const resetSelectionTool = () => {
        setIsSelecting(false);
        setShowSelectionTool(false);

        // 清除选择框
        const canvas = selectionCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // 原始图像加载后初始化框选画布
    useEffect(() => {
        if (originalImage && selectionCanvasRef.current) {
            const canvas = selectionCanvasRef.current;
            // 直接设置DOM宽高属性
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            console.log("初始化框选画布尺寸:", canvas.width, "x", canvas.height);
        }
    }, [originalImage]);

    // 当框选状态改变时更新画布
    useEffect(() => {
        if (showSelectionTool) {
            drawSelectionBox();
        }
    }, [showSelectionTool, selectionStart, selectionEnd, isSelecting]);

    // 开始检测框线
    const startGridLineDetection = () => {
        if (!originalImage) return;
        
        setIsDetectingGridLines(true);
        
        // 创建canvas用于检测和显示
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        
        // 绘制原图
        ctx.drawImage(originalImage, 0, 0);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 执行边缘检测
        setTimeout(() => {
            let horizontalLines = [];
            let verticalLines = [];
            
            if (detectionMode === 'general') {
                // 通用检测模式 - 使用之前的Sobel算子检测
                const edgeData = detectEdges(imageData, detectionThreshold);
                const result = findGridLines(edgeData, canvas.width, canvas.height);
                horizontalLines = result.horizontalLines;
                verticalLines = result.verticalLines;
            } else {
                // 白色边框检测模式 - 专门针对白色边框优化
                const result = detectWhiteBorders(imageData, canvas.width, canvas.height);
                horizontalLines = result.horizontalLines;
                verticalLines = result.verticalLines;
                
                // 如果用户选择了使用预期行列数，则使用预先定义的网格
                if (useExpectedGrid && expectedRows > 0 && expectedCols > 0) {
                    // 使用预期行列数计算均匀的网格
                    horizontalLines = [];
                    verticalLines = [];
                    
                    // 生成行线（水平线）
                    const rowHeight = canvas.height / expectedRows;
                    for (let i = 0; i <= expectedRows; i++) {
                        horizontalLines.push(Math.round(i * rowHeight));
                    }
                    
                    // 生成列线（垂直线）
                    const colWidth = canvas.width / expectedCols;
                    for (let i = 0; i <= expectedCols; i++) {
                        verticalLines.push(Math.round(i * colWidth));
                    }
                }
            }
            
            console.log("检测到水平线:", horizontalLines.length);
            console.log("检测到垂直线:", verticalLines.length);
            
            // 根据检测到的线条划分精灵区域
            const sprites = divideIntoSprites(horizontalLines, verticalLines, canvas.width, canvas.height);
            
            // 更新状态
            setDetectedSprites(sprites);
            
            // 创建预览
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = canvas.width;
            previewCanvas.height = canvas.height;
            const previewCtx = previewCanvas.getContext('2d');
            
            // 绘制原图
            previewCtx.drawImage(originalImage, 0, 0);
            
            // 绘制检测到的网格线
            previewCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            previewCtx.lineWidth = 2;
            
            // 绘制水平线
            horizontalLines.forEach(y => {
                previewCtx.beginPath();
                previewCtx.moveTo(0, y);
                previewCtx.lineTo(canvas.width, y);
                previewCtx.stroke();
            });
            
            // 绘制垂直线
            verticalLines.forEach(x => {
                previewCtx.beginPath();
                previewCtx.moveTo(x, 0);
                previewCtx.lineTo(x, canvas.height);
                previewCtx.stroke();
            });
            
            // 绘制检测到的精灵区域
            previewCtx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
            previewCtx.lineWidth = 2;
            
            // 首先绘制原始检测区域（淡绿色）
            if (excludeBorders) {
                const originalCells = [];
                
                // 生成原始单元格
                for (let i = 0; i < horizontalLines.length - 1; i++) {
                    for (let j = 0; j < verticalLines.length - 1; j++) {
                        const x = verticalLines[j];
                        const y = horizontalLines[i];
                        const width = verticalLines[j + 1] - x;
                        const height = horizontalLines[i + 1] - y;
                        
                        // 忽略太小的单元格
                        if (width < 10 || height < 10) continue;
                        
                        originalCells.push({
                            x, y, width, height
                        });
                    }
                }
                
                // 绘制原始单元格
                previewCtx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
                originalCells.forEach(cell => {
                    previewCtx.strokeRect(cell.x, cell.y, cell.width, cell.height);
                });
                
                // 绘制排除边框后的精确内容区域（亮绿色）
                previewCtx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
            }
            
            // 绘制最终精灵区域
            sprites.forEach(sprite => {
                previewCtx.strokeRect(sprite.x, sprite.y, sprite.width, sprite.height);
                
                // 为每个精灵添加编号
                previewCtx.fillStyle = 'rgba(0, 255, 0, 0.9)';
                previewCtx.font = 'bold 14px Arial';
                previewCtx.fillText(`#${sprite.id + 1}`, sprite.x + 5, sprite.y + 20);
            });
            
            // 更新预览
            setDetectionCanvas(previewCanvas);
            setIsDetectingGridLines(false);
        }, 100);
    };
    
    // 检测白色边框
    const detectWhiteBorders = (imageData, width, height) => {
        const data = imageData.data;
        const whiteThreshold = 230; // 白色的阈值，小于这个值的不被认为是白色
        const contrastThreshold = 50; // 白色与非白色的对比度阈值
        
        // 用于记录每个像素行/列是否可能包含边框
        const horizontalBorderCandidates = new Array(height).fill(0);
        const verticalBorderCandidates = new Array(width).fill(0);
        
        // 扫描每个像素，检测白色区域
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // 判断当前像素是否为白色
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // 检查是否是白色（所有RGB通道值都很高）
                const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;
                
                if (isWhite) {
                    // 检查水平方向对比度
                    const leftIdx = (y * width + (x - 1)) * 4;
                    const rightIdx = (y * width + (x + 1)) * 4;
                    
                    const hasHorizontalContrast = 
                        Math.abs(r - data[leftIdx]) > contrastThreshold || 
                        Math.abs(r - data[rightIdx]) > contrastThreshold;
                    
                    // 检查垂直方向对比度
                    const topIdx = ((y - 1) * width + x) * 4;
                    const bottomIdx = ((y + 1) * width + x) * 4;
                    
                    const hasVerticalContrast = 
                        Math.abs(r - data[topIdx]) > contrastThreshold || 
                        Math.abs(r - data[bottomIdx]) > contrastThreshold;
                    
                    if (hasHorizontalContrast) {
                        horizontalBorderCandidates[y]++;
                    }
                    
                    if (hasVerticalContrast) {
                        verticalBorderCandidates[x]++;
                    }
                }
            }
        }
        
        // 进一步分析哪些像素行/列可能包含边框线
        // 使用阈值确定哪些位置有足够多的边框候选像素
        const horizontalThreshold = width * 0.1; // 水平线需要至少10%宽度的边框候选点
        const verticalThreshold = height * 0.1; // 垂直线需要至少10%高度的边框候选点
        
        const horizontalLines = [];
        const verticalLines = [];
        
        // 查找水平边框线
        for (let y = 0; y < height; y++) {
            if (horizontalBorderCandidates[y] > horizontalThreshold) {
                // 寻找局部极大值，确保不会选择过于接近的线
                let isLocalMax = true;
                const windowSize = Math.floor(height * 0.02); // 使用图像高度的2%作为窗口大小
                
                for (let j = 1; j <= windowSize; j++) {
                    if (y - j >= 0 && horizontalBorderCandidates[y] < horizontalBorderCandidates[y - j]) {
                        isLocalMax = false;
                        break;
                    }
                    if (y + j < height && horizontalBorderCandidates[y] < horizontalBorderCandidates[y + j]) {
                        isLocalMax = false;
                        break;
                    }
                }
                
                if (isLocalMax) {
                    horizontalLines.push(y);
                }
            }
        }
        
        // 查找垂直边框线
        for (let x = 0; x < width; x++) {
            if (verticalBorderCandidates[x] > verticalThreshold) {
                // 寻找局部极大值，确保不会选择过于接近的线
                let isLocalMax = true;
                const windowSize = Math.floor(width * 0.02); // 使用图像宽度的2%作为窗口大小
                
                for (let j = 1; j <= windowSize; j++) {
                    if (x - j >= 0 && verticalBorderCandidates[x] < verticalBorderCandidates[x - j]) {
                        isLocalMax = false;
                        break;
                    }
                    if (x + j < width && verticalBorderCandidates[x] < verticalBorderCandidates[x + j]) {
                        isLocalMax = false;
                        break;
                    }
                }
                
                if (isLocalMax) {
                    verticalLines.push(x);
                }
            }
        }
        
        return { horizontalLines, verticalLines };
    };
    
    // 基于Sobel算子的边缘检测
    const detectEdges = (imageData, threshold) => {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // 创建输出数组
        const output = new Uint8ClampedArray(width * height);
        
        // Sobel算子
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                // 获取周围像素
                const tl = getGrayscale(data, (y - 1) * width + (x - 1));
                const t = getGrayscale(data, (y - 1) * width + x);
                const tr = getGrayscale(data, (y - 1) * width + (x + 1));
                const l = getGrayscale(data, y * width + (x - 1));
                const r = getGrayscale(data, y * width + (x + 1));
                const bl = getGrayscale(data, (y + 1) * width + (x - 1));
                const b = getGrayscale(data, (y + 1) * width + x);
                const br = getGrayscale(data, (y + 1) * width + (x + 1));
                
                // 水平和垂直梯度
                const gx = -tl + tr - 2 * l + 2 * r - bl + br;
                const gy = -tl - 2 * t - tr + bl + 2 * b + br;
                
                // 计算梯度大小
                const g = Math.sqrt(gx * gx + gy * gy);
                
                // 应用阈值
                output[y * width + x] = g > threshold ? 255 : 0;
            }
        }
        
        return output;
    };
    
    // 获取像素的灰度值
    const getGrayscale = (data, index) => {
        index = index * 4;
        if (index < 0 || index >= data.length) return 0;
        
        // 使用BT.709亮度公式计算灰度
        return 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
    };
    
    // 查找网格线
    const findGridLines = (edgeData, width, height) => {
        const horizontalLinesCounts = new Array(height).fill(0);
        const verticalLinesCounts = new Array(width).fill(0);
        
        // 统计每行/列的边缘像素数量
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (edgeData[y * width + x] > 0) {
                    horizontalLinesCounts[y]++;
                    verticalLinesCounts[x]++;
                }
            }
        }
        
        // 找出峰值（可能的网格线）
        const horizontalLines = findPeaks(horizontalLinesCounts, width * 0.1); // 至少10%的宽度有边缘像素
        const verticalLines = findPeaks(verticalLinesCounts, height * 0.1); // 至少10%的高度有边缘像素
        
        return { horizontalLines, verticalLines };
    };
    
    // 查找数组中的峰值
    const findPeaks = (array, threshold) => {
        const peaks = [];
        const windowSize = 5; // 局部窗口大小
        
        for (let i = windowSize; i < array.length - windowSize; i++) {
            let isPeak = true;
            let localMax = array[i];
            
            // 检查是否是局部最大值
            for (let j = 1; j <= windowSize; j++) {
                if (array[i - j] > localMax || array[i + j] > localMax) {
                    isPeak = false;
                    break;
                }
            }
            
            // 检查是否满足阈值条件
            if (isPeak && array[i] > threshold) {
                peaks.push(i);
                
                // 跳过临近区域，避免重复检测
                i += windowSize;
            }
        }
        
        return peaks;
    };
    
    // 将图像分割成精灵
    const divideIntoSprites = (horizontalLines, verticalLines, width, height) => {
        // 确保网格线包含图像边界
        if (!horizontalLines.includes(0)) horizontalLines.unshift(0);
        if (!horizontalLines.includes(height - 1)) horizontalLines.push(height - 1);
        if (!verticalLines.includes(0)) verticalLines.unshift(0);
        if (!verticalLines.includes(width - 1)) verticalLines.push(width - 1);
        
        // 对网格线排序
        horizontalLines.sort((a, b) => a - b);
        verticalLines.sort((a, b) => a - b);
        
        // 创建精灵
        const sprites = [];
        
        // 遍历所有单元格
        for (let i = 0; i < horizontalLines.length - 1; i++) {
            for (let j = 0; j < verticalLines.length - 1; j++) {
                let x = verticalLines[j];
                let y = horizontalLines[i];
                let cellWidth = verticalLines[j + 1] - x;
                let cellHeight = horizontalLines[i + 1] - y;
                
                // 忽略太小的单元格
                if (cellWidth < 10 || cellHeight < 10) continue;
                
                // 如果开启了边框排除功能，调整坐标和尺寸
                if (excludeBorders && detectionMode === 'whiteBorder') {
                    if (autoTrimEdges) {
                        // 自动检测边缘，这需要分析每个单元格
                        const area = {
                            x,
                            y,
                            width: cellWidth,
                            height: cellHeight
                        };
                        const trimmedArea = autoDetectContentArea(area);
                        
                        x = trimmedArea.x;
                        y = trimmedArea.y;
                        cellWidth = trimmedArea.width;
                        cellHeight = trimmedArea.height;
                    } else {
                        // 使用固定的边框大小
                        x += borderSize;
                        y += borderSize;
                        cellWidth -= borderSize * 2;
                        cellHeight -= borderSize * 2;
                        
                        // 确保尺寸不小于10像素
                        cellWidth = Math.max(10, cellWidth);
                        cellHeight = Math.max(10, cellHeight);
                    }
                }
                
                sprites.push({
                    id: sprites.length,
                    x,
                    y,
                    width: cellWidth,
                    height: cellHeight,
                    originalX: x,
                    originalY: y,
                    originalWidth: cellWidth,
                    originalHeight: cellHeight
                });
            }
        }
        
        return sprites;
    };
    
    // 自动检测内容区域，去除边框
    const autoDetectContentArea = (area) => {
        if (!originalImage) return area;
        
        // 创建临时画布以分析区域
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = area.width;
        tempCanvas.height = area.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 绘制区域到临时画布
        tempCtx.drawImage(
            originalImage,
            area.x, area.y, area.width, area.height,
            0, 0, area.width, area.height
        );
        
        // 获取区域的图像数据
        const imageData = tempCtx.getImageData(0, 0, area.width, area.height);
        const data = imageData.data;
        
        // 设置白色阈值（接近白色的像素会被认为是背景）
        const whiteThreshold = 230;
        
        // 初始化边界值
        let left = area.width;
        let right = 0;
        let top = area.height;
        let bottom = 0;
        
        // 扫描所有像素，确定实际内容边界
        for (let y = 0; y < area.height; y++) {
            for (let x = 0; x < area.width; x++) {
                const i = (y * area.width + x) * 4;
                
                // 检查像素是否是边框颜色（白色）
                // 这里使用简单的判断：如果RGB值都很高（接近白色），则认为是边框
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                // 如果像素不是白色，则它可能是内容的一部分
                // 且透明度需要大于0
                if (
                    a > 0 && (
                        r < whiteThreshold ||
                        g < whiteThreshold ||
                        b < whiteThreshold
                    )
                ) {
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                }
            }
        }
        
        // 如果没有找到非边框内容，返回原始区域
        if (left > right || top > bottom) {
            return area;
        }
        
        // 计算新的边界，添加小边距（1像素）以确保内容完整性
        const padding = 1;
        left = Math.max(0, left - padding);
        top = Math.max(0, top - padding);
        right = Math.min(area.width - 1, right + padding);
        bottom = Math.min(area.height - 1, bottom + padding);
        
        // 返回调整后的区域
        return {
            x: area.x + left,
            y: area.y + top,
            width: right - left + 1,
            height: bottom - top + 1
        };
    };

    // 应用检测结果
    const applyDetectionResult = () => {
        if (detectedSprites.length === 0) return;
        
        // 为每个精灵创建图像
        const spritePromises = detectedSprites.map(sprite => {
            return new Promise(resolve => {
                try {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = sprite.width;
                    tempCanvas.height = sprite.height;
                    const tempCtx = tempCanvas.getContext("2d");
                    
                    // 绘制精灵区域
                    tempCtx.drawImage(
                        originalImage,
                        sprite.x,
                        sprite.y,
                        sprite.width,
                        sprite.height,
                        0,
                        0,
                        sprite.width,
                        sprite.height
                    );
                    
                    // 添加图像数据到精灵对象
                    sprite.image = tempCanvas.toDataURL();
                    resolve(sprite);
                } catch (error) {
                    console.error("创建精灵图像失败:", error);
                    resolve(null);
                }
            });
        });
        
        // 等待所有精灵图像创建完成
        Promise.all(spritePromises).then(sprites => {
            // 过滤掉失败的精灵
            const validSprites = sprites.filter(sprite => sprite !== null);
            
            // 更新精灵和帧顺序
            setSprites(validSprites);
            setFrameOrder(validSprites.map(sprite => sprite.id));
            
            // 重置检测状态
            setDetectionCanvas(null);
            setDetectedSprites([]);
        });
    };

    return (
        <div className='app-container'>
            <div className='language-switch'>
                <button
                    className={`lang-button ${language === "zh" ? "active" : ""}`}
                    onClick={toggleLanguage}
                >
                    中文 / English
                </button>
            </div>

            <h1>{t.title}</h1>

            <div className='upload-section'>
                <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    id='image-upload'
                    className='file-input'
                />
                <label htmlFor='image-upload' className='file-label'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        style={{ marginRight: "8px" }}
                    >
                        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                        <polyline points='17 8 12 3 7 8'></polyline>
                        <line x1='12' y1='3' x2='12' y2='15'></line>
                    </svg>
                    {t.chooseImage}
                </label>
            </div>

            {originalImage && (
                <div className='controls-section'>
                    <div className='mode-switch'>
                        <button
                            className={`mode-button ${!customSize ? "active" : ""}`}
                            onClick={toggleSizeMode}
                            disabled={!customSize}
                        >
                            {t.byRowsCols}
                        </button>
                        <button
                            className={`mode-button ${customSize ? "active" : ""}`}
                            onClick={toggleSizeMode}
                            disabled={customSize}
                        >
                            {t.bySize}
                        </button>
                    </div>

                    {/* 添加框线检测功能按钮 */}
                    <div className='grid-detection'>
                        <button
                            className='detection-button'
                            onClick={startGridLineDetection}
                            disabled={isDetectingGridLines}
                        >
                            {isDetectingGridLines ? (
                                <>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{
                                            marginRight: "8px",
                                            animation: "spin 2s linear infinite",
                                        }}
                                    >
                                        <circle cx='12' cy='12' r='10'></circle>
                                        <path d='M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'></path>
                                    </svg>
                                    {t.detectingGridLines}
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px" }}
                                    >
                                        <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
                                        <line x1='3' y1='9' x2='21' y2='9'></line>
                                        <line x1='3' y1='15' x2='21' y2='15'></line>
                                        <line x1='9' y1='3' x2='9' y2='21'></line>
                                        <line x1='15' y1='3' x2='15' y2='21'></line>
                                    </svg>
                                    {t.detectGridLines}
                                </>
                            )}
                        </button>
                        
                        <div className='detection-options'>
                            <div className='detection-mode'>
                                <label>{t.detectionModeDescription}</label>
                                <select 
                                    value={detectionMode} 
                                    onChange={(e) => setDetectionMode(e.target.value)}
                                    disabled={isDetectingGridLines}
                                >
                                    <option value="general">{t.detectionModeGeneral}</option>
                                    <option value="whiteBorder">{t.detectionModeWhiteBorder}</option>
                                </select>
                            </div>

                            {detectionMode === 'whiteBorder' && (
                                <div className='expected-grid'>
                                    <div className='expected-grid-controls'>
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                checked={useExpectedGrid}
                                                onChange={(e) => setUseExpectedGrid(e.target.checked)}
                                                disabled={isDetectingGridLines}
                                            />
                                            {t.useExpectedGrid}
                                        </label>
                                    </div>
                                    
                                    {useExpectedGrid && (
                                        <div className='expected-grid-inputs'>
                                            <div>
                                                <label>{t.expectedRows}</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    value={expectedRows}
                                                    onChange={(e) => setExpectedRows(parseInt(e.target.value))}
                                                    disabled={isDetectingGridLines}
                                                />
                                            </div>
                                            <div>
                                                <label>{t.expectedCols}</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    value={expectedCols}
                                                    onChange={(e) => setExpectedCols(parseInt(e.target.value))}
                                                    disabled={isDetectingGridLines}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className='border-options'>
                                        <div className='edge-trim-controls'>
                                            <label>
                                                <input 
                                                    type="checkbox" 
                                                    checked={excludeBorders}
                                                    onChange={(e) => setExcludeBorders(e.target.checked)}
                                                    disabled={isDetectingGridLines}
                                                />
                                                {t.excludeBorders}
                                            </label>
                                        </div>
                                        
                                        {excludeBorders && (
                                            <div className='border-size-controls'>
                                                <div>
                                                    <label>{t.borderSize}</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="10"
                                                        value={borderSize}
                                                        onChange={(e) => setBorderSize(parseInt(e.target.value))}
                                                        disabled={isDetectingGridLines || autoTrimEdges}
                                                    />
                                                </div>
                                                <div className='auto-trim-controls'>
                                                    <label>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={autoTrimEdges}
                                                            onChange={(e) => setAutoTrimEdges(e.target.checked)}
                                                            disabled={isDetectingGridLines}
                                                        />
                                                        {t.autoTrimEdges}
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='threshold-control'>
                            <label>{t.gridLinesThreshold}</label>
                            <input
                                type='range'
                                min='50'
                                max='250'
                                value={detectionThreshold}
                                onChange={(e) => setDetectionThreshold(parseInt(e.target.value))}
                                disabled={isDetectingGridLines || (detectionMode === 'whiteBorder' && useExpectedGrid)}
                            />
                            <span>{detectionThreshold}</span>
                        </div>
                    </div>

                    {/* 显示框线检测结果 */}
                    {detectionCanvas && (
                        <div className='detection-preview'>
                            <div className='detection-canvas-container'>
                                <canvas
                                    ref={detectionCanvasRef}
                                    width={originalImage.width}
                                    height={originalImage.height}
                                    style={{ display: 'none' }}
                                ></canvas>
                                <img 
                                    src={detectionCanvas.toDataURL()} 
                                    alt='检测到的框线'
                                    className='detection-preview-image' 
                                />
                            </div>
                            <div className='detection-info'>
                                <p>
                                    {t.gridLinesDetected.replace('{count}', detectedSprites.length)}
                                </p>
                                <button
                                    className='apply-detection-button'
                                    onClick={applyDetectionResult}
                                    disabled={detectedSprites.length === 0}
                                >
                                    {t.applyDetection}
                                </button>
                            </div>
                        </div>
                    )}

                    {!customSize ? (
                        <div className='grid-controls'>
                            <div>
                                <label>{t.cols}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={cols}
                                    onChange={e => handleGridChange(e, "cols")}
                                />
                            </div>
                            <div>
                                <label>{t.rows}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={rows}
                                    onChange={e => handleGridChange(e, "rows")}
                                />
                            </div>
                            <div className='info-box'>
                                <span>
                                    {t.frameSizeInfo} {Math.floor(originalImage.width / cols)} ×{" "}
                                    {Math.floor(originalImage.height / rows)} {t.px}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className='grid-controls'>
                            <div>
                                <label>{t.frameWidth}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={spriteWidth}
                                    onChange={e => handleSpriteSize(e, "width")}
                                />
                                <span>{t.px}</span>
                            </div>
                            <div>
                                <label>{t.frameHeight}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={spriteHeight}
                                    onChange={e => handleSpriteSize(e, "height")}
                                />
                                <span>{t.px}</span>
                            </div>
                            <div className='info-box'>
                                <span>
                                    {t.generateFramesInfo}{" "}
                                    {Math.floor(originalImage.width / spriteWidth)} ×{" "}
                                    {Math.floor(originalImage.height / spriteHeight)} {t.frames}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className='grid-controls delay-control'>
                        <div>
                            <label>{t.frameDelay}</label>
                            <input
                                type='number'
                                min='10'
                                max='1000'
                                value={delay}
                                onChange={e => setDelay(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 隐藏的画布用于图像处理 */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {sprites.length > 0 && (
                <div className='main-content'>
                    <div className='sprites-container'>
                        <h3>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                style={{ marginRight: "8px", verticalAlign: "middle" }}
                            >
                                <line x1='4' y1='9' x2='20' y2='9'></line>
                                <line x1='4' y1='15' x2='20' y2='15'></line>
                                <line x1='10' y1='3' x2='8' y2='21'></line>
                                <line x1='16' y1='3' x2='14' y2='21'></line>
                            </svg>
                            {t.sortFrames}
                        </h3>
                        <div className='frames-list' style={{ 
                            gridTemplateColumns: `repeat(${frameItemsPerRow}, minmax(100px, 1fr))` 
                        }}>
                            {frameOrder.map((id, index) => {
                                const sprite = sprites.find(s => s.id === id);
                                if (!sprite) return null;

                                return (
                                    <div
                                        key={id}
                                        className={`frame-item ${
                                            selectedFrameId === id ? "selected" : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedFrameId(id);
                                            setGifPreview(null); // 清除GIF预览
                                        }}
                                    >
                                        <img
                                            src={sprite.image}
                                            alt={`动画帧 ${index + 1} - 坐标 (${sprite.x}, ${
                                                sprite.y
                                            })`}
                                        />
                                        <div className='frame-controls'>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    moveFrame(id, "up");
                                                }}
                                                disabled={index === 0}
                                                title='上移'
                                            >
                                                ↑
                                            </button>
                                            <span>{index + 1}</span>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    moveFrame(id, "down");
                                                }}
                                                disabled={index === frameOrder.length - 1}
                                                title='下移'
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedFrameId !== null && (
                            <div className='frame-customize-panel'>
                                <h3>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                                    >
                                        <rect
                                            x='3'
                                            y='3'
                                            width='18'
                                            height='18'
                                            rx='2'
                                            ry='2'
                                        ></rect>
                                        <line x1='9' y1='3' x2='9' y2='21'></line>
                                        <line x1='15' y1='3' x2='15' y2='21'></line>
                                        <line x1='3' y1='9' x2='21' y2='9'></line>
                                        <line x1='3' y1='15' x2='21' y2='15'></line>
                                    </svg>
                                    {t.customizeFrames}
                                </h3>
                                {(() => {
                                    const sprite = sprites.find(s => s.id === selectedFrameId);
                                    if (!sprite) return null;

                                    return (
                                        <div className='customize-controls'>
                                            {/* 添加框选工具按钮 */}
                                            <div className='selection-tool-wrapper'>
                                                <button
                                                    className='selection-tool-button'
                                                    onClick={startSelectionTool}
                                                    disabled={showSelectionTool}
                                                >
                                                    <svg
                                                        xmlns='http://www.w3.org/2000/svg'
                                                        width='16'
                                                        height='16'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        strokeWidth='2'
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        style={{ marginRight: "8px" }}
                                                    >
                                                        <path d='M3 3h18v18H3z'></path>
                                                    </svg>
                                                    {t.selectionTool}
                                                </button>
                                                <p className='selection-tip'>{t.dragToSelect}</p>
                                            </div>

                                            <div className='position-controls'>
                                                <div>
                                                    <label>{t.posX}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.x}
                                                        onChange={e =>
                                                            updateSpriteProperties(
                                                                selectedFrameId,
                                                                { x: e.target.value }
                                                            )
                                                        }
                                                        min='0'
                                                        max={originalImage.width - sprite.width}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <div>
                                                    <label>{t.posY}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.y}
                                                        onChange={e =>
                                                            updateSpriteProperties(
                                                                selectedFrameId,
                                                                { y: e.target.value }
                                                            )
                                                        }
                                                        min='0'
                                                        max={originalImage.height - sprite.height}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <button
                                                    className='reset-button'
                                                    onClick={() =>
                                                        resetSpritePosition(selectedFrameId)
                                                    }
                                                >
                                                    {t.resetPos}
                                                </button>
                                            </div>
                                            <div className='size-controls'>
                                                <div>
                                                    <label>{t.width}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.width}
                                                        onChange={e =>
                                                            updateSpriteProperties(
                                                                selectedFrameId,
                                                                { width: e.target.value }
                                                            )
                                                        }
                                                        min='10'
                                                        max={originalImage.width - sprite.x}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <div>
                                                    <label>{t.height}</label>
                                                    <input
                                                        type='number'
                                                        value={sprite.height}
                                                        onChange={e =>
                                                            updateSpriteProperties(
                                                                selectedFrameId,
                                                                { height: e.target.value }
                                                            )
                                                        }
                                                        min='10'
                                                        max={originalImage.height - sprite.y}
                                                    />
                                                    <span>{t.px}</span>
                                                </div>
                                                <button
                                                    className='reset-button'
                                                    onClick={() => resetSpriteSize(selectedFrameId)}
                                                >
                                                    {t.resetSize}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* 框选工具画布 */}
                        {showSelectionTool && selectedFrameId !== null && (
                            <div
                                className='selection-canvas-container'
                                onClick={e => {
                                    // 确保点击背景时也能关闭框选工具
                                    if (e.target.className === "selection-canvas-container") {
                                        cancelSelection(e);
                                    }
                                }}
                            >
                                <div className='selection-canvas-wrapper'>
                                    <canvas
                                        ref={selectionCanvasRef}
                                        className='selection-canvas'
                                        width={originalImage ? originalImage.width : 200}
                                        height={originalImage ? originalImage.height : 200}
                                        onMouseDown={handleSelectionStart}
                                        onMouseMove={handleSelectionMove}
                                        onMouseUp={handleSelectionEnd}
                                    ></canvas>
                                </div>
                                <div className='selection-buttons'>
                                    <button className='apply-selection' onClick={applySelection}>
                                        {t.applySelection}
                                    </button>
                                    <button className='cancel-selection' onClick={cancelSelection}>
                                        {t.cancelSelection}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='preview-section'>
                        <button
                            onClick={generateGifPreview}
                            className='preview-button'
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{
                                            marginRight: "8px",
                                            animation: "spin 2s linear infinite",
                                        }}
                                    >
                                        <circle cx='12' cy='12' r='10'></circle>
                                        <path d='M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'></path>
                                    </svg>
                                    {t.generating}
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px" }}
                                    >
                                        <path d='M12 3v12l8-8-8-8z'></path>
                                        <path d='M3 8h6v13H3z'></path>
                                    </svg>
                                    {t.generatePreview}
                                </>
                            )}
                        </button>

                        {gifPreview ? (
                            <div className='gif-preview'>
                                <h3>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                                    >
                                        <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'></polygon>
                                    </svg>
                                    {t.gifPreview}
                                </h3>
                                <img src={gifPreview} alt='动画GIF预览效果' />
                                <div className='save-buttons'>
                                    <button onClick={saveGif} className='save-button'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            width='20'
                                            height='20'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            style={{ marginRight: "8px" }}
                                        >
                                            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                                            <polyline points='7 10 12 15 17 10'></polyline>
                                            <line x1='12' y1='15' x2='12' y2='3'></line>
                                        </svg>
                                        {t.saveGif}
                                    </button>
                                    <button onClick={saveApng} className='save-button save-apng'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            width='20'
                                            height='20'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            style={{ marginRight: "8px" }}
                                        >
                                            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                                            <polyline points='7 10 12 15 17 10'></polyline>
                                            <line x1='12' y1='15' x2='12' y2='3'></line>
                                        </svg>
                                        {t.saveApng}
                                    </button>
                                </div>
                            </div>
                        ) : selectedFrameId !== null && (
                            <div className='selected-frame-preview'>
                                <h3>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='20'
                                        height='20'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        style={{ marginRight: "8px", verticalAlign: "middle" }}
                                    >
                                        <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
                                    </svg>
                                    所选帧预览
                                </h3>
                                {(() => {
                                    const handleDownload = () => {
                                        // 创建一个临时的a标签用于下载
                                        const a = document.createElement('a');
                                        a.href = sprite.image;
                                        a.download = `帧_${frameOrder.indexOf(selectedFrameId) + 1}.png`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    };
                                    const sprite = sprites.find(s => s.id === selectedFrameId);
                                    if (!sprite) return null;
                                    return (
                                        <div className='selected-frame-image-container'>
                                            <img 
                                                src={sprite.image} 
                                                alt={`帧 ${frameOrder.indexOf(selectedFrameId) + 1}`}
                                                style={{ border: '1px solid #00ff00' }}
                                            />
                                            <button 
                                                className="download-frame-btn"
                                                onClick={handleDownload}
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '8px 15px',
                                                    backgroundColor: '#4CAF50',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 'fit-content',
                                                    margin: '10px auto 0'
                                                }}
                                            >
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    width="16" 
                                                    height="16" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                    style={{ marginRight: '5px' }}
                                                >
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="7 10 12 15 17 10"></polyline>
                                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                                </svg>
                                                下载所选帧
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 添加GitHub链接 */}
            <footer className='github-footer'>
                <a
                    href='https://github.com/zqq-nuli/4oImg-to-gif'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='github-link'
                >
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'></path>
                    </svg>
                    <span>GitHub</span>
                </a>
                <p className='issues-tip'>{t.issuesTip}</p>
            </footer>
        </div>
    );
}

export default App;
