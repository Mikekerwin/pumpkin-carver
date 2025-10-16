import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import wholePumpkin from "./assets/whole_pumpkin.jpg";
import cutoutPumpkin from "./assets/cutout_pumpkin.jpg";
import knifeImg from "./assets/knife.png";

function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [knifePos, setKnifePos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const scaledDimsRef = useRef({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  const MAX_UNDO = 20;
  const strokesRef = useRef([]);
  const currentPathRef = useRef([]);

  // Calculate image dimensions to fit inside screen with "contain"
  const calculateContainDims = (img) => {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const imgRatio = img.width / img.height;
    const windowRatio = windowW / windowH;

    let width, height, offsetX, offsetY;

    if (imgRatio > windowRatio) {
      width = windowW;
      height = width / imgRatio;
      offsetX = 0;
      offsetY = (windowH - height) / 2;
    } else {
      height = windowH;
      width = height * imgRatio;
      offsetX = (windowW - width) / 2;
      offsetY = 0;
    }

    scaledDimsRef.current = { width, height, offsetX, offsetY };
    return { width, height, offsetX, offsetY };
  };

  // Resize canvas to match image
  const resizeCanvas = () => {
    if (!imgRef.current) return;
    const canvas = canvasRef.current;
    const { width, height, offsetX, offsetY } = calculateContainDims(imgRef.current);

    canvas.width = width;
    canvas.height = height;
    canvas.style.left = offsetX + "px";
    canvas.style.top = offsetY + "px";

    drawAll();
  };

  useEffect(() => {
    const img = new Image();
    img.src = wholePumpkin;
    img.onload = () => {
      imgRef.current = img;
      resizeCanvas();
    };

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const addPoint = (e) => {
    const { offsetX, offsetY } = scaledDimsRef.current;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    currentPathRef.current.push({ x, y });
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    currentPathRef.current = [];
    addPoint(e);
  };

  const stopDrawing = (e) => {
    e?.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPathRef.current.length > 2) {
      strokesRef.current.push({ path: [...currentPathRef.current] });
      if (strokesRef.current.length > MAX_UNDO) strokesRef.current.shift();
    }

    currentPathRef.current = [];
    drawAll();
  };

  const drawAll = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = scaledDimsRef.current;

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, imgRef.current.width, imgRef.current.height, 0, 0, width, height);

    for (let stroke of strokesRef.current) {
      const path = stroke.path;

      // Shadow
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.moveTo(path[0].x + 5, path[0].y + 5);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x + 5, path[i].y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Carve
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.closePath();
      ctx.fill();
    }
  };

  const handleMove = (e) => {
    e.preventDefault();
    setKnifePos({ x: e.clientX, y: e.clientY });

    if (!isDrawing) return;
    addPoint(e);
    drawAll();

    // thin black line preview while dragging
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const path = currentPathRef.current;
    if (path.length > 1) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }
  };

  const handleUndo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    drawAll();
  };

  return (
    <div className="App">
      {/* Bottom image */}
      <img
        src={cutoutPumpkin}
        alt="cutout pumpkin"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          zIndex: 0,
        }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", zIndex: 1, cursor: "none" }}
        onPointerDown={startDrawing}
        onPointerMove={handleMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />

      {/* Knife */}
      <img
        src={knifeImg}
        alt="knife"
        style={{
          position: "absolute",
          left: knifePos.x,
          top: knifePos.y,
          width: "200px",
          height: "200px",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Controls */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 3 }}>
        <button style={{ marginBottom: "10px", padding: "10px 20px", fontSize: "16px" }} onClick={handleUndo}>
          Undo
        </button>
      </div>
    </div>
  );
}

export default App;
