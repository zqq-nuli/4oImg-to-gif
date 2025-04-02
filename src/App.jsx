import { useState, useRef, useEffect } from "react";
import "./App.css";
import GIF from "gif.js";
import JSZip from "jszip"; // 本地导入JSZip库

// 翻译字典
const translations = {
    zh: {
        title: "图片转GIF/APNG工具",
        dropHere: "拖放图片到这里或点击上传",
        uploadImage: "上传图片",
        cols: "列数",
        rows: "行数",
        frameDelay: "帧延迟",
        useDraggableLines: "使用自定义分割线",
        useCropBorder: "使用裁剪边框",
        dragLinesInfo: "拖动蓝线调整分割位置，双击添加/删除线",
        dragBorderInfo: "拖动红色边框调整裁剪区域",
        applyDraggableLines: "应用自定义分割",
        applyCropBorder: "应用裁剪边框",
        generateGif: "生成GIF",
        saveGif: "保存GIF",
        saveApng: "保存APNG",
        orderFrames: "排序帧",
        moveUp: "上移",
        moveDown: "下移",
        deleteFrame: "删除",
        language: "English",
        chooseImage: "选择图片",
        byRowsCols: "按行列数切分",
        bySize: "按精灵尺寸切分",
        byGridLines: "按分隔线切分", 
        byDraggableLines: "按可拖动分割线切分",
        detectGridLines: "检测分隔线", 
        gridLineThreshold: "分隔线阈值:", 
        horizontalLines: "检测到的横线:", 
        verticalLines: "检测到的竖线:", 
        applyDetectedGrid: "应用检测结果", 
        initDraggableLines: "初始化分割线",
        draggableLinesInfo: "拖动绿色线条调整分割位置",
        dragLinesInfo: "拖动绿色线条调整分割位置",
        applyDraggableLines: "应用分割线",
        cols: "列数:",
        rows: "行数:",
        frameWidth: "帧宽度:",
        frameHeight: "帧高度:",
        frameDelay: "帧延迟 (ms):",
        frameSizeInfo: "帧尺寸:",
        generateInfo: "可生成分割图:",
        generateFramesInfo: "可生成:",
        eachFrame: "每帧尺寸:",
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
        exportSplitImages: "导出分割图",
    },
    en: {
        title: "Image to GIF/APNG Tool",
        dropHere: "Drop image here or click to upload",
        uploadImage: "Upload Image",
        cols: "Columns",
        rows: "Rows",
        frameDelay: "Frame Delay",
        useDraggableLines: "Use Custom Split Lines",
        useCropBorder: "Use Crop Border",
        dragLinesInfo: "Drag blue lines to adjust split positions, double-click to add/remove lines",
        dragBorderInfo: "Drag red border to adjust crop area",
        applyDraggableLines: "Apply Custom Split",
        applyCropBorder: "Apply Crop Border",
        generateGif: "Generate GIF",
        saveGif: "Save GIF",
        saveApng: "Save APNG",
        orderFrames: "Order Frames",
        moveUp: "Move Up",
        moveDown: "Move Down",
        deleteFrame: "Delete",
        language: "中文",
        chooseImage: "Choose Image",
        byRowsCols: "Split by Rows & Columns",
        bySize: "Split by Sprite Size",
        byGridLines: "Split by Grid Lines", 
        byDraggableLines: "Split by Draggable Lines",
        detectGridLines: "Detect Grid Lines", 
        gridLineThreshold: "Grid Line Threshold:", 
        horizontalLines: "Horizontal Lines Detected:", 
        verticalLines: "Vertical Lines Detected:", 
        applyDetectedGrid: "Apply Detected Grid", 
        initDraggableLines: "Initialize Grid Lines",
        draggableLinesInfo: "Drag the green lines to adjust split positions",
        dragLinesInfo: "Drag the green lines to adjust split positions",
        applyDraggableLines: "Apply Grid Lines",
        cols: "Columns:",
        rows: "Rows:",
        frameWidth: "Frame Width:",
        frameHeight: "Frame Height:",
        frameDelay: "Frame Delay (ms):",
        frameSizeInfo: "Frame Size:",
        generateInfo: "Will generate:",
        generateFramesInfo: "Can generate:",
        eachFrame: "Each frame size:",
        frames: "frames",
        sortFrames: "Sort Frames Order",
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
        dragToSelect: "Drag to select area on image",
        applySelection: "Apply Selection",
        cancelSelection: "Cancel Selection",
        exportSplitImages: "Export Split Images",
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
    const [useGridLines, setUseGridLines] = useState(false); 
    const [gridLineThreshold, setGridLineThreshold] = useState(30); 
    const [detectedHLines, setDetectedHLines] = useState([]); 
    const [detectedVLines, setDetectedVLines] = useState([]); 
    const [frameOrder, setFrameOrder] = useState([]);
    const [gifPreview, setGifPreview] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [delay, setDelay] = useState(200); 
    const [language, setLanguage] = useState("zh"); 
    const [selectedFrameId, setSelectedFrameId] = useState(null); 
    const canvasRef = useRef(null);
    const gridCanvasRef = useRef(null); 
    const selectionCanvasRef = useRef(null); 
    const [isSelecting, setIsSelecting] = useState(false); 
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 }); 
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 }); 
    const [showSelectionTool, setShowSelectionTool] = useState(false); 
    
    // 新增状态 - 可拖动分割线
    const [draggableHLines, setDraggableHLines] = useState([]); // 水平分割线位置
    const [draggableVLines, setDraggableVLines] = useState([]); // 垂直分割线位置
    const [isDragging, setIsDragging] = useState(false); // 当前是否正在拖动
    const [currentDragLine, setCurrentDragLine] = useState(null); // 当前正在拖动的线
    const [useDraggableLines, setUseDraggableLines] = useState(false); // 是否使用可拖动分割线
    const draggableLinesCanvasRef = useRef(null); // 可拖动分割线的画布
    
    // 新增状态 - 裁剪边框
    const [useCropBorder, setUseCropBorder] = useState(false); // 是否使用裁剪边框
    const [cropBorder, setCropBorder] = useState({ left: 0, top: 0, right: 0, bottom: 0 }); // 裁剪边框位置
    const [isDraggingBorder, setIsDraggingBorder] = useState(false); // 当前是否正在拖动边框
    const [draggedBorder, setDraggedBorder] = useState(null); // 当前正在拖动的边框部分
    const cropBorderCanvasRef = useRef(null); // 裁剪边框的画布

    // 获取当前语言的翻译
    const t = language === "zh" ? translations.zh : translations.en;
    
    // 语言切换
    const toggleLanguage = () => {
        setLanguage(language === "zh" ? "en" : "zh");
    };
    
    // 切换尺寸模式
    const toggleSizeMode = (mode) => {
        // 先重置所有模式
        setCustomSize(false);
        setUseGridLines(false);
        setUseDraggableLines(false);
        
        // 然后设置选择的模式
        if (mode === 'gridLines') {
            setUseGridLines(true);
        } else if (mode === 'size') {
            setCustomSize(true);
        } else if (mode === 'draggableLines') {
            setUseDraggableLines(true);
        }
        // 'normal' 模式不需要额外设置，因为已经重置了所有模式
    };

    // 切换可拖动分割线模式
    const toggleUseDraggableLines = () => {
        setUseDraggableLines(!useDraggableLines);
        if (!useDraggableLines) {
            // 如果启用了可拖动分割线，则初始化分割线
            setTimeout(() => {
                initDraggableLines();
            }, 100);
        }
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

    // 检测图像中的分隔线
    const detectGridLines = () => {
        if (!originalImage || !canvasRef.current) return;

        // 设置canvas尺寸
        const canvas = canvasRef.current;
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 检测水平线
        const horizontalLines = [];
        const horizontalHistogram = new Array(canvas.height).fill(0);
        
        // 计算每行的白色或黑色像素数量
        for (let y = 0; y < canvas.height; y++) {
            let whitePixels = 0;
            let blackPixels = 0;
            let continuousWhite = 0;
            let continuousBlack = 0;
            let maxContinuousWhite = 0;
            let maxContinuousBlack = 0;
            
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // 检测纯白色像素 (RGB值都接近255)
                if (r > 250 && g > 250 && b > 250) {
                    whitePixels++;
                    continuousWhite++;
                    continuousBlack = 0;
                    if (continuousWhite > maxContinuousWhite) {
                        maxContinuousWhite = continuousWhite;
                    }
                } 
                // 检测纯黑色像素 (RGB值都接近0)
                else if (r < 10 && g < 10 && b < 10) {
                    blackPixels++;
                    continuousBlack++;
                    continuousWhite = 0;
                    if (continuousBlack > maxContinuousBlack) {
                        maxContinuousBlack = continuousBlack;
                    }
                } else {
                    continuousWhite = 0;
                    continuousBlack = 0;
                }
            }
            
            // 计算行分数 - 基于白色或黑色像素的数量和连续性
            const whiteRatio = whitePixels / canvas.width;
            const blackRatio = blackPixels / canvas.width;
            
            // 如果一行中有大量连续的白色或黑色像素，可能是分隔线
            if ((whiteRatio > 0.5 && maxContinuousWhite > canvas.width * 0.3) || 
                (blackRatio > 0.5 && maxContinuousBlack > canvas.width * 0.3)) {
                horizontalHistogram[y] = Math.max(whiteRatio, blackRatio) * 100;
            } else {
                horizontalHistogram[y] = 0;
            }
        }
        
        // 检测垂直线
        const verticalLines = [];
        const verticalHistogram = new Array(canvas.width).fill(0);
        
        // 计算每列的白色或黑色像素数量
        for (let x = 0; x < canvas.width; x++) {
            let whitePixels = 0;
            let blackPixels = 0;
            let continuousWhite = 0;
            let continuousBlack = 0;
            let maxContinuousWhite = 0;
            let maxContinuousBlack = 0;
            
            for (let y = 0; y < canvas.height; y++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // 检测纯白色像素
                if (r > 250 && g > 250 && b > 250) {
                    whitePixels++;
                    continuousWhite++;
                    continuousBlack = 0;
                    if (continuousWhite > maxContinuousWhite) {
                        maxContinuousWhite = continuousWhite;
                    }
                } 
                // 检测纯黑色像素
                else if (r < 10 && g < 10 && b < 10) {
                    blackPixels++;
                    continuousBlack++;
                    continuousWhite = 0;
                    if (continuousBlack > maxContinuousBlack) {
                        maxContinuousBlack = continuousBlack;
                    }
                } else {
                    continuousWhite = 0;
                    continuousBlack = 0;
                }
            }
            
            // 计算列分数
            const whiteRatio = whitePixels / canvas.height;
            const blackRatio = blackPixels / canvas.height;
            
            // 如果一列中有大量连续的白色或黑色像素，可能是分隔线
            if ((whiteRatio > 0.5 && maxContinuousWhite > canvas.height * 0.3) || 
                (blackRatio > 0.5 && maxContinuousBlack > canvas.height * 0.3)) {
                verticalHistogram[x] = Math.max(whiteRatio, blackRatio) * 100;
            } else {
                verticalHistogram[x] = 0;
            }
        }
        
        // 找出水平方向的分隔线
        let lastLinePos = -1;
        for (let y = 0; y < canvas.height; y++) {
            if (horizontalHistogram[y] > gridLineThreshold) {
                // 确保与上一条线有一定距离，避免检测到相邻的线
                if (lastLinePos === -1 || y - lastLinePos > 5) {
                    horizontalLines.push(y);
                    lastLinePos = y;
                }
            }
        }
        
        // 找出垂直方向的分隔线
        lastLinePos = -1;
        for (let x = 0; x < canvas.width; x++) {
            if (verticalHistogram[x] > gridLineThreshold) {
                // 确保与上一条线有一定距离，避免检测到相邻的线
                if (lastLinePos === -1 || x - lastLinePos > 5) {
                    verticalLines.push(x);
                    lastLinePos = x;
                }
            }
        }
        
        // 验证分隔线是否将图像分割成大致相等的区域
        const validatedHLines = validateEqualSpacing(horizontalLines, canvas.height);
        const validatedVLines = validateEqualSpacing(verticalLines, canvas.width);
        
        // 更新检测到的线
        setDetectedHLines(validatedHLines);
        setDetectedVLines(validatedVLines);
        
        // 绘制检测到的分隔线
        drawGridLines(validatedHLines, validatedVLines);
        
        // 根据检测结果更新行列数
        if (validatedHLines.length > 0) {
            setRows(validatedHLines.length + 1);
        }
        
        if (validatedVLines.length > 0) {
            setCols(validatedVLines.length + 1);
        }
    };
    
    // 验证分隔线是否将图像分割成大致相等的区域
    const validateEqualSpacing = (lines, totalSize) => {
        if (lines.length <= 1) return lines;
        
        // 添加起始位置（0）和结束位置（图像尺寸）
        const allLines = [0, ...lines, totalSize];
        
        // 计算区域尺寸
        const sizes = [];
        for (let i = 0; i < allLines.length - 1; i++) {
            sizes.push(allLines[i + 1] - allLines[i]);
        }
        
        // 计算平均尺寸
        const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
        
        // 计算每个区域与平均尺寸的偏差
        const deviations = sizes.map(size => Math.abs(size - avgSize) / avgSize);
        
        // 如果所有区域的尺寸偏差都在20%以内，认为是均匀分布的
        const isUniform = deviations.every(dev => dev < 0.2);
        
        if (isUniform) {
            return lines;
        } else {
            // 尝试找出最均匀的子集
            // 这里使用一个简单的方法：移除偏差最大的线，直到剩余的线形成均匀分布
            let currentLines = [...lines];
            let currentAllLines = [0, ...currentLines, totalSize];
            let currentSizes = [];
            let currentDeviations = [];
            let isCurrentUniform = false;
            
            while (currentLines.length > 0 && !isCurrentUniform) {
                // 重新计算尺寸和偏差
                currentAllLines = [0, ...currentLines, totalSize];
                currentSizes = [];
                
                for (let i = 0; i < currentAllLines.length - 1; i++) {
                    currentSizes.push(currentAllLines[i + 1] - currentAllLines[i]);
                }
                
                const currentAvgSize = currentSizes.reduce((sum, size) => sum + size, 0) / currentSizes.length;
                currentDeviations = currentSizes.map(size => Math.abs(size - currentAvgSize) / currentAvgSize);
                
                isCurrentUniform = currentDeviations.every(dev => dev < 0.2);
                
                if (!isCurrentUniform && currentLines.length > 0) {
                    // 找出偏差最大的区域对应的线
                    let maxDevIndex = 0;
                    let maxDev = 0;
                    
                    for (let i = 0; i < currentDeviations.length; i++) {
                        if (currentDeviations[i] > maxDev) {
                            maxDev = currentDeviations[i];
                            maxDevIndex = i;
                        }
                    }
                    
                    // 移除对应的线
                    // 如果是第一个或最后一个区域偏差最大，移除第一条或最后一条线
                    if (maxDevIndex === 0 && currentLines.length > 0) {
                        currentLines.shift();
                    } else if (maxDevIndex === currentDeviations.length - 1 && currentLines.length > 0) {
                        currentLines.pop();
                    } else if (currentLines.length > 1) {
                        // 否则移除与该区域相关的线（可能是前一条或后一条）
                        const prevDev = maxDevIndex > 0 ? currentDeviations[maxDevIndex - 1] : Infinity;
                        const nextDev = maxDevIndex < currentDeviations.length - 1 ? currentDeviations[maxDevIndex + 1] : Infinity;
                        
                        if (prevDev < nextDev) {
                            currentLines.splice(maxDevIndex - 1, 1);
                        } else {
                            currentLines.splice(maxDevIndex, 1);
                        }
                    } else {
                        // 如果只剩一条线，直接移除
                        currentLines = [];
                    }
                }
            }
            
            return currentLines;
        }
    };
    
    // 绘制检测到的分隔线
    const drawGridLines = (hLines, vLines) => {
        if (!originalImage || !gridCanvasRef.current) return;
        
        const canvas = gridCanvasRef.current;
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        const ctx = canvas.getContext("2d");
        
        // 先绘制原图（半透明）
        ctx.globalAlpha = 0.7;
        ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);
        ctx.globalAlpha = 1.0;
        
        // 绘制水平分隔线
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.lineWidth = 2;
        
        hLines.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        });
        
        // 绘制垂直分隔线
        ctx.strokeStyle = "rgba(0, 0, 255, 0.8)";
        
        vLines.forEach(x => {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        });
    };
    
    // 应用检测到的分隔线进行分割
    const applyDetectedGrid = () => {
        if (detectedHLines.length === 0 && detectedVLines.length === 0) {
            alert("未检测到分隔线，请调整阈值后重试");
            return;
        }
        
        // 根据检测到的分隔线计算每个精灵的位置和尺寸
        const gridPositions = [];
        
        // 添加起始位置（0）和结束位置（图像宽度/高度）
        const allHLines = [0, ...detectedHLines, originalImage.height];
        const allVLines = [0, ...detectedVLines, originalImage.width];
        
        // 根据分隔线创建精灵区域
        for (let i = 0; i < allHLines.length - 1; i++) {
            for (let j = 0; j < allVLines.length - 1; j++) {
                gridPositions.push({
                    x: allVLines[j],
                    y: allHLines[i],
                    width: allVLines[j + 1] - allVLines[j],
                    height: allHLines[i + 1] - allHLines[i]
                });
            }
        }
        
        // 创建精灵
        createSpritesFromPositions(gridPositions);
    };
    
    // 根据位置列表创建精灵
    const createSpritesFromPositions = (positions) => {
        if (!originalImage || positions.length === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        const newSprites = [];
        
        positions.forEach((pos, index) => {
            // 创建临时画布用于保存每个精灵
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = pos.width;
            tempCanvas.height = pos.height;
            const tempCtx = tempCanvas.getContext("2d");

            // 绘制当前精灵到临时画布
            tempCtx.drawImage(
                originalImage,
                pos.x,
                pos.y,
                pos.width,
                pos.height,
                0,
                0,
                pos.width,
                pos.height
            );

            // 保存精灵数据
            newSprites.push({
                id: index,
                image: tempCanvas.toDataURL(),
                x: pos.x,
                y: pos.y,
                width: pos.width,
                height: pos.height,
                originalX: pos.x,
                originalY: pos.y,
                originalWidth: pos.width,
                originalHeight: pos.height,
            });
        });
        
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

            // 直接设置canvas DOM宽高属性，不使用setAttribute
            setTimeout(() => {
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
            // 直接设置canvas DOM宽高属性
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

    // 初始化可拖动分割线
    const initDraggableLines = () => {
        if (!originalImage) {
            console.error("无法初始化分割线：原始图像不存在");
            return;
        }
        
        console.log("初始化分割线", { rows, cols, imageWidth: originalImage.width, imageHeight: originalImage.height });
        
        // 根据行列数初始化分割线位置
        const newHLines = [];
        const newVLines = [];
        
        // 计算水平分割线位置
        const rowHeight = originalImage.height / rows;
        for (let i = 1; i < rows; i++) {
            newHLines.push(Math.round(i * rowHeight));
        }
        
        // 计算垂直分割线位置
        const colWidth = originalImage.width / cols;
        for (let i = 1; i < cols; i++) {
            newVLines.push(Math.round(i * colWidth));
        }
        
        console.log("计算的分割线位置", { 水平线: newHLines, 垂直线: newVLines });
        
        // 更新状态
        setDraggableHLines(newHLines);
        setDraggableVLines(newVLines);
        
        // 确保canvas已经准备好
        setTimeout(() => {
            if (draggableLinesCanvasRef.current) {
                console.log("绘制分割线", { hasCanvas: !!draggableLinesCanvasRef.current });
                // 绘制分割线
                drawDraggableLines(newHLines, newVLines);
            } else {
                console.error("Canvas未准备好，无法绘制分割线");
            }
        }, 100);
    };
    
    // 绘制可拖动分割线
    const drawDraggableLines = (hLines = draggableHLines, vLines = draggableVLines) => {
        if (!originalImage || !draggableLinesCanvasRef.current) {
            console.error("无法绘制分割线：", { 
                hasImage: !!originalImage, 
                hasCanvas: !!draggableLinesCanvasRef.current 
            });
            return;
        }
        
        const canvas = draggableLinesCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        console.log("绘制分割线", { 
            canvasWidth: canvas.width, 
            canvasHeight: canvas.height, 
            水平线: hLines, 
            垂直线: vLines 
        });
        
        // 清除画布并绘制原图
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);
        
        // 设置线条样式
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
        
        // 绘制水平分割线
        hLines.forEach((y, index) => {
            // 绘制线条
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
            
            // 绘制拖动手柄
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加标签
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`H${index + 1}`, canvas.width / 2, y);
        });
        
        // 绘制垂直分割线
        vLines.forEach((x, index) => {
            // 绘制线条
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
            
            // 绘制拖动手柄
            ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(x, canvas.height / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加标签
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`V${index + 1}`, x, canvas.height / 2);
        });
    };

    // 处理鼠标抬起（用于结束拖动）
    const handleMouseUp = () => {
        if (isDragging) {
            handleDragEnd();
        } else if (isDraggingBorder) {
            handleBorderDragEnd();
        }
    };

    // 处理鼠标移动（用于拖动线条和边框）
    const handleMouseMove = (e) => {
        // 处理拖动状态
        if (isDragging) {
            handleDrag(e);
            return;
        } else if (isDraggingBorder) {
            handleBorderDrag(e);
            return;
        }
        
        // 以下是非拖动状态下的鼠标悬停检测
        if (useDraggableLines && draggableLinesCanvasRef.current) {
            const canvas = draggableLinesCanvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // 检查是否悬停在水平分割线上
            let isOnHLine = false;
            for (let i = 0; i < draggableHLines.length; i++) {
                if (Math.abs(y - draggableHLines[i]) <= 15) {
                    isOnHLine = true;
                    break;
                }
            }
            
            // 检查是否悬停在垂直分割线上
            let isOnVLine = false;
            if (!isOnHLine) { // 优先选择水平线
                for (let i = 0; i < draggableVLines.length; i++) {
                    if (Math.abs(x - draggableVLines[i]) <= 15) {
                        isOnVLine = true;
                        break;
                    }
                }
            }
            
            // 更新鼠标样式
            if (isOnHLine) {
                canvas.style.cursor = 'ns-resize';
            } else if (isOnVLine) {
                canvas.style.cursor = 'ew-resize';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        } else if (useCropBorder && cropBorderCanvasRef.current) {
            const canvas = cropBorderCanvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const controlSize = 12; // 控制点大小
            
            // 简化鼠标悬停检测逻辑
            let cursorStyle = 'crosshair';
            
            // 检查角落控制点
            if ((Math.abs(x - cropBorder.left) < controlSize && Math.abs(y - cropBorder.top) < controlSize) ||
                (Math.abs(x - cropBorder.right) < controlSize && Math.abs(y - cropBorder.bottom) < controlSize)) {
                cursorStyle = 'nwse-resize'; // 左上-右下对角线调整
            } else if ((Math.abs(x - cropBorder.right) < controlSize && Math.abs(y - cropBorder.top) < controlSize) ||
                       (Math.abs(x - cropBorder.left) < controlSize && Math.abs(y - cropBorder.bottom) < controlSize)) {
                cursorStyle = 'nesw-resize'; // 右上-左下对角线调整
            } 
            // 检查边缘控制点
            else if (Math.abs(x - cropBorder.left) < controlSize && Math.abs(y - (cropBorder.top + cropBorder.bottom)/2) < controlSize ||
                     Math.abs(x - cropBorder.right) < controlSize && Math.abs(y - (cropBorder.top + cropBorder.bottom)/2) < controlSize) {
                cursorStyle = 'ew-resize'; // 水平调整
            } else if (Math.abs(x - (cropBorder.left + cropBorder.right)/2) < controlSize && Math.abs(y - cropBorder.top) < controlSize ||
                       Math.abs(x - (cropBorder.left + cropBorder.right)/2) < controlSize && Math.abs(y - cropBorder.bottom) < controlSize) {
                cursorStyle = 'ns-resize'; // 垂直调整
            }
            
            // 只有当样式需要改变时才设置，减少不必要的DOM操作
            if (canvas.style.cursor !== cursorStyle) {
                canvas.style.cursor = cursorStyle;
            }
        }
    };

    // 添加全局鼠标事件监听
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            handleMouseMove(e);
        };
        
        const handleGlobalMouseUp = () => {
            handleMouseUp();
        };
        
        document.addEventListener("mouseup", handleGlobalMouseUp);
        document.addEventListener("mousemove", handleGlobalMouseMove);
        
        return () => {
            document.removeEventListener("mouseup", handleGlobalMouseUp);
            document.removeEventListener("mousemove", handleGlobalMouseMove);
        };
    }, [isDragging, isDraggingBorder, currentDragLine, draggedBorder, useDraggableLines, useCropBorder, cropBorder]);

    // 应用裁剪边框
    const applyCropBorder = () => {
        if (!originalImage || !cropBorderCanvasRef.current) return;
        
        // 创建一个新的canvas来裁剪图像
        const canvas = document.createElement("canvas");
        const cropWidth = cropBorder.right - cropBorder.left;
        const cropHeight = cropBorder.bottom - cropBorder.top;
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
            originalImage,
            cropBorder.left, cropBorder.top, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // 创建新的Image对象
        const croppedImage = new Image();
        croppedImage.onload = () => {
            setOriginalImage(croppedImage);
            // 重置裁剪边框
            setUseCropBorder(false);
        };
        croppedImage.src = canvas.toDataURL("image/png");
    };

    // 处理分割线拖拽开始
    const handleDragStart = (e) => {
        if (!useDraggableLines || !draggableLinesCanvasRef.current) {
            console.error("拖拽条件不满足:", { useDraggableLines, hasCanvas: !!draggableLinesCanvasRef.current });
            return;
        }
        
        const canvas = draggableLinesCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        
        console.log("鼠标点击位置:", { x, y, canvasWidth: canvas.width, canvasHeight: canvas.height });
        console.log("当前分割线:", { 水平线: draggableHLines, 垂直线: draggableVLines });
        
        // 检查是否点击了水平分割线
        for (let i = 0; i < draggableHLines.length; i++) {
            if (Math.abs(y - draggableHLines[i]) <= 15) {
                console.log("选中水平线:", i, draggableHLines[i]);
                
                // 标记开始拖动
                setIsDragging(true);
                setCurrentDragLine({ type: 'horizontal', index: i });
                canvas.style.cursor = 'ns-resize';
                return;
            }
        }
        
        // 检查是否点击了垂直分割线
        for (let i = 0; i < draggableVLines.length; i++) {
            if (Math.abs(x - draggableVLines[i]) <= 15) {
                console.log("选中垂直线:", i, draggableVLines[i]);
                
                // 标记开始拖动
                setIsDragging(true);
                setCurrentDragLine({ type: 'vertical', index: i });
                canvas.style.cursor = 'ew-resize';
                return;
            }
        }
        
        console.log("未选中任何分割线");
    };
    
    // 处理分割线拖拽
    const handleDrag = (e) => {
        if (!isDragging || !currentDragLine || !draggableLinesCanvasRef.current) return;
        
        const canvas = draggableLinesCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (currentDragLine.type === 'horizontal') {
            const moveY = (e.clientY - rect.top) * scaleY;
            const newY = Math.max(0, Math.min(canvas.height, moveY));
            
            const newHLines = [...draggableHLines];
            newHLines[currentDragLine.index] = newY;
            setDraggableHLines(newHLines);
            drawDraggableLines(newHLines, draggableVLines);
        } else if (currentDragLine.type === 'vertical') {
            const moveX = (e.clientX - rect.left) * scaleX;
            const newX = Math.max(0, Math.min(canvas.width, moveX));
            
            const newVLines = [...draggableVLines];
            newVLines[currentDragLine.index] = newX;
            setDraggableVLines(newVLines);
            drawDraggableLines(draggableHLines, newVLines);
        }
    };
    
    // 处理分割线拖拽结束
    const handleDragEnd = () => {
        setIsDragging(false);
        setCurrentDragLine(null);
        if (draggableLinesCanvasRef.current) {
            draggableLinesCanvasRef.current.style.cursor = 'crosshair';
        }
    };
    
    // 处理边框拖动开始
    const handleBorderDragStart = (e) => {
        if (!cropBorderCanvasRef.current || !useCropBorder) return;
        
        const canvas = cropBorderCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const controlSize = 12; // 稍微大一点以便于点击
        
        // 检查是否点击了控制点
        // 左上角
        if (Math.abs(x - cropBorder.left) < controlSize && Math.abs(y - cropBorder.top) < controlSize) {
            setDraggedBorder("topLeft");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'nwse-resize';
        }
        // 右上角
        else if (Math.abs(x - cropBorder.right) < controlSize && Math.abs(y - cropBorder.top) < controlSize) {
            setDraggedBorder("topRight");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'nesw-resize';
        }
        // 左下角
        else if (Math.abs(x - cropBorder.left) < controlSize && Math.abs(y - cropBorder.bottom) < controlSize) {
            setDraggedBorder("bottomLeft");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'nesw-resize';
        }
        // 右下角
        else if (Math.abs(x - cropBorder.right) < controlSize && Math.abs(y - cropBorder.bottom) < controlSize) {
            setDraggedBorder("bottomRight");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'nwse-resize';
        }
        // 左边中点
        else if (Math.abs(x - cropBorder.left) < controlSize && Math.abs(y - (cropBorder.top + cropBorder.bottom)/2) < controlSize) {
            setDraggedBorder("left");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'ew-resize';
        }
        // 右边中点
        else if (Math.abs(x - cropBorder.right) < controlSize && Math.abs(y - (cropBorder.top + cropBorder.bottom)/2) < controlSize) {
            setDraggedBorder("right");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'ew-resize';
        }
        // 上边中点
        else if (Math.abs(x - (cropBorder.left + cropBorder.right)/2) < controlSize && Math.abs(y - cropBorder.top) < controlSize) {
            setDraggedBorder("top");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'ns-resize';
        }
        // 下边中点
        else if (Math.abs(x - (cropBorder.left + cropBorder.right)/2) < controlSize && Math.abs(y - cropBorder.bottom) < controlSize) {
            setDraggedBorder("bottom");
            setIsDraggingBorder(true);
            canvas.style.cursor = 'ns-resize';
        }
    };
    
    // 处理边框拖动
    const handleBorderDrag = (e) => {
        if (!isDraggingBorder || !cropBorderCanvasRef.current) return;
        
        const canvas = cropBorderCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        // 直接使用鼠标位置，不进行额外的缩放计算
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newBorder = { ...cropBorder };
        
        switch (draggedBorder) {
            case "topLeft":
                newBorder.left = Math.min(newBorder.right - 20, x);
                newBorder.top = Math.min(newBorder.bottom - 20, y);
                break;
            case "topRight":
                newBorder.right = Math.max(newBorder.left + 20, x);
                newBorder.top = Math.min(newBorder.bottom - 20, y);
                break;
            case "bottomLeft":
                newBorder.left = Math.min(newBorder.right - 20, x);
                newBorder.bottom = Math.max(newBorder.top + 20, y);
                break;
            case "bottomRight":
                newBorder.right = Math.max(newBorder.left + 20, x);
                newBorder.bottom = Math.max(newBorder.top + 20, y);
                break;
            case "left":
                newBorder.left = Math.min(newBorder.right - 20, x);
                break;
            case "right":
                newBorder.right = Math.max(newBorder.left + 20, x);
                break;
            case "top":
                newBorder.top = Math.min(newBorder.bottom - 20, y);
                break;
            case "bottom":
                newBorder.bottom = Math.max(newBorder.top + 20, y);
                break;
            default:
                break;
        }
        
        // 确保边框不超出图像范围
        newBorder.left = Math.max(0, Math.min(newBorder.left, canvas.width - 1));
        newBorder.top = Math.max(0, Math.min(newBorder.top, canvas.height - 1));
        newBorder.right = Math.max(0, Math.min(newBorder.right, canvas.width - 1));
        newBorder.bottom = Math.max(0, Math.min(newBorder.bottom, canvas.height - 1));
        
        // 直接更新状态
        setCropBorder(newBorder);
        
        // 直接绘制，不等待状态更新
        const ctx = canvas.getContext("2d");
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制原始图像（半透明）
        ctx.globalAlpha = 0.5;
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        
        // 绘制裁剪区域
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(
            newBorder.left,
            newBorder.top,
            newBorder.right - newBorder.left,
            newBorder.bottom - newBorder.top
        );
        ctx.stroke();
        
        // 绘制边框控制点
        const controlSize = 8;
        ctx.fillStyle = "red";
        
        // 左上角
        ctx.fillRect(newBorder.left - controlSize/2, newBorder.top - controlSize/2, controlSize, controlSize);
        // 右上角
        ctx.fillRect(newBorder.right - controlSize/2, newBorder.top - controlSize/2, controlSize, controlSize);
        // 左下角
        ctx.fillRect(newBorder.left - controlSize/2, newBorder.bottom - controlSize/2, controlSize, controlSize);
        // 右下角
        ctx.fillRect(newBorder.right - controlSize/2, newBorder.bottom - controlSize/2, controlSize, controlSize);
        
        // 中间边缘点
        ctx.fillRect(newBorder.left - controlSize/2, (newBorder.top + newBorder.bottom)/2 - controlSize/2, controlSize, controlSize);
        ctx.fillRect(newBorder.right - controlSize/2, (newBorder.top + newBorder.bottom)/2 - controlSize/2, controlSize, controlSize);
        ctx.fillRect((newBorder.left + newBorder.right)/2 - controlSize/2, newBorder.top - controlSize/2, controlSize, controlSize);
        ctx.fillRect((newBorder.left + newBorder.right)/2 - controlSize/2, newBorder.bottom - controlSize/2, controlSize, controlSize);
    };
    
    // 处理边框拖动结束
    const handleBorderDragEnd = () => {
        setIsDraggingBorder(false);
        setDraggedBorder(null);
    };
    
    // 绘制裁剪边框
    const drawCropBorder = () => {
        if (!cropBorderCanvasRef.current || !originalImage) return;
        
        const canvas = cropBorderCanvasRef.current;
        const ctx = canvas.getContext("2d");
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制原始图像（半透明）
        ctx.globalAlpha = 0.5;
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        
        // 绘制裁剪区域
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(
            cropBorder.left,
            cropBorder.top,
            cropBorder.right - cropBorder.left,
            cropBorder.bottom - cropBorder.top
        );
        ctx.stroke();
        
        // 绘制边框控制点
        const controlSize = 8;
        ctx.fillStyle = "red";
        
        // 左上角
        ctx.fillRect(cropBorder.left - controlSize/2, cropBorder.top - controlSize/2, controlSize, controlSize);
        // 右上角
        ctx.fillRect(cropBorder.right - controlSize/2, cropBorder.top - controlSize/2, controlSize, controlSize);
        // 左下角
        ctx.fillRect(cropBorder.left - controlSize/2, cropBorder.bottom - controlSize/2, controlSize, controlSize);
        // 右下角
        ctx.fillRect(cropBorder.right - controlSize/2, cropBorder.bottom - controlSize/2, controlSize, controlSize);
        
        // 中间边缘点
        ctx.fillRect(cropBorder.left - controlSize/2, (cropBorder.top + cropBorder.bottom)/2 - controlSize/2, controlSize, controlSize);
        ctx.fillRect(cropBorder.right - controlSize/2, (cropBorder.top + cropBorder.bottom)/2 - controlSize/2, controlSize, controlSize);
        ctx.fillRect((cropBorder.left + cropBorder.right)/2 - controlSize/2, cropBorder.top - controlSize/2, controlSize, controlSize);
        ctx.fillRect((cropBorder.left + cropBorder.right)/2 - controlSize/2, cropBorder.bottom - controlSize/2, controlSize, controlSize);
    };
    
    // 切换使用裁剪边框
    const toggleUseCropBorder = () => {
        const newUseCropBorder = !useCropBorder;
        setUseCropBorder(newUseCropBorder);
        
        if (newUseCropBorder) {
            setUseDraggableLines(false); // 关闭自定义分割线
            
            // 初始化裁剪边框为图像边缘的10%内缩
            if (originalImage) {
                const width = originalImage.width;
                const height = originalImage.height;
                const newBorder = {
                    left: Math.round(width * 0.1),
                    top: Math.round(height * 0.1),
                    right: Math.round(width * 0.9),
                    bottom: Math.round(height * 0.9)
                };
                
                setCropBorder(newBorder);
                
                // 给DOM渲染一点时间，然后绘制裁剪边框
                setTimeout(() => {
                    if (cropBorderCanvasRef.current) {
                        const canvas = cropBorderCanvasRef.current;
                        const ctx = canvas.getContext("2d");
                        
                        // 确保画布大小与图像一致
                        canvas.width = width;
                        canvas.height = height;
                        
                        // 清除画布
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        
                        // 绘制原始图像（半透明）
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
                        ctx.globalAlpha = 1.0;
                        
                        // 绘制裁剪区域
                        ctx.strokeStyle = "red";
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.rect(
                            newBorder.left,
                            newBorder.top,
                            newBorder.right - newBorder.left,
                            newBorder.bottom - newBorder.top
                        );
                        ctx.stroke();
                        
                        // 绘制边框控制点
                        const controlSize = 8;
                        ctx.fillStyle = "red";
                        
                        // 左上角
                        ctx.fillRect(newBorder.left - controlSize/2, newBorder.top - controlSize/2, controlSize, controlSize);
                        // 右上角
                        ctx.fillRect(newBorder.right - controlSize/2, newBorder.top - controlSize/2, controlSize, controlSize);
                        // 左下角
                        ctx.fillRect(newBorder.left - controlSize/2, newBorder.bottom - controlSize/2, controlSize, controlSize);
                        // 右下角
                        ctx.fillRect(newBorder.right - controlSize/2, newBorder.bottom - controlSize/2, controlSize, controlSize);
                        
                        // 中间边缘点
                        ctx.fillRect(newBorder.left - controlSize/2, (newBorder.top + newBorder.bottom)/2 - controlSize/2, controlSize, controlSize);
                        ctx.fillRect(newBorder.right - controlSize/2, (newBorder.top + newBorder.bottom)/2 - controlSize/2, controlSize, controlSize);
                        ctx.fillRect((newBorder.left + newBorder.right)/2 - controlSize/2, newBorder.top - controlSize/2, controlSize, controlSize);
                        ctx.fillRect((newBorder.left + newBorder.right)/2 - controlSize/2, newBorder.bottom - controlSize/2, controlSize, controlSize);
                    }
                }, 50);
            }
        }
    };
    
    // 应用可拖动分割线
    const applyDraggableLines = () => {
        if (!originalImage) return;
        
        // 根据分割线位置计算精灵
        const newSprites = [];
        
        // 计算所有区域的边界
        const hBoundaries = [0, ...draggableHLines, originalImage.height];
        const vBoundaries = [0, ...draggableVLines, originalImage.width];
        
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // 为每个区域创建精灵
        for (let y = 0; y < hBoundaries.length - 1; y++) {
            for (let x = 0; x < vBoundaries.length - 1; x++) {
                const spriteX = vBoundaries[x];
                const spriteY = hBoundaries[y];
                const spriteWidth = vBoundaries[x + 1] - vBoundaries[x];
                const spriteHeight = hBoundaries[y + 1] - hBoundaries[y];
                
                // 设置临时画布尺寸
                tempCanvas.width = spriteWidth;
                tempCanvas.height = spriteHeight;
                
                // 绘制精灵
                tempCtx.drawImage(
                    originalImage,
                    spriteX, spriteY, spriteWidth, spriteHeight,
                    0, 0, spriteWidth, spriteHeight
                );
                
                // 保存精灵数据
                newSprites.push({
                    id: y * (vBoundaries.length - 1) + x,
                    image: tempCanvas.toDataURL(),
                    x: spriteX,
                    y: spriteY,
                    width: spriteWidth,
                    height: spriteHeight,
                    originalX: spriteX,
                    originalY: spriteY,
                    originalWidth: spriteWidth,
                    originalHeight: spriteHeight,
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
    
    // 当图片加载或分割模式改变时，初始化可拖动分割线
    useEffect(() => {
        if (originalImage && useDraggableLines) {
            console.log("自动初始化分割线");
            // 给DOM一点时间渲染
            setTimeout(() => {
                initDraggableLines();
            }, 100);
        }
    }, [originalImage, useDraggableLines, rows, cols]);

    // 当useCropBorder或originalImage变化时，初始化并绘制裁剪边框
    useEffect(() => {
        if (originalImage && useCropBorder) {
            console.log("初始化裁剪边框");
            // 给DOM一点时间渲染
            setTimeout(() => {
                drawCropBorder();
            }, 100);
        }
    }, [originalImage, useCropBorder]);

    // 导出所有分割图为PNG
    const exportSplitImages = () => {
        try {
            const zip = new JSZip();
            const imgFolder = zip.folder("split_images");
            
            // 获取要导出的帧
            const reorderedSprites = frameOrder.map(id => sprites.find(s => s.id === id));
            const exportPromises = [];

            // 为每个帧创建PNG并添加到ZIP中
            reorderedSprites.forEach((sprite, index) => {
                const canvas = document.createElement("canvas");
                canvas.width = sprite.width;
                canvas.height = sprite.height;
                const ctx = canvas.getContext("2d");
                
                // 绘制精灵到画布上
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
                
                // 将画布转换为Blob
                const promise = new Promise(resolve => {
                    canvas.toBlob(blob => {
                        imgFolder.file(`frame_${(index + 1).toString().padStart(3, '0')}.png`, blob);
                        resolve();
                    }, "image/png");
                });
                
                exportPromises.push(promise);
            });
            
            // 当所有图像都处理完毕后生成并下载ZIP文件
            Promise.all(exportPromises).then(() => {
                zip.generateAsync({ type: "blob" }).then(content => {
                    const url = URL.createObjectURL(content);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "split_images.zip";
                    link.click();
                    URL.revokeObjectURL(url);
                });
            });
        } catch (error) {
            console.error("导出分割图失败:", error);
            
            // 回退方案：如果无法创建ZIP，则逐个下载图像
            alert("无法创建ZIP包，将逐个下载图像");
            
            const reorderedSprites = frameOrder.map(id => sprites.find(s => s.id === id));
            
            // 使用setTimeout循环下载，避免浏览器阻止多个下载
            const downloadSequentially = (index) => {
                if (index >= reorderedSprites.length) return;
                
                const sprite = reorderedSprites[index];
                const canvas = document.createElement("canvas");
                canvas.width = sprite.width;
                canvas.height = sprite.height;
                const ctx = canvas.getContext("2d");
                
                // 绘制精灵到画布上
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
                
                // 下载单个PNG
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `frame_${(index + 1).toString().padStart(3, '0')}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                    
                    // 延迟下载下一个
                    setTimeout(() => downloadSequentially(index + 1), 300);
                }, "image/png");
            };
            
            // 开始顺序下载
            downloadSequentially(0);
        }
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
                    <div className='basic-settings'>
                        <div className='grid-control'>
                            <div className='input-group'>
                                <label>{t.cols}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={cols}
                                    onChange={e => handleGridChange(e, "cols")}
                                />
                            </div>
                            <div className='input-group'>
                                <label>{t.rows}</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={rows}
                                    onChange={e => handleGridChange(e, "rows")}
                                />
                            </div>
                            <div className='input-group'>
                                <label>{t.frameDelay}</label>
                                <input
                                    type='number'
                                    min='10'
                                    max='1000'
                                    value={delay}
                                    onChange={e => setDelay(parseInt(e.target.value))}
                                />
                                <span>ms</span>
                            </div>
                            <div className='input-group draggable-toggle'>
                                <input
                                    type='checkbox'
                                    id='use-draggable-lines'
                                    checked={useDraggableLines}
                                    onChange={toggleUseDraggableLines}
                                />
                                <label htmlFor='use-draggable-lines'>{t.useDraggableLines}</label>
                            </div>
                            <div className='input-group crop-toggle'>
                                <input
                                    type='checkbox'
                                    id='use-crop-border'
                                    checked={useCropBorder}
                                    onChange={toggleUseCropBorder}
                                />
                                <label htmlFor='use-crop-border'>{t.useCropBorder}</label>
                            </div>
                        </div>
                    </div>
                    
                    {useDraggableLines && (
                        <div className='draggable-lines-section'>
                            <div className="draggable-lines-container">
                                <canvas 
                                    ref={draggableLinesCanvasRef} 
                                    width={originalImage.width} 
                                    height={originalImage.height} 
                                    onMouseMove={handleMouseMove}
                                    onMouseDown={handleDragStart}
                                    className="draggable-lines-canvas"
                                />
                                <div className="draggable-lines-info">
                                    {t.dragLinesInfo}
                                </div>
                            </div>
                            <div className='actions'>
                                <button onClick={applyDraggableLines} className='primary-button'>
                                    {t.applyDraggableLines}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {useCropBorder && (
                        <div className='crop-border-section'>
                            <div className="crop-border-container">
                                <canvas 
                                    ref={cropBorderCanvasRef} 
                                    width={originalImage.width} 
                                    height={originalImage.height} 
                                    onMouseDown={handleBorderDragStart}
                                    className="crop-border-canvas"
                                />
                                <div className="crop-border-info">
                                    {t.dragBorderInfo}
                                </div>
                            </div>
                            <div className='actions'>
                                <button onClick={applyCropBorder} className='primary-button'>
                                    {t.applyCropBorder}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {!useDraggableLines && !useCropBorder && (
                        <div className='sprite-preview'>
                            <div className='info-box'>
                                <span>
                                    {t.generateInfo} {cols} × {rows} = {cols * rows} {t.frames}
                                </span>
                                <span>
                                    {t.eachFrame} {Math.round(originalImage.width / cols)} × {Math.round(originalImage.height / rows)} {t.px}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 隐藏的画布用于图像处理 */}
            <canvas ref={canvasRef} className="hidden-canvas" />
            <canvas ref={gridCanvasRef} className="hidden-canvas" />

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
                        <div className='frames-list'>
                            {frameOrder.map((id, index) => {
                                const sprite = sprites.find(s => s.id === id);
                                if (!sprite) return null;

                                return (
                                    <div
                                        key={id}
                                        className={`frame-item ${
                                            selectedFrameId === id ? "selected" : ""
                                        }`}
                                        onClick={() => setSelectedFrameId(id)}
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

                        {gifPreview && (
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
                                            <polyline points='7 10 12 3 17 10'></polyline>
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
                                            <polyline points='7 10 12 3 17 10'></polyline>
                                            <line x1='12' y1='15' x2='12' y2='3'></line>
                                        </svg>
                                        {t.saveApng}
                                    </button>
                                    <button onClick={exportSplitImages} className='save-button save-split-images'>
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
                                            <polyline points='7 10 12 3 17 10'></polyline>
                                            <line x1='12' y1='15' x2='12' y2='3'></line>
                                        </svg>
                                        {t.exportSplitImages}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* GitHub链接 */}
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
            </footer>
        </div>
    );
}

export default App;
